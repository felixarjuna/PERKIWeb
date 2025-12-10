"use client";

import Snowfall from "react-snowfall";
import secretSanta from "secret-santa-generator";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { useToast } from "~/components/ui/use-toast";
import useGiftExchange from "~/hooks/useGiftExchange";
import {
  sendChristmasGiftMessage,
  useAttendingGuests,
} from "~/hooks/useChristmas";

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

  const { toast } = useToast();

  const randomize = async () => {
    if (guestsLoading) {
      toast({
        variant: "destructive",
        title: "Guests are still loading.",
      });
      return;
    }

    if (guestsError) {
      toast({
        variant: "destructive",
        title: "Failed to load guests.",
      });
      return;
    }

    if (!guests || guests.length === 0) {
      toast({
        variant: "destructive",
        title: "No guests to randomize.",
      });
      return;
    }

    const table = secretSanta.buildSecretSantaTable(
      guests.map((guest: Guest) => guest.id),
    ) as Record<number, number>;

    setResult(table);

    // keep old behavior: randomize then send
    await handleSendChristmasGiftMessages();
  };

  const handleSendChristmasGiftMessages = async () => {
    if (!result) {
      toast({
        variant: "destructive",
        title: "Result for the exchange is still undefined.",
      });
      return;
    }

    if (!guests || guests.length === 0) {
      toast({
        variant: "destructive",
        title: "No guests available to send messages.",
      });
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
      (item) => item.name !== "" && item.phoneNumber !== "",
    );

    try {
      await Promise.all(
        filteredList.map((data) =>
          sendChristmasGiftMessage({
            phoneNumber: data.phoneNumber,
            luckyNumber: data.giftId,
          }),
        ),
      );

      toast({
        title: "✅ Messages sent",
        description: "All gift messages have been sent 🎁",
      });
    } catch (error) {
      console.error(error);
      toast({
        variant: "destructive",
        title: "Failed to send some messages.",
      });
    }
  };

  return (
    <div className="flex h-screen flex-col bg-stary-night-plain bg-cover">
      <div className="h-full bg-dark-grey-default/40 backdrop-blur-sm">
        <Snowfall radius={[0, 2.5]} speed={[1.0, 2.0]} snowflakeCount={100} />
        <h1 className="mt-20 text-center text-3xl">
          TUKER KADO PERKI AACHEN 2025
        </h1>

        <div className="mx-auto mt-16 md:w-10/12">
          <div className="flex items-center space-x-2">
            <Button onClick={randomize} className="bg-white/20">
              RANDOMIZE! 🎲
            </Button>

            <Button
              onClick={handleSendChristmasGiftMessages}
              className="bg-white/20"
            >
              SEND MESSAGE! 🎅
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
                  <Badge key={guest.id} className="flex w-fit gap-x-2">
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
