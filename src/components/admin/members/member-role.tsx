"use client";

import { toast } from "sonner";
import {
  ASSIGNABLE_ROLES,
  isStaffRole,
  type Role,
  roleLabels,
} from "~/lib/roles";
import { timeAgo } from "~/lib/utils";
import { api } from "~/trpc/react";
import { AdminSelect } from "../admin-controls";
import { RoleBadge } from "../role-badge";
import { type Member, memberName, memberRole } from "./member-model";

const HISTORY_LIMIT = 5;
/** Rows written by `pnpm roles` have no `changedById`, so no name. */
const SCRIPT_CHANGER = "setup script";
type Assignable = (typeof ASSIGNABLE_ROLES)[number];
const roleOptions = ASSIGNABLE_ROLES.map((role) => ({
  label: roleLabels[role],
  value: role,
}));

/** Role control and recent role history inside the member details sheet. */
export default function MemberRole({ member }: { member: Member }) {
  const utils = api.useUtils();
  const viewer = api.roles.myRole.useQuery();
  const target = memberRole(member);
  const userId = member.user.id;
  const canEdit =
    viewer.data !== undefined && isStaffRole(viewer.data) && target !== "owner";
  const history = api.roles.getHistory.useQuery(
    { userId },
    { enabled: viewer.data !== undefined && isStaffRole(viewer.data) }
  );
  const setRole = api.roles.setRole.useMutation({
    onError: (error) => toast.error(error.message),
    onSuccess: async (result) => {
      toast.success(
        `${memberName(member)} is now a ${roleLabels[result.role]}.`
      );
      await Promise.all([
        utils.profiles.invalidate(),
        utils.roles.invalidate(),
      ]);
    },
  });
  const rows = (history.data ?? []).slice(0, HISTORY_LIMIT);

  return (
    <section className="flex flex-col gap-4">
      {target === "owner" ? (
        <div className="flex flex-col gap-1">
          <p className="type-caption text-muted-foreground">Role</p>
          <RoleBadge value="owner" />
          <p className="type-caption text-muted-foreground">
            The dev role can't be changed.
          </p>
        </div>
      ) : null}
      {canEdit ? (
        <AdminSelect
          id="member-role"
          label="Role"
          onChange={(next) => {
            if (!setRole.isPending) {
              setRole.mutate({ role: next as Assignable, userId });
            }
          }}
          options={roleOptions}
          value={target}
        />
      ) : null}
      {rows.length ? (
        <div className="flex flex-col gap-2">
          <h3 className="type-caption text-muted-foreground">Role history</h3>
          <ul className="type-body-sm flex flex-col gap-1">
            {rows.map((row) => (
              <li key={`${row.createdAt.getTime()}-${row.toRole}`}>
                {roleLabels[row.toRole as Role] ?? row.toRole} · changed by{" "}
                {row.changedByName ?? SCRIPT_CHANGER} · {timeAgo(row.createdAt)}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}
