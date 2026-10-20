"use client";

import { HandHeart } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { QueryMessage } from "~/components/admin/admin-controls";
import { Button, buttonVariants } from "~/components/ui/button";
import { authPageUrl } from "~/lib/auth-redirect";
import { api } from "~/trpc/react";
import AddPrayerForm from "./add-prayer-form";

export default function PrayerWall({ username }: { username: string | null }) {
  const utils = api.useUtils();
  const query = api.prayers.getPublishedPrayers.useQuery();
  const own = api.prayers.getOwnPrayerAcknowledgements.useQuery(undefined, {
    enabled: username !== null,
  });
  const acknowledge = api.prayers.acknowledgePrayer.useMutation({
    onError: (error) => toast.error(error.message),
    onSuccess: async () => {
      await utils.prayers.invalidate();
    },
  });
  const acknowledgementDisabled =
    acknowledge.isPending || own.isLoading || own.isError;
  return (
    <div className="flex flex-col gap-6">
      <p className="type-body">Let's pray together every Wednesday at 18:30.</p>
      {username === null ? (
        <Link
          className={buttonVariants({
            className: "self-start",
            variant: "secondary",
          })}
          href={authPageUrl("signin", "/prayers")}
        >
          Sign in to share a prayer
        </Link>
      ) : (
        <section className="flex flex-col gap-3">
          <AddPrayerForm username={username} />
          <p className="type-caption text-muted-foreground">
            Your request is sent privately for review before it appears here.
          </p>
        </section>
      )}
      <h2 className="type-heading">Community prayers</h2>
      {own.isError ? (
        <div
          className="flex flex-wrap items-center gap-3 rounded-xl bg-card p-4"
          role="alert"
        >
          <p className="type-body-sm">
            We couldn't load your prayer status. You can still read the
            requests.
          </p>
          <Button
            onClick={() => {
              own.refetch();
            }}
            size="sm"
            type="button"
            variant="secondary"
          >
            Retry prayer status
          </Button>
        </div>
      ) : null}
      {query.isLoading ? <QueryMessage>Loading prayers…</QueryMessage> : null}
      {query.isError ? (
        <QueryMessage
          error
          onRetry={() => {
            query.refetch();
          }}
        />
      ) : null}
      {query.data?.length ? (
        <ul className="grid gap-3">
          {query.data.map((prayer) => {
            const pressed = own.data?.includes(prayer.id) ?? false;
            return (
              <li
                className="flex flex-col gap-4 rounded-xl bg-card p-5 sm:p-6"
                key={prayer.id}
              >
                <p className="type-caption text-muted-foreground">
                  {prayer.isAnonymous
                    ? "Anonymous"
                    : prayer.name || "Community member"}
                </p>
                <p className="type-body break-words">{prayer.content}</p>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <span className="type-caption text-muted-foreground">
                    {prayer.count} praying
                  </span>
                  {username === null ? (
                    <Link
                      className="type-caption underline underline-offset-4"
                      href={authPageUrl("signin", "/prayers")}
                    >
                      Sign in to pray
                    </Link>
                  ) : (
                    <Button
                      aria-pressed={pressed}
                      disabled={acknowledgementDisabled}
                      onClick={() =>
                        acknowledge.mutate({
                          id: prayer.id,
                          pressed: !pressed,
                        })
                      }
                      size="sm"
                      type="button"
                      variant={pressed ? "default" : "secondary"}
                    >
                      <HandHeart className="size-4">
                        <title>Prayer</title>
                      </HandHeart>
                      {pressed ? "Praying with you" : "Pray with them"}
                    </Button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      ) : null}
      {query.isSuccess && query.data.length === 0 ? (
        <p className="type-body-sm text-muted-foreground">
          No public prayer requests yet.
        </p>
      ) : null}
    </div>
  );
}
