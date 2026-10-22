"use client";

import { Check, Copy, X } from "lucide-react";
import React from "react";
import { toast } from "sonner";
import { AdminSelect, QueryMessage } from "~/components/admin/admin-controls";
import { PersonAvatar } from "~/components/person-avatar";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import {
  INVITE_LIFETIME_DAYS,
  type InviteRole,
  inviteMessage,
} from "~/lib/access";
import { roleBadgeStyles } from "~/lib/role-badge-styles";
import { ASSIGNABLE_ROLES, normalizeRole, roleLabels } from "~/lib/roles";
import { timeAgo } from "~/lib/utils";
import { api, type RouterOutputs } from "~/trpc/react";

type Invite = RouterOutputs["access"]["invites"][number];
type Request = RouterOutputs["access"]["requests"][number];

const roleOptions = ASSIGNABLE_ROLES.map((role) => ({
  label: roleLabels[role],
  value: role,
}));

const expiryFormat = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  timeZone: "Europe/Berlin",
});

async function copyInviteMessage(invite: {
  email: string;
  expiresAt: Date;
  role: InviteRole;
}) {
  const text = inviteMessage({
    ...invite,
    signInUrl: `${window.location.origin}/auth/signin`,
  });
  try {
    await navigator.clipboard.writeText(text);
    toast.success("Invite message copied", {
      description: "Paste it into WhatsApp to send it.",
    });
  } catch {
    toast.error("Couldn't copy the message.");
  }
}

function deliveryMessage(email: string, status: "sent" | "skipped" | "failed") {
  if (status === "sent") {
    return `Invite email sent to ${email}.`;
  }
  if (status === "failed") {
    return `Invite saved for ${email}, but the email couldn't be sent. Copy the invite message below and send it yourself.`;
  }
  return `Invite saved for ${email}. No email was sent; copy the invite message below and send it yourself.`;
}

function InviteForm() {
  const utils = api.useUtils();
  const [email, setEmail] = React.useState("");
  const [role, setRole] = React.useState<InviteRole>("writer");
  const [delivery, setDelivery] = React.useState<{
    email: string;
    status: "sent" | "skipped" | "failed";
  } | null>(null);
  const invite = api.access.invite.useMutation({
    onError: (error) => toast.error(error.message),
    onSuccess: async (created) => {
      setEmail("");
      setDelivery({ email: created.email, status: created.emailStatus });
      await utils.access.invites.invalidate();
      toast.success(`Invited ${created.email}`, {
        action: {
          label: "Copy message",
          onClick: () => copyInviteMessage(created),
        },
        description:
          created.emailStatus === "sent"
            ? "Invite email sent."
            : "Copy the invite message to send it yourself.",
      });
    },
  });

  return (
    <form
      className="flex flex-col gap-4 rounded-xl bg-card p-4 sm:p-6"
      onSubmit={(event) => {
        event.preventDefault();
        invite.mutate({ email, role });
      }}
    >
      <div className="grid gap-4 sm:grid-cols-[1fr_10rem]">
        <div className="flex min-w-0 flex-col gap-2">
          <Label
            className="type-caption text-muted-foreground"
            htmlFor="invite-email"
          >
            Google email
          </Label>
          <Input
            autoComplete="off"
            id="invite-email"
            inputMode="email"
            onChange={(event) => setEmail(event.target.value)}
            placeholder="name@gmail.com"
            required
            type="email"
            value={email}
          />
        </div>
        <AdminSelect
          id="invite-role"
          label="Role"
          onChange={(next) => setRole(next as InviteRole)}
          options={roleOptions}
          value={role}
        />
      </div>
      <p className="type-caption text-muted-foreground">
        The role waits for this email's first Google sign-in, for{" "}
        {INVITE_LIFETIME_DAYS} days. If invite emails are on in Settings, we'll
        email them. You can always copy the message and send it yourself.
      </p>
      {delivery ? (
        <p className="type-body-sm text-muted-foreground" role="status">
          {deliveryMessage(delivery.email, delivery.status)}
        </p>
      ) : null}
      <Button
        className="sm:self-start"
        disabled={invite.isPending}
        type="submit"
      >
        Invite
      </Button>
    </form>
  );
}

