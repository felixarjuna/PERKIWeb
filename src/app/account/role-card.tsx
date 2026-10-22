"use client";

import { useRef } from "react";
import { toast } from "sonner";
import { roleIcons } from "~/components/admin/role-badge";
import { Button } from "~/components/ui/button";
import { normalizeRole, type Role, roleLabels } from "~/lib/roles";
import { api } from "~/trpc/react";

/** Anchor the takeaway page's "Ask to become a writer" hint links to. */
export const ROLE_CARD_ID = "your-role";

const allows: Record<Role, string> = {
  member: "Want to write the takeaways from our services?",
  mita: "You can manage the website and write takeaways",
  owner: "Full access",
  writer: "You can write takeaways",
};

/** What the card says under the role, given the member's latest request. */
function statusLine(role: Role, status: string | undefined) {
  if (role === "member" && status === "pending") {
    return "Request sent, waiting for a mita";
  }
  if (role === "member" && status === "declined") {
    return "Your request to become a writer was declined";
  }
  if (role === "writer" && status === "approved") {
    return "Your request was approved. You can write takeaways";
  }
  return allows[role];
}

/**
 * The signed-in person's role and what it allows. Members can ask to become
 * a writer here; the card then shows the request until a mita answers it.
 */
export default function RoleCard() {
  const utils = api.useUtils();
  const statusRef = useRef<HTMLParagraphElement>(null);
  const { data: stored } = api.roles.myRole.useQuery();
  const { data: myRequest } = api.access.myRequest.useQuery();
  const request = api.access.request.useMutation({
    onError: (error) => toast.error(error.message),
    onSuccess: async () => {
      await utils.access.myRequest.invalidate();
      // The button is gone now; keep keyboard focus on the new status.
      statusRef.current?.focus();
    },
  });
  if (stored === undefined || myRequest === undefined) {
    return null;
  }
  const role = normalizeRole(stored);
  const status = myRequest?.status;
  const canAsk = role === "member" && status !== "pending";
  const Icon = roleIcons[role];

  return (
    <section
      className="flex scroll-mt-28 items-center gap-3 rounded-xl bg-card p-4 sm:p-6"
      id={ROLE_CARD_ID}
    >
      <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-secondary">
        <Icon aria-hidden="true" className="size-4" />
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <h2 className="type-body">Your role: {roleLabels[role]}</h2>
        <p
          className="type-body-sm text-muted-foreground outline-none"
          ref={statusRef}
          tabIndex={-1}
        >
          {statusLine(role, status)}
        </p>
      </div>
      {canAsk ? (
        <Button
          aria-label={
            status === "declined"
              ? "Ask again to become a writer"
              : "Ask to become a writer"
          }
          className="shrink-0"
          disabled={request.isPending}
          onClick={() => request.mutate({ role: "writer" })}
          size="sm"
          type="button"
          variant={status === "declined" ? "secondary" : "default"}
        >
          {status === "declined" ? "Ask again" : "Ask"}
        </Button>
      ) : null}
    </section>
  );
}
