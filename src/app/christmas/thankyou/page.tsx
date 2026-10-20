"use client";

import { AlertCircle, Heart } from "lucide-react";
import { useEffect, useState } from "react";
import Loader from "~/components/loader";
import Template from "~/components/template";

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

  function renderStatus() {
    if (isLoading) {
      return <Loader message="Sending confirmation message …" />;
    }

    if (isError) {
      return (
        <div className="space-y-4">
          <div className="flex items-start gap-3 rounded-xl bg-card p-4 sm:p-6">
            <AlertCircle aria-hidden="true" className="mt-1 size-5 shrink-0" />
            <div>
              <h2 className="type-heading mb-2">Registration confirmed</h2>
              <p className="type-body-sm">
                However, we could not send the confirmation message via
                WhatsApp. Please contact support if you do not receive a message
                soon.
              </p>
              <a
                className="underline underline-offset-4"
                href="https://wa.me/4915237363126"
              >
                Contact Felix Arjuna on WhatsApp
              </a>
            </div>
          </div>
          <p className="type-body-sm">
            You are successfully registered for Perki Aachen christmas
            celebration.
          </p>
        </div>
      );
    }

    return (
      <>
        <p className="type-heading flex items-center gap-2">
          Congratulations! <Heart aria-hidden="true" className="size-4" />
        </p>
        <p className="type-body">
          You are successfully registered for Perki Aachen christmas
          celebration. You will receive an automated message for confirmation
          via WhatsApp.
        </p>
      </>
    );
  }

  return (
    <Template title="Christmas registration">
      <div className="flex flex-col gap-4" role="status">
        {renderStatus()}
      </div>
    </Template>
  );
}
