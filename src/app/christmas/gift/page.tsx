"use client";

import { Dices, Send } from "lucide-react";
import secretSanta from "secret-santa-generator";
import { toast } from "sonner";
import Template from "~/components/template";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import {
  sendChristmasGiftMessage,
  useAttendingGuests,
} from "~/hooks/use-christmas";
import useGiftExchange from "~/hooks/use-gift-exchange";

/** A secret santa draw needs someone other than yourself to draw. */
const MIN_PARTICIPANTS = 2;

interface Guest {
  id: number;
  names: string;
  phoneNumber: string;
}

export default function Page() {
  const {
    guests,
    isLoading: guestsLoading,
    error: guestsError,
  } = useAttendingGuests();

  /** local state to save randomized gift. */
  const { result, setResult } = useGiftExchange();

  const randomize = async () => {
    if (guestsLoading) {
      toast.error("Guests are still loading.");
      return;
    }

    if (guestsError) {
      toast.error("Failed to load guests.");
      return;
    }

    if (!guests || guests.length < MIN_PARTICIPANTS) {
      toast.error(
        `At least ${MIN_PARTICIPANTS} guests are needed to randomize.`
      );
      return;
    }

    const table = secretSanta.buildSecretSantaTable(
      guests.map((guest: Guest) => guest.id)
    ) as Record<number, number>;

    setResult(table);

    // Send the table just drawn; `result` still holds the previous draw here.
    await sendGiftMessages(table);
  };

  const sendGiftMessages = async (draw: Record<number, number> | undefined) => {
    if (!draw) {
      toast.error("Result for the exchange is still undefined.");
      return;
    }

    if (!guests || guests.length === 0) {
      toast.error("No guests available to send messages.");
      return;
    }

    const list = Object.entries(draw).map(([key, value]) => {
      const guest = guests.find(
        (candidate: Guest) => candidate.id === Number(key)
      );

      return {
        giftId: value,
        name: guest?.names ?? "",
        phoneNumber: guest?.phoneNumber ?? "",
      };
    });

    const filteredList = list.filter(
      (item) => item.name !== "" && item.phoneNumber !== ""
    );

    try {
      await Promise.all(
        filteredList.map((data) =>
          sendChristmasGiftMessage({
            luckyNumber: data.giftId,
            phoneNumber: data.phoneNumber,
          })
        )
      );

      toast.success("Messages sent", {
        description: "All gift messages have been sent",
      });
    } catch {
      toast.error("Failed to send some messages.");
    }
  };

  return (
    <Template
      subtitle="Christmas gift exchange"
      title="Tuker kado PERKI Aachen 2025"
    >
      <div className="flex flex-col gap-8">
        <div className="flex flex-wrap items-center gap-3">
          <Button onClick={randomize} type="button">
            <Dices aria-hidden="true" /> Randomize
          </Button>

          <Button
            onClick={() => sendGiftMessages(result)}
            type="button"
            variant="secondary"
          >
            <Send aria-hidden="true" /> Send messages
          </Button>
        </div>

        <section className="rounded-xl bg-card p-4 sm:p-6">
          <h2 className="type-heading mb-4">Results</h2>
          {result === undefined ? (
            <p>
              The exchange has not begin yet. Please tell everyone to come ...
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {guests?.map((guest: Guest) => (
                <Badge className="flex w-fit gap-x-2" key={guest.id}>
                  <p>{guest.names}</p>|<p>{result[guest.id]}</p>
                </Badge>
              ))}
            </div>
          )}
        </section>
      </div>
    </Template>
  );
}
