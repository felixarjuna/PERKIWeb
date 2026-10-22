"use client";

import { toast } from "sonner";
import { RoleBadge } from "~/components/admin/role-badge";
import { Button } from "~/components/ui/button";
import { normalizeRole } from "~/lib/roles";
import { api } from "~/trpc/react";

/** Anchor the takeaway page's "Ask to become a writer" hint links to. */
export const ROLE_ROW_ID = "your-role";

const OUTCOMES: Record<string, string> = {
  approved: "Your request to become a writer was approved",
  declined: "Your request to become a writer was declined",
  pending: "Request sent, waiting for a mita",
};

/**
 * The member's role, read-only. Members can ask to become a writer here;
 * the row then shows the request until a mita answers, and the answer.
 */
export default function RoleRow() {
  const utils = api.useUtils();
  const { data: stored } = api.roles.myRole.useQuery();
  const { data: myRequest } = api.access.myRequest.useQuery();
  const request = api.access.request.useMutation({
    onError: (error) => toast.error(error.message),
    onSuccess: async () => {
      await utils.access.myRequest.invalidate();
      toast.success("Request sent", {
        description: "A mita will answer it soon.",
      });
    },
  });
  const role = stored === undefined ? undefined : normalizeRole(stored);
  const status = myRequest?.status;
  // A request answered for someone who has since changed role is old news.
  const outcome =
    (role === "member" && status !== "approved") ||
    (role === "writer" && status === "approved")
      ? OUTCOMES[status ?? ""]
      : undefined;
  const canAsk = role === "member" && status !== "pending";

  return (
    <li
      className="flex min-h-12 w-full scroll-mt-28 flex-col gap-2 rounded-lg px-3 py-2"
      id={ROLE_ROW_ID}
    >
      <div className="flex items-center gap-3">
        <span className="type-body-sm flex-1">Your role</span>
        {role ? <RoleBadge value={role} /> : null}
      </div>
      {outcome || canAsk ? (
        <div className="flex flex-wrap items-center justify-between gap-2">
          {outcome ? (
            <p className="type-caption text-muted-foreground">{outcome}</p>
          ) : (
            <p className="type-caption text-muted-foreground">
              Writers share the takeaways from our services.
            </p>
          )}
          {canAsk ? (
            <Button
              disabled={request.isPending}
              onClick={() => request.mutate({ role: "writer" })}
              size="sm"
              type="button"
              variant="secondary"
            >
              {status === "declined" ? "Ask again" : "Ask to become a writer"}
            </Button>
          ) : null}
        </div>
      ) : null}
    </li>
  );
}
