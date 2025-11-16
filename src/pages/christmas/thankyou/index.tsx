import { AlertCircle, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "~/components/ui/button";

export default function Page() {
  const [messageStatus, setMessageStatus] = useState<
    "pending" | "error" | "success" | null
  >(null);

  useEffect(() => {
    const status = sessionStorage.getItem("sendInitialMessageStatus") as
      | "pending"
      | "error"
      | "success"
      | null;
    setMessageStatus(status);

    // Poll for status changes while pending
    const interval = setInterval(() => {
      const currentStatus = sessionStorage.getItem(
        "sendInitialMessageStatus"
      ) as "pending" | "error" | "success" | null;
      if (currentStatus !== messageStatus) {
        setMessageStatus(currentStatus);
      }
      if (currentStatus !== "pending") {
        clearInterval(interval);
      }
    }, 500);

    return () => clearInterval(interval);
  }, [messageStatus]);

  const isLoading = messageStatus === "pending";
  const isError = messageStatus === "error";

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-black-default to-[#102436] font-mono text-white-primary-default">
      <div className="w-10/12 md:w-1/3">
        {isLoading ? (
          <Button className="flex w-full items-center gap-2 bg-white/20">
            <Loader2 className="h-4 w-4 animate-spin" />
            <p className="text-sm">Sending confirmation message ...</p>
          </Button>
        ) : isError ? (
          <div className="space-y-4">
            <div className="flex items-center gap-2 rounded-md bg-yellow-500/20 p-4">
              <AlertCircle className="h-5 w-5 text-yellow-500" />
              <div>
                <p className="font-bold">Registration Successful</p>
                <p className="text-sm">
                  However, we could not send the confirmation message via
                  WhatsApp. Please contact support if you do not receive a
                  message soon.
                </p>
                <p>WA: +49 152 3736 3126 - Felix Arjuna</p>
              </div>
            </div>
            <p className="text-sm">
              You are successfully registered for Perki Aachen christmas
              celebration.
            </p>
          </div>
        ) : (
          <>
            <p className="font-bold">Congratulations! ❤️</p>
            <p className="text-base">
              You are successfully registered for Perki Aachen christmas
              celebration. You will receive an automated message for
              confirmation via WhatsApp.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
