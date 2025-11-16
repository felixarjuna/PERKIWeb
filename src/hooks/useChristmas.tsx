import { useMutation, useQuery } from "@tanstack/react-query";
import axios from "axios";
import { useRouter } from "next/navigation";
import type { z } from "zod";
import { toast } from "~/components/ui/use-toast";
import type { addGuestSchema } from "~/pages/christmas";

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
      await axios.post("http://localhost:8000/api/send-template", {
        type: "initial",
        phoneNumber,
      });
    },
    onError: () => {
      toast({
        title: "⚠️ Failed to send initial message.",
        description:
          "There was an issue sending the initial message. Please contact support if you do not receive a message soon.",
      });
    },
    onSuccess: () => {
      toast({
        title: "📱 Initial message sent.",
        description:
          "You should receive a message shortly with further details.",
      });
    },
  });

  const { mutate, isLoading } = useMutation({
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

  return { addGuest: mutate, isLoading };
};
