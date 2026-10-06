import { useMutation, useQuery } from "@tanstack/react-query";
import axios from "axios";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { z } from "zod";
import type { addGuestSchema } from "~/app/christmas/page";

export type Guest = {
  id: number;
  names: string;
  phoneNumber: string;
};

const APP_URL = "https://rsvp-perkiaachen.fly.dev";

export const useChristmasGuestCount = () => {
  const { data: totalGuests, isLoading } = useQuery({
    queryFn: async () => {
      const response = await fetch(`${APP_URL}/api/guest/count?eventId=31`);
      const data = await response.json();
      return data.data.count;
    },
    queryKey: ["total-guests"],
  });

  return { isLoading, totalGuests };
};

export const useChristmasAddGuest = () => {
  const router = useRouter();

  const sendInitialMessage = useMutation({
    mutationFn: async (phoneNumber: string) => {
      sessionStorage.setItem("sendInitialMessageStatus", "pending");
      await axios.post(`${APP_URL}/api/send-template`, {
        phoneNumber,
        type: "initial",
      });
    },
    mutationKey: ["send-initial-message"],
    onError: () => {
      sessionStorage.setItem("sendInitialMessageStatus", "error");
      toast.error("Failed to send initial message.", {
        description:
          "There was an issue sending the initial message. Please contact support if you do not receive a message soon.",
      });
    },
    onSuccess: () => {
      sessionStorage.setItem("sendInitialMessageStatus", "success");
      toast.success("Initial message sent.", {
        description:
          "You should receive a message shortly with further details.",
      });
    },
  });

  const addGuest = useMutation({
    mutationFn: async (request: z.infer<typeof addGuestSchema>) => {
      await axios.post(`${APP_URL}/api/guest`, {
        data: request,
        method: "POST",
      });
    },
    mutationKey: ["add-christmas-guest"],
    onError: (err) => {
      if (axios.isAxiosError(err) && err.response) {
        toast.error("Registration failed.", {
          description:
            err.response.data.message ||
            "An error occurred during registration.",
        });
      }
    },
    onSuccess: (_, variables) => {
      /** send initial message */
      sendInitialMessage.mutate(variables.phoneNumber);

      toast.success("Registration successful.", {
        description: "Thank you for your registration!",
      });
      router.push("/christmas/thankyou");
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
    luckyNumber: luckyNumber.toString(),
    phoneNumber,
  };

  return await axios.post(`${APP_URL}/api/lucky-draw`, request);
};

export const useAttendingGuests = () => {
  const { data, isLoading, error } = useQuery<Guest[]>({
    queryFn: async () => {
      const response = await fetch(`${APP_URL}/api/guest/attending?eventId=31`);
      if (!response.ok) {
        throw new Error(`Failed to fetch guests: ${response.statusText}`);
      }
      const json = await response.json();
      return (json.data?.guests as Guest[]) || [];
    },
    queryKey: ["attending-guests"],
  });

  return { error, guests: data, isLoading };
};
