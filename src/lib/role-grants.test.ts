import { describe, expect, it } from "vitest";
import {
  type AccountSummary,
  maskEmail,
  planCleanup,
  planGrants,
} from "./role-grants";
import type { Role } from "./roles";

const account = (
  id: string,
  name: string | null,
  email: string | null,
  overrides: Partial<AccountSummary> = {}
): AccountSummary => ({
  acknowledgementCount: 0,
  email,
  hasProfile: false,
  id,
  name,
  prayerCount: 0,
  role: "member" as Role,
  takeawayCount: 0,
  ...overrides,
});

describe("maskEmail", () => {
  it("keeps two characters of the local part, one of the domain and the TLD", () => {
    expect(maskEmail("jenny@test.local")).toBe("je…@t….local");
  });

  it("handles short parts and missing emails", () => {
    expect(maskEmail("a@b.org")).toBe("a…@b….org");
    expect(maskEmail(null)).toBe("(no email)");
    expect(maskEmail("not-an-email")).toBe("(invalid email)");
  });
});

describe("planGrants", () => {
  const accounts = [
    account("1", "Alice", "alice@test.local"),
    account("2", "Sam Q", "sam1@test.local"),
    account("3", "Sam Q", "sam2@test.local"),
    account("4", "Bob", "bob@test.local", { role: "writer" }),
  ];

  it("matches by email first, then by exact name, and reports ambiguity", () => {
    const plan = planGrants(accounts, {
      mita: ["ALICE@test.local", "Bob", "Sam Q", "Nobody"],
    });
    expect(plan.changes.map((c) => [c.userId, c.to])).toEqual([
      ["1", "mita"],
      ["4", "mita"],
    ]);
    expect(plan.problems).toEqual([
      '2 accounts match "Sam Q"',
      'No account matches "Nobody"',
    ]);
    expect(plan.changes.find((c) => c.userId === "1")?.label).toContain(
      "Alice"
    );
  });

  it("matches an email even when another account has it as a name", () => {
    const plan = planGrants(
      [...accounts, account("5", "alice@test.local", null)],
      { writer: ["alice@test.local"] }
    );
    expect(plan.problems).toEqual([]);
    expect(plan.changes).toHaveLength(1);
    expect(plan.changes[0]?.userId).toBe("1");
  });

  it("skips accounts that already hold the role", () => {
    const plan = planGrants(
      [account("1", "Alice", "alice@test.local", { role: "writer" })],
      { writer: ["Alice"] }
    );
    expect(plan).toEqual({ changes: [], problems: [], unrequestedStaff: [] });
  });

  it("refuses a second owner", () => {
    const plan = planGrants(
      [
        account("1", "Alice", "alice@test.local", { role: "owner" }),
        account("2", "Bob", "bob@test.local"),
      ],
      { owner: "bob@test.local" }
    );
    expect(plan.changes).toEqual([]);
    expect(plan.problems).toHaveLength(1);
    expect(plan.problems[0]).toContain("owner");
  });

  it("does nothing when the requested owner already is the owner", () => {
    const plan = planGrants(
      [account("1", "Alice", "alice@test.local", { role: "owner" })],
      { owner: "alice@test.local" }
    );
    expect(plan).toEqual({ changes: [], problems: [], unrequestedStaff: [] });
  });

  it("grants the owner and reports the previous role", () => {
    const plan = planGrants(accounts, { owner: "alice@test.local" });
    expect(plan.changes).toMatchObject([
      { from: "member", to: "owner", userId: "1" },
    ]);
  });

  it("refuses to demote the owner through a mita or writer request", () => {
    const plan = planGrants(
      [account("1", "Alice", "alice@test.local", { role: "owner" })],
      { mita: ["Alice"] }
    );
    expect(plan.changes).toEqual([]);
    expect(plan.problems).toHaveLength(1);
  });

  it("reports current staff that the request leaves out, without blocking", () => {
    const plan = planGrants(
      [
        account("1", "Olive", "olive@test.local", { role: "owner" }),
        account("2", "Mia", "mia@test.local", { role: "mita" }),
        account("3", "Kept", "kept@test.local", { role: "mita" }),
        account("4", "Wren", "wren@test.local", { role: "writer" }),
        account("5", "Max", "max@test.local"),
      ],
      { mita: ["kept@test.local", "max@test.local"] }
    );
    expect(plan.problems).toEqual([]);
    expect(plan.changes.map((c) => c.userId)).toEqual(["5"]);
    expect(plan.unrequestedStaff.map((a) => a.id)).toEqual(["1", "2"]);
  });

  it("does not list requested staff as left out", () => {
    const plan = planGrants(
      [account("1", "Olive", "olive@test.local", { role: "owner" })],
      { owner: "olive@test.local" }
    );
    expect(plan.unrequestedStaff).toEqual([]);
  });
});

describe("planCleanup", () => {
  it("only deletes accounts nothing refers to", () => {
    const accounts = [
      account("1", "Empty", "empty@test.local"),
      account("2", "Has profile", "profile@test.local", { hasProfile: true }),
      account("3", "Has prayers", "prayers@test.local", { prayerCount: 2 }),
      account("4", "Has takeaways", "tk@test.local", { takeawayCount: 1 }),
      account("5", "Has acks", "acks@test.local", { acknowledgementCount: 3 }),
      account("6", "Has history", "hist@test.local", { role: "mita" }),
    ];
    const plan = planCleanup(
      accounts,
      {
        emails: accounts.map((a) => a.email ?? "").concat("missing@test.local"),
      },
      new Set(["6"])
    );
    expect(plan.deletable.map((a) => a.id)).toEqual(["1"]);
    expect(plan.kept.map((k) => k.account.id)).toEqual([
      "2",
      "3",
      "4",
      "5",
      "6",
    ]);
    expect(plan.kept.find((k) => k.account.id === "2")?.reason).toContain(
      "profile"
    );
    expect(plan.notFound).toEqual(["missing@test.local"]);
  });

  it("targets accounts by id, including ones without an email", () => {
    const accounts = [
      account("u-1", null, null),
      account("u-2", "No email, has profile", null, { hasProfile: true }),
      account("u-3", "Has history", "hist@test.local"),
    ];
    const plan = planCleanup(
      accounts,
      { ids: ["u-1", "u-2", "u-3", "u-missing"] },
      new Set(["u-3"])
    );
    expect(plan.deletable.map((a) => a.id)).toEqual(["u-1"]);
    expect(plan.kept).toEqual([
      { account: accounts[1], reason: "has a profile" },
      { account: accounts[2], reason: "has role history" },
    ]);
    expect(plan.notFound).toEqual(["u-missing"]);
  });

  it("checks an account once when targeted by both email and id", () => {
    const plan = planCleanup([account("1", "Empty", "empty@test.local")], {
      emails: ["empty@test.local"],
      ids: ["1"],
    });
    expect(plan.deletable.map((a) => a.id)).toEqual(["1"]);
    expect(plan.notFound).toEqual([]);
  });
});
