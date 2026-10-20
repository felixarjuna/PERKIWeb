export const ROLES = ["owner", "mita", "writer", "member"] as const;
export type Role = (typeof ROLES)[number];

/** Roles that staff may hand out; `owner` is fixed and unique. */
export const ASSIGNABLE_ROLES = ["mita", "writer", "member"] as const;

export const roleLabels: Record<Role, string> = {
  member: "Member",
  mita: "Mita",
  owner: "Dev",
  writer: "Writer",
};

/** Maps a stored value to a role: legacy `admin` is `mita`, unknown is `member`. */
export function normalizeRole(stored: string | null | undefined): Role {
  if (stored === "admin") {
    return "mita";
  }
  return ROLES.find((role) => role === stored) ?? "member";
}

export const isStaffRole = (role: Role) => role === "owner" || role === "mita";

export const canWriteTakeaways = (role: Role) =>
  isStaffRole(role) || role === "writer";

export function canChangeRole(actor: Role, target: Role, next: Role): boolean {
  return (
    isStaffRole(actor) &&
    target !== "owner" &&
    ASSIGNABLE_ROLES.some((assignable) => assignable === next)
  );
}
