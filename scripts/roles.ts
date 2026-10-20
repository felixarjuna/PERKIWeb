/**
 * Dry-run-first CLI for initial role grants and duplicate-account cleanup.
 *
 *   pnpm roles grant --owner <email> --mita "<name or email>" --writer "<name or email>"
 *   pnpm roles cleanup --email <email> [--email <email> ...] [--id <userId> ...]
 *
 * Add `--apply` to perform the changes. A non-local database additionally
 * needs `--confirm-host <hostname>`.
 */

import { parseArgs } from "node:util";
import { config } from "dotenv";
import { inArray, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import {
  accounts,
  roleChanges,
  sessions,
  users,
} from "../src/lib/db/schema/schema";
import {
  type AccountSummary,
  describeAccount,
  type PlannedChange,
  planCleanup,
  planGrants,
} from "../src/lib/role-grants";
import { normalizeRole } from "../src/lib/roles";

config();

const LOCAL_HOSTS = new Set(["127.0.0.1", "localhost"]);

const USAGE = `Usage:
  pnpm roles grant [--owner <email>] [--mita <name|email>]... [--writer <name|email>]... [--apply] [--confirm-host <host>]
  pnpm roles cleanup [--email <email>]... [--id <userId>]... [--apply] [--confirm-host <host>]`;

const fail = (message: string): never => {
  console.error(message);
  process.exit(1);
};

type Db = ReturnType<typeof drizzle>;

async function loadAccounts(db: Db): Promise<AccountSummary[]> {
  // Acknowledgements only count prayers listing the account id; legacy
  // username entries in `prayerNames` are not attributed to any account.
  const rows = await db.execute<{
    id: string;
    name: string | null;
    email: string | null;
    role: string;
    has_profile: boolean;
    prayer_count: number;
    takeaway_count: number;
    acknowledgement_count: number;
  }>(sql`
    select
      u.id, u.name, u.email, u.role,
      exists (select 1 from profiles p where p."userId" = u.id) as has_profile,
      (select count(*)::int from prayers p where p."authorId" = u.id) as prayer_count,
      (select count(*)::int from takeaways t where t."authorId" = u.id) as takeaway_count,
      (select count(*)::int from prayers p
        where jsonb_typeof(p."prayerNames"::jsonb) = 'array'
          and p."prayerNames"::jsonb @> to_jsonb(u.id)) as acknowledgement_count
    from "user" u
    order by u."createdAt"
  `);
  return Array.from(rows, (row) => ({
    acknowledgementCount: row.acknowledgement_count,
    email: row.email,
    hasProfile: row.has_profile,
    id: row.id,
    name: row.name,
    prayerCount: row.prayer_count,
    role: normalizeRole(row.role),
    takeawayCount: row.takeaway_count,
  }));
}

const printList = (title: string, lines: string[]) => {
  console.log(`\n${title}`);
  for (const line of lines) {
    console.log(`  ${line}`);
  }
};

function reportProblems(problems: string[]) {
  if (problems.length > 0) {
    printList("Problems:", problems);
    console.error("\nNothing applied: fix the problems above first.");
    process.exit(1);
  }
}

async function runGrant(
  db: Db,
  values: ReturnType<typeof parseCli>["values"],
  apply: boolean
) {
  const request = {
    mita: values.mita,
    owner: values.owner,
    writer: values.writer,
  };
  if (!(request.owner || request.mita?.length || request.writer?.length)) {
    fail(`Nothing to grant.\n${USAGE}`);
  }
  const plan = planGrants(await loadAccounts(db), request);
  if (plan.unrequestedStaff.length > 0) {
    printList(
      "Current staff not in this request (unchanged):",
      plan.unrequestedStaff.map((a) => `${describeAccount(a)}: ${a.role}`)
    );
  }
  reportProblems(plan.problems);

  if (plan.changes.length === 0) {
    console.log("\nNo changes needed.");
    return;
  }
  printList(
    "Planned role changes:",
    plan.changes.map((c) => `${c.label}: ${c.from} -> ${c.to}`)
  );
  if (!apply) {
    console.log("\nDry run: nothing applied. Re-run with --apply.");
    return;
  }
  await db.transaction(async (tx) => {
    for (const change of plan.changes) {
      // biome-ignore lint/performance/noAwaitInLoops: changes apply in order inside one transaction
      await applyChange(tx, change);
    }
  });
  console.log(`\nApplied ${plan.changes.length} change(s).`);
}

async function applyChange(
  tx: Pick<Db, "update" | "insert">,
  change: PlannedChange
) {
  const updated = await tx
    .update(users)
    .set({ role: change.to })
    .where(
      sql`${users.id} = ${change.userId} and ${normalizedRole(users.role)} = ${change.from}`
    )
    .returning({ id: users.id });
  if (updated.length !== 1) {
    throw new Error(`${change.label} changed since planning; aborting.`);
  }
  await tx.insert(roleChanges).values({
    changedById: null,
    fromRole: change.from,
    toRole: change.to,
    userId: change.userId,
  });
}

// Legacy `admin` is stored but read as `mita`.
const normalizedRole = (column: typeof users.role) =>
  sql`case when ${column} = 'admin' then 'mita' else ${column} end`;

async function runCleanup(
  db: Db,
  values: ReturnType<typeof parseCli>["values"],
  apply: boolean
) {
  const emails = values.email ?? [];
  const ids = values.id ?? [];
  if (emails.length === 0 && ids.length === 0) {
    fail(`No --email or --id given.\n${USAGE}`);
  }
  const history = await db
    .selectDistinct({ userId: roleChanges.userId })
    .from(roleChanges);
  const plan = planCleanup(
    await loadAccounts(db),
    { emails, ids },
    new Set(history.map((row) => row.userId))
  );
  reportProblems(
    plan.notFound.map((target) => `No account has that email or id: ${target}`)
  );

  if (plan.kept.length > 0) {
    printList(
      "Kept (still referenced):",
      plan.kept.map((k) => `${describeAccount(k.account)}: ${k.reason}`)
    );
  }
  if (plan.deletable.length === 0) {
    console.log("\nNothing to delete.");
    return;
  }
  printList(
    "Would delete:",
    plan.deletable.map((a) => describeAccount(a))
  );
  if (!apply) {
    console.log("\nDry run: nothing applied. Re-run with --apply.");
    return;
  }
  const deleteIds = plan.deletable.map((a) => a.id);
  // account/session rows cascade from the user, but delete them explicitly so
  // this does not depend on the constraint definitions.
  await db.transaction(async (tx) => {
    await tx.delete(accounts).where(inArray(accounts.userId, deleteIds));
    await tx.delete(sessions).where(inArray(sessions.userId, deleteIds));
    await tx.delete(users).where(inArray(users.id, deleteIds));
  });
  console.log(`\nDeleted ${deleteIds.length} account(s).`);
}

function parseCli() {
  return parseArgs({
    allowPositionals: true,
    args: process.argv.slice(2),
    options: {
      apply: { type: "boolean" },
      "confirm-host": { type: "string" },
      email: { multiple: true, type: "string" },
      id: { multiple: true, type: "string" },
      mita: { multiple: true, type: "string" },
      owner: { type: "string" },
      writer: { multiple: true, type: "string" },
    },
  });
}

function checkHost(databaseUrl: string, apply: boolean, confirmHost?: string) {
  const url = new URL(databaseUrl);
  console.log(`Database host: ${url.host}`);
  if (apply && !LOCAL_HOSTS.has(url.hostname) && confirmHost !== url.hostname) {
    fail(
      `Refusing to --apply against non-local host "${url.hostname}" without --confirm-host ${url.hostname}.`
    );
  }
}

async function main() {
  const { positionals, values } = parseCli();
  const [command] = positionals;
  if (command !== "grant" && command !== "cleanup") {
    fail(USAGE);
  }
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    fail("DATABASE_URL is not set");
    return;
  }
  const apply = values.apply === true;
  checkHost(databaseUrl, apply, values["confirm-host"]);
  console.log(apply ? "Mode: APPLY" : "Mode: dry run");

  const connection = postgres(databaseUrl);
  try {
    const db = drizzle(connection);
    if (command === "grant") {
      await runGrant(db, values, apply);
    } else {
      await runCleanup(db, values, apply);
    }
  } finally {
    await connection.end();
  }
}

await main();
