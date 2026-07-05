"use client";

import { Dices, Send } from "lucide-react";

import Snowfall from "react-snowfall";
import secretSanta from "secret-santa-generator";
import { toast } from "sonner";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import {
  sendChristmasGiftMessage,
  useAttendingGuests,
} from "~/hooks/useChristmas";
import useGiftExchange from "~/hooks/useGiftExchange";

type Guest = {
  id: number;
  names: string;
  phoneNumber: string;
};

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

    if (!guests || guests.length === 0) {
      toast.error("No guests to randomize.");
      return;
    }

    const table = secretSanta.buildSecretSantaTable(
      guests.map((guest: Guest) => guest.id)
    ) as Record<number, number>;

    setResult(table);

    // keep old behavior: randomize then send
    await handleSendChristmasGiftMessages();
  };

  const handleSendChristmasGiftMessages = async () => {
    if (!result) {
      toast.error("Result for the exchange is still undefined.");
      return;
    }

    if (!guests || guests.length === 0) {
      toast.error("No guests available to send messages.");
      return;
    }

    const list = Object.entries(result).map(([key, value]) => {
      const guest = guests.find((guest: Guest) => guest.id === Number(key));

      return {
        name: guest?.names ?? "",
        phoneNumber: guest?.phoneNumber ?? "",
        giftId: value,
      };
    });

    const filteredList = list.filter(
      (item) => item.name !== "" && item.phoneNumber !== ""
    );

    try {
      await Promise.all(
        filteredList.map((data) =>
          sendChristmasGiftMessage({
            phoneNumber: data.phoneNumber,
            luckyNumber: data.giftId,
          })
        )
      );

      toast.success("Messages sent", {
        description: "All gift messages have been sent",
      });
    } catch (error) {
      console.error(error);
      toast.error("Failed to send some messages.");
    }
  };

  return (
    <div className="flex h-screen flex-col bg-cover bg-stary-night-plain">
      <div className="h-full bg-background/40 backdrop-blur-sm">
        <Snowfall radius={[0, 2.5]} snowflakeCount={100} speed={[1.0, 2.0]} />
        <h1 className="mt-20 text-center text-3xl">
          TUKER KADO PERKI AACHEN 2025
        </h1>

        <div className="mx-auto mt-16 md:w-10/12">
          <div className="flex items-center space-x-2">
            <Button className="bg-white/20" onClick={randomize}>
              <Dices className="size-4" /> RANDOMIZE!
            </Button>

            <Button
              className="bg-white/20"
              onClick={handleSendChristmasGiftMessages}
            >
              <Send className="size-4" /> SEND MESSAGE!
            </Button>
          </div>

          <div className="mt-4">
            <h3 className="mb-2 text-xl">RESULTS</h3>
            {result === undefined ? (
              <p>
                The exchange has not begin yet. Please tell everyone to come ...
              </p>
            ) : (
              <div className="grid flex-wrap gap-x-4 gap-y-2 md:grid-cols-3 lg:grid-cols-4">
                {guests?.map((guest: Guest) => (
                  <Badge className="flex w-fit gap-x-2" key={guest.id}>
                    <p>{guest.names}</p>|<p>{result[guest.id]}</p>
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