function InviteRow({ invite }: { invite: Invite }) {
  const utils = api.useUtils();
  const revoke = api.access.revokeInvite.useMutation({
    onError: (error) => toast.error(error.message),
    onSuccess: async () => {
      await utils.access.invites.invalidate();
      toast.success(`Revoked the invite for ${invite.email}`);
    },
  });
  return (
    <li className="flex flex-col gap-3 rounded-xl bg-card p-4 sm:flex-row sm:items-center">
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <p className="type-body break-words">{invite.email}</p>
        <div className="type-caption flex flex-wrap items-center gap-x-2 gap-y-1 text-muted-foreground">
          <Badge size="status" {...roleBadgeStyles[invite.role]}>
            {roleLabels[invite.role]}
          </Badge>
          <span>
            Invited by {invite.invitedByName ?? "a former mita"} ·{" "}
            {timeAgo(invite.createdAt)} · open until{" "}
            {expiryFormat.format(invite.expiresAt)}
          </span>
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button
          onClick={() => copyInviteMessage(invite)}
          size="sm"
          type="button"
          variant="secondary"
        >
          <Copy aria-hidden="true" className="size-4" />
          Copy invite message
        </Button>
        <Button
          aria-label={`Revoke the invite for ${invite.email}`}
          disabled={revoke.isPending}
          onClick={() => revoke.mutate({ id: invite.id })}
          size="sm"
          type="button"
          variant="ghost"
        >
          Revoke
        </Button>
      </div>
    </li>
  );
}

function RequestRow({ request }: { request: Request }) {
  const utils = api.useUtils();
  const name = request.name ?? request.email ?? "Unnamed account";
  const decide = api.access.decide.useMutation({
    onError: (error) => toast.error(error.message),
    onSuccess: async (result) => {
      await Promise.all([
        utils.access.requests.invalidate(),
        utils.profiles.invalidate(),
        utils.roles.invalidate(),
      ]);
      toast.success(
        result.status === "approved"
          ? `${name} is now a ${roleLabels[normalizeRole(request.role)]}.`
          : `Declined ${name}'s request.`
      );
    },
  });
  return (
    <li className="flex flex-col gap-3 rounded-xl bg-card p-4 sm:flex-row sm:items-center">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <PersonAvatar person={{ image: request.image, name }} />
        <div className="min-w-0">
          <p className="type-body break-words">{name}</p>
          <p className="type-caption text-muted-foreground">
            Asks to be a {roleLabels[normalizeRole(request.role)]} ·{" "}
            {timeAgo(request.createdAt)}
          </p>
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button
          aria-label={`Approve ${name}`}
          disabled={decide.isPending}
          onClick={() => decide.mutate({ approve: true, id: request.id })}
          size="sm"
          type="button"
        >
          <Check aria-hidden="true" className="size-4" />
          Approve
        </Button>
        <Button
          aria-label={`Decline ${name}`}
          disabled={decide.isPending}
          onClick={() => decide.mutate({ approve: false, id: request.id })}
          size="sm"
          type="button"
          variant="secondary"
        >
          <X aria-hidden="true" className="size-4" />
          Decline
        </Button>
      </div>
    </li>
  );
}

/** Open access requests, the invite form, and invites still waiting. */
export default function AccessManager() {
  const requests = api.access.requests.useQuery();
  const invites = api.access.invites.useQuery();

  if (requests.isError || invites.isError) {
    return (
      <QueryMessage
        error
        onRetry={() => Promise.all([requests.refetch(), invites.refetch()])}
      />
    );
  }
  if (requests.isPending || invites.isPending) {
    return <QueryMessage>Loading access…</QueryMessage>;
  }

  return (
    <div className="space-y-10">
      <section className="space-y-3">
        <h2 className="type-subheading">
          Requests{" "}
          <span className="text-muted-foreground">{requests.data.length}</span>
        </h2>
        {requests.data.length === 0 ? (
          <p className="type-body-sm text-muted-foreground">
            No open requests. Members can ask to write takeaways from their
            profile page.
          </p>
        ) : (
          <ul className="grid gap-2">
            {requests.data.map((request) => (
              <RequestRow key={request.id} request={request} />
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="type-subheading">Invite someone</h2>
        <InviteForm />
      </section>

      <section className="space-y-3">
        <h2 className="type-subheading">
          Waiting to sign in{" "}
          <span className="text-muted-foreground">{invites.data.length}</span>
        </h2>
        {invites.data.length === 0 ? (
          <p className="type-body-sm text-muted-foreground">No open invites.</p>
        ) : (
          <ul className="grid gap-2">
            {invites.data.map((invite) => (
              <InviteRow invite={invite} key={invite.id} />
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
