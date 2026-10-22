"use client";

import { Plug, Unplug } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { QueryMessage } from "~/components/admin/admin-controls";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Switch } from "~/components/ui/switch";
import { api, type RouterOutputs } from "~/trpc/react";
import { SettingRow, SettingsGroup } from "./settings-layout";

function EmailForm({ config }: { config: RouterOutputs["settings"]["email"] }) {
  const [enabled, setEnabled] = useState(config.enabled);
  const [sender, setSender] = useState(config.sender);
  const utils = api.useUtils();
  const save = api.settings.setEmail.useMutation({
    onError: (error) => toast.error(error.message),
    onSuccess: async () => {
      await utils.settings.email.invalidate();
      toast.success("Email settings saved");
    },
  });
  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        save.mutate({ enabled, sender });
      }}
    >
      <SettingRow
        description={
          config.connected
            ? "Ready to send when invite emails are turned on."
            : "Invite emails are unavailable. Ask the site owner to connect email; you can still copy invite messages."
        }
        title="Email"
      >
        <Badge
          icon={config.connected ? Plug : Unplug}
          size="status"
          variant="secondary"
        >
          {config.connected ? "Connected" : "Not connected"}
        </Badge>
      </SettingRow>
      <SettingRow
        description="When off, copy the invite message and send it yourself."
        title="Invite emails"
      >
        <Label htmlFor="send-invite-emails">Send invite emails</Label>
        <Switch
          checked={enabled}
          disabled={save.isPending}
          id="send-invite-emails"
          onCheckedChange={setEnabled}
          type="button"
        />
      </SettingRow>
      <SettingRow
        description="Use an address on a domain verified with your email provider."
        title="Sender"
      >
        <Label className="sr-only" htmlFor="invite-email-sender">
          Sender address
        </Label>
        <Input
          autoComplete="email"
          className="@xl/section:w-64 w-full"
          disabled={save.isPending}
          id="invite-email-sender"
          onChange={(event) => setSender(event.target.value)}
          placeholder="invites@example.com"
          required={enabled}
          type="email"
          value={sender}
        />
      </SettingRow>
      <Button
        disabled={save.isPending}
        size="sm"
        type="submit"
        variant="secondary"
      >
        Save email settings
      </Button>
    </form>
  );
}

export default function EmailSettings() {
  const query = api.settings.email.useQuery();
  if (query.isError) {
    return <QueryMessage error onRetry={() => query.refetch()} />;
  }
  if (query.isPending) {
    return <QueryMessage>Loading email settings…</QueryMessage>;
  }
  return (
    <SettingsGroup title="Email">
      <EmailForm config={query.data} key={JSON.stringify(query.data)} />
    </SettingsGroup>
  );
}
