import {
  SERVING_ROLES,
  type ServingRole,
  servingRoleLabels,
} from "./serving-roles";

/** Roles members serve in; preachers are guest speakers and never in the pool. */
export const POOL_ROLES = SERVING_ROLES.filter(
  (role): role is Exclude<ServingRole, "preacher"> => role !== "preacher"
);
export type PoolRole = (typeof POOL_ROLES)[number];

export const POOL_SCOPES = ["both", "church_service", "bible_study"] as const;
export type PoolScope = (typeof POOL_SCOPES)[number];

export const scopeLabels: Record<PoolScope, string> = {
  bible_study: "Bible study",
  both: "Both",
  church_service: "Service",
};

/** Stored availability; a pause is kept apart so it ends on its own. */
export const POOL_STATUSES = ["active", "backup"] as const;
export type PoolStatus = (typeof POOL_STATUSES)[number];
export type ShownStatus = PoolStatus | "paused";

export const statusLabels: Record<ShownStatus, string> = {
  active: "Active",
  backup: "Backup",
  paused: "Paused",
};

/**
 * The scopes a role is scheduled for: a Bible study has a leader, a service a
 * liturgist, and multimedia and accommodation only serve at services.
 */
export function scopesFor(role: PoolRole): readonly PoolScope[] {
  switch (role) {
    case "leader":
      return ["bible_study"];
    case "liturgist":
    case "multimedia":
    case "accommodation":
      return ["church_service"];
    default:
      return POOL_SCOPES;
  }
}

interface PoolGroup {
  entries: { role: PoolRole; scope?: PoolScope }[];
  label: string;
  value: string;
}

const LITURGIST = { role: "liturgist", scope: "church_service" } as const;
const PA_LEADER = { role: "leader", scope: "bible_study" } as const;

/**
 * What the role picker offers. The sheet's "Litur/PA Besar" is one list:
 * liturgists lead the service, leaders lead PA Besar (the Bible study), and
 * many people do both, so it adds both entries unless one is chosen.
 */
export const POOL_GROUPS: readonly PoolGroup[] = [
  {
    entries: [PA_LEADER, LITURGIST],
    label: "Litur/PA Besar",
    value: "litur_pa",
  },
  ...POOL_ROLES.filter((role) => role !== "leader" && role !== "liturgist").map(
    (role) => ({
      entries: [{ role }],
      label: servingRoleLabels[role],
      value: role,
    })
  ),
];

/** The switch shown for Litur/PA Besar; both roles by default. */
export const LITUR_PA_PARTS = [
  { label: "Both", value: "litur_pa" },
  { label: "Liturgist", value: "liturgist" },
  { label: "PA Besar leader", value: "leader" },
] as const;

/** Everything `servingPool.add` accepts: a picker entry or one Litur/PA part. */
export const addTargets = [
  ...POOL_GROUPS.map((group) => group.value),
  LITURGIST.role,
  PA_LEADER.role,
];

/** The pool entries an add target creates; undefined for anything else. */
export function poolEntriesFor(
  target: string
): PoolGroup["entries"] | undefined {
  if (target === LITURGIST.role) {
    return [LITURGIST];
  }
  if (target === PA_LEADER.role) {
    return [PA_LEADER];
  }
  return POOL_GROUPS.find((group) => group.value === target)?.entries;
}

/** Paused through `pausedUntil` (an Aachen day), otherwise the stored status. */
export const poolStatus = (
  entry: { pausedUntil: string | null; status: PoolStatus },
  today: string
): ShownStatus =>
  entry.pausedUntil && entry.pausedUntil >= today ? "paused" : entry.status;

/**
 * The group term in force on `day`, as days: from its start (null before the
 * first term) until the next term starts (null for the latest).
 */
export function termWindow(terms: { startsOn: string }[], day: string) {
  const starts = terms.map((term) => term.startsOn).sort();
  const from = starts.filter((start) => start <= day).at(-1) ?? null;
  const before = starts.find((start) => start > day) ?? null;
  return { before, from };
}
