import type { Role } from "./roles";

export interface AccountSummary {
  /**
   * Prayers whose `prayerNames` contains this account's id. Legacy entries
   * that hold a username are not attributed to any account.
   */
  acknowledgementCount: number;
  email: string | null;
  hasProfile: boolean;
  id: string;
  name: string | null;
  prayerCount: number;
  role: Role;
  takeawayCount: number;
}

export interface PlannedChange {
  from: Role;
  label: string;
  to: Role;
  userId: string;
}

export interface GrantRequest {
  mita?: string[];
  owner?: string;
  writer?: string[];
}

const TLD_PATTERN = /\.([^.]+)$/;

/** Masks an email for printed output, e.g. `je…@g….com`. */
export function maskEmail(email: string | null): string {
  if (!email) {
    return "(no email)";
  }
  const at = email.lastIndexOf("@");
  if (at < 1 || at === email.length - 1) {
    return "(invalid email)";
  }
  const local = email.slice(0, at);
  const domain = email.slice(at + 1);
  const tld = TLD_PATTERN.exec(domain)?.[1];
  const maskedDomain = tld
    ? `${domain.slice(0, 1)}….${tld}`
    : `${domain.slice(0, 1)}…`;
  return `${local.slice(0, 2)}…@${maskedDomain}`;
}

export const describeAccount = (account: AccountSummary) =>
  `${account.name ?? "(no name)"} <${maskEmail(account.email)}>`;

type Resolution =
  | { account: AccountSummary; problem?: undefined }
  | { account?: undefined; problem: string };

function resolve(accounts: AccountSummary[], identifier: string): Resolution {
  const needle = identifier.trim();
  const lower = needle.toLowerCase();
  const byEmail = accounts.filter((a) => a.email?.toLowerCase() === lower);
  const matches =
    byEmail.length > 0 ? byEmail : accounts.filter((a) => a.name === needle);
  if (matches.length === 1 && matches[0]) {
    return { account: matches[0] };
  }
  if (matches.length === 0) {
    return { problem: `No account matches "${identifier}"` };
  }
  return { problem: `${matches.length} accounts match "${identifier}"` };
}

export interface GrantPlan {
  changes: PlannedChange[];
  problems: string[];
  /**
   * Accounts that already hold mita or owner but are not in the request.
   * Informational only: never a problem and never changed.
   */
  unrequestedStaff: AccountSummary[];
}

export function planGrants(
  accounts: AccountSummary[],
  request: GrantRequest
): GrantPlan {
  const changes: PlannedChange[] = [];
  const problems: string[] = [];
  const requested = new Map<string, Role>();

  const requests: { identifier: string; to: Role }[] = [
    ...(request.owner
      ? [{ identifier: request.owner, to: "owner" as Role }]
      : []),
    ...(request.mita ?? []).map((identifier) => ({
      identifier,
      to: "mita" as Role,
    })),
    ...(request.writer ?? []).map((identifier) => ({
      identifier,
      to: "writer" as Role,
    })),
  ];

  for (const { identifier, to } of requests) {
    const result = resolve(accounts, identifier);
    if (!result.account) {
      problems.push(result.problem);
      continue;
    }
    const { account } = result;
    const label = describeAccount(account);
    const earlier = requested.get(account.id);
    if (earlier && earlier !== to) {
      problems.push(`${label} is requested as both ${earlier} and ${to}`);
      continue;
    }
    if (earlier) {
      continue;
    }
    requested.set(account.id, to);

    if (account.role === to) {
      continue;
    }
    if (to === "owner") {
      const other = accounts.find(
        (a) => a.role === "owner" && a.id !== account.id
      );
      if (other) {
        problems.push(
          `Cannot make ${label} the owner: ${describeAccount(other)} already is`
        );
        continue;
      }
    } else if (account.role === "owner") {
      problems.push(`Refusing to change the owner ${label} to ${to}`);
      continue;
    }
    changes.push({ from: account.role, label, to, userId: account.id });
  }

  const unrequestedStaff = accounts.filter(
    (a) => (a.role === "mita" || a.role === "owner") && !requested.has(a.id)
  );

  return { changes, problems, unrequestedStaff };
}

export interface CleanupTargets {
  emails?: string[];
  ids?: string[];
}

const referenceReasons = (
  account: AccountSummary,
  withRoleHistory: ReadonlySet<string>
) =>
  [
    account.hasProfile ? "has a profile" : null,
    account.prayerCount > 0 ? `${account.prayerCount} prayer(s)` : null,
    account.takeawayCount > 0 ? `${account.takeawayCount} takeaway(s)` : null,
    account.acknowledgementCount > 0
      ? `${account.acknowledgementCount} prayer acknowledgement(s)`
      : null,
    withRoleHistory.has(account.id) ? "has role history" : null,
  ].filter((reason) => reason !== null);

/**
 * Splits the targeted accounts (by `--email` or `--id`) into deletable ones
 * and ones still referenced. An account targeted twice is checked once.
 */
export function planCleanup(
  accounts: AccountSummary[],
  targets: CleanupTargets,
  withRoleHistory: ReadonlySet<string> = new Set()
): {
  deletable: AccountSummary[];
  kept: { account: AccountSummary; reason: string }[];
  notFound: string[];
} {
  const deletable: AccountSummary[] = [];
  const kept: { account: AccountSummary; reason: string }[] = [];
  const notFound: string[] = [];
  const seen = new Set<string>();

  const lookups = [
    ...(targets.emails ?? []).map((email) => ({
      find: (a: AccountSummary) =>
        a.email?.toLowerCase() === email.trim().toLowerCase(),
      identifier: email,
    })),
    ...(targets.ids ?? []).map((id) => ({
      find: (a: AccountSummary) => a.id === id.trim(),
      identifier: id,
    })),
  ];

  for (const { find, identifier } of lookups) {
    const account = accounts.find(find);
    if (!account) {
      notFound.push(identifier);
      continue;
    }
    if (seen.has(account.id)) {
      continue;
    }
    seen.add(account.id);
    const reasons = referenceReasons(account, withRoleHistory);
    if (reasons.length > 0) {
      kept.push({ account, reason: reasons.join(", ") });
    } else {
      deletable.push(account);
    }
  }

  return { deletable, kept, notFound };
}
