import { useMutation, useQuery } from "@tanstack/react-query";
import axios from "axios";
import { useRouter } from "next/navigation";
import type { z } from "zod";
import { toast } from "~/components/ui/use-toast";
import type { addGuestSchema } from "~/pages/christmas";

export const useChristmasGuestCount = () => {
  const { data: totalGuests, isLoading } = useQuery({
    queryKey: ["total-guests"],
    queryFn: async () => {
      const response = await fetch(
        "http://localhost:8000/api/guest/count?eventId=31"
      );
      const data = await response.json();
      return data.data.count;
    },
  });

  return { totalGuests, isLoading };
};

export const useChristmasAddGuest = () => {
  const router = useRouter();

  const { mutate, isLoading } = useMutation({
    mutationKey: ["add-christmas-guest"],
    mutationFn: async (request: z.infer<typeof addGuestSchema>) => {
      await axios.post("http://localhost:8000/api/guest", {
        method: "POST",
        data: request,
      });
    },
    onSuccess: () => {
      toast({
        title: "✅ Registration successful.",
        description: "Thank you for your registration!",
      });
      router.push("/christmas/thankyou");

      /** send initial message */
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
