import { useMutation, useQuery } from "@tanstack/react-query";
import axios from "axios";
import { useRouter } from "next/navigation";
import type { z } from "zod";
import { toast } from "~/components/ui/use-toast";
import type { addGuestSchema } from "~/pages/christmas";

export type Guest = {
  id: number;
  names: string;
  phoneNumber: string;
};

const APP_URL = "https://rsvp-perkiaachen.fly.dev";

export const useChristmasGuestCount = () => {
  const { data: totalGuests, isLoading } = useQuery({
    queryKey: ["total-guests"],
    queryFn: async () => {
      const response = await fetch(`${APP_URL}/api/guest/count?eventId=31`);
      const data = await response.json();
      return data.data.count;
    },
  });

  return { totalGuests, isLoading };
};

export const useChristmasAddGuest = () => {
  const router = useRouter();

  const sendInitialMessage = useMutation({
    mutationKey: ["send-initial-message"],
    mutationFn: async (phoneNumber: string) => {
      sessionStorage.setItem("sendInitialMessageStatus", "pending");
      await axios.post(`${APP_URL}/api/send-template`, {
        type: "initial",
        phoneNumber,
      });
    },
    onError: () => {
      sessionStorage.setItem("sendInitialMessageStatus", "error");
      toast({
        title: "⚠️ Failed to send initial message.",
        description:
          "There was an issue sending the initial message. Please contact support if you do not receive a message soon.",
      });
    },
    onSuccess: () => {
      sessionStorage.setItem("sendInitialMessageStatus", "success");
      toast({
        title: "📱 Initial message sent.",
        description:
          "You should receive a message shortly with further details.",
      });
    },
  });

  const addGuest = useMutation({
    mutationKey: ["add-christmas-guest"],
    mutationFn: async (request: z.infer<typeof addGuestSchema>) => {
      await axios.post(`${APP_URL}/api/guest`, {
        method: "POST",
        data: request,
      });
    },
    onSuccess: (_, variables) => {
      /** send initial message */
      sendInitialMessage.mutate(variables.phoneNumber);

      toast({
        title: "✅ Registration successful.",
        description: "Thank you for your registration!",
      });
      router.push("/christmas/thankyou");
    },
    onError: (err) => {
      if (axios.isAxiosError(err) && err.response) {
        toast({
          title: "❌ Registration failed.",
          description:
            err.response.data.message ||
            "An error occurred during registration.",
        });
      }
    },
  });

  return { addGuest, sendInitialMessage };
};

export type ChristmasGiftRequest = {
  phoneNumber: string;
  luckyNumber: number;
};

export const sendChristmasGiftMessage = async ({
  phoneNumber,
  luckyNumber,
}: ChristmasGiftRequest) => {
  const request = {
    phoneNumber,
    luckyNumber: luckyNumber.toString(),
  };

  return await axios.post(`${APP_URL}/api/lucky-draw`, request);
};

export const useAttendingGuests = () => {
  const {
    data,
    isLoading,
    error,
  } = useQuery<Guest[]>({
    queryKey: ["attending-guests"],
    queryFn: async () => {
      const response = await fetch(
        `${APP_URL}/api/guest/attending?eventId=31`,
      );
      if (!response.ok) {
        throw new Error(`Failed to fetch guests: ${response.statusText}`);
      }
      const json = await response.json();
      return json.data?.guests as Guest[] || [];
    },
  });

  return { guests: data, isLoading, error };
};
