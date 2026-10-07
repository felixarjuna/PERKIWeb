import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import axios from "axios";
import type { ReactNode } from "react";
import { toast } from "sonner";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  sendChristmasGiftMessage,
  useAttendingGuests,
  useChristmasAddGuest,
  useChristmasGuestCount,
} from "./use-christmas";

const push = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));
vi.mock("sonner", () => ({ toast: { error: vi.fn(), success: vi.fn() } }));

const APP_URL = "https://rsvp-perkiaachen.fly.dev";

const createWrapper = () => {
  const client = new QueryClient({
    defaultOptions: { mutations: { retry: false }, queries: { retry: false } },
  });
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
};

const jsonResponse = (body: unknown, init?: ResponseInit) =>
  Response.json(body, init);

describe("use-christmas", () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  describe("sendChristmasGiftMessage", () => {
    it("posts the lucky number as a string to the lucky-draw endpoint", async () => {
      const post = vi.spyOn(axios, "post").mockResolvedValue({ status: 200 });

      await sendChristmasGiftMessage({ luckyNumber: 7, phoneNumber: "+49123" });

      expect(post).toHaveBeenCalledWith(`${APP_URL}/api/lucky-draw`, {
        luckyNumber: "7",
        phoneNumber: "+49123",
      });
    });

    it("propagates request failures", async () => {
      vi.spyOn(axios, "post").mockRejectedValue(new Error("network"));
      await expect(
        sendChristmasGiftMessage({ luckyNumber: 1, phoneNumber: "+49" })
      ).rejects.toThrow("network");
    });
  });

  describe("useAttendingGuests", () => {
    it("returns the guests from the API", async () => {
      const guests = [{ id: 1, names: "Anna", phoneNumber: "+491" }];
      const fetchMock = vi.fn(() =>
        Promise.resolve(jsonResponse({ data: { guests } }))
      );
      vi.stubGlobal("fetch", fetchMock);

      const { result } = renderHook(() => useAttendingGuests(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isLoading).toBe(false));
      expect(result.current.guests).toEqual(guests);
      expect(fetchMock).toHaveBeenCalledWith(
        `${APP_URL}/api/guest/attending?eventId=31`
      );
    });

    it("falls back to an empty list when the payload has no guests", async () => {
      vi.stubGlobal(
        "fetch",
        vi.fn(() => Promise.resolve(jsonResponse({})))
      );

      const { result } = renderHook(() => useAttendingGuests(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isLoading).toBe(false));
      expect(result.current.guests).toEqual([]);
    });

    it("exposes an error for non-OK responses", async () => {
      vi.stubGlobal(
        "fetch",
        vi.fn(() =>
          Promise.resolve(
            new Response(null, { status: 500, statusText: "Server Error" })
          )
        )
      );

      const { result } = renderHook(() => useAttendingGuests(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.error).not.toBeNull());
      expect(result.current.error?.message).toBe(
        "Failed to fetch guests: Server Error"
      );
      expect(result.current.guests).toBeUndefined();
    });
  });

  describe("useChristmasGuestCount", () => {
    it("returns data.count from the API", async () => {
      vi.stubGlobal(
        "fetch",
        vi.fn(() => Promise.resolve(jsonResponse({ data: { count: 42 } })))
      );

      const { result } = renderHook(() => useChristmasGuestCount(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isLoading).toBe(false));
      expect(result.current.totalGuests).toBe(42);
    });
  });

  describe("useChristmasAddGuest", () => {
    const request = {
      eventId: 31,
      names: "Anna",
      nRsvp: 1,
      phoneNumber: "+49123",
    };

    it("registers the guest, sends the initial message and redirects", async () => {
      const post = vi.spyOn(axios, "post").mockResolvedValue({ status: 200 });

      const { result } = renderHook(() => useChristmasAddGuest(), {
        wrapper: createWrapper(),
      });
      result.current.addGuest.mutate(request);

      await waitFor(() =>
        expect(sessionStorage.getItem("sendInitialMessageStatus")).toBe(
          "success"
        )
      );
      expect(post).toHaveBeenNthCalledWith(1, `${APP_URL}/api/guest`, {
        data: request,
        method: "POST",
      });
      expect(post).toHaveBeenNthCalledWith(2, `${APP_URL}/api/send-template`, {
        phoneNumber: "+49123",
        type: "initial",
      });
      expect(push).toHaveBeenCalledWith("/christmas/thankyou");
      expect(toast.success).toHaveBeenCalledWith(
        "Registration successful.",
        expect.anything()
      );
    });

    it("records a failed initial message", async () => {
      vi.spyOn(axios, "post")
        .mockResolvedValueOnce({ status: 200 })
        .mockRejectedValueOnce(new Error("whatsapp down"));

      const { result } = renderHook(() => useChristmasAddGuest(), {
        wrapper: createWrapper(),
      });
      result.current.addGuest.mutate(request);

      await waitFor(() =>
        expect(sessionStorage.getItem("sendInitialMessageStatus")).toBe("error")
      );
      expect(toast.error).toHaveBeenCalledWith(
        "Failed to send initial message.",
        expect.anything()
      );
    });

    it("shows the API error message and does not redirect on failure", async () => {
      const error = Object.assign(new Error("Request failed"), {
        isAxiosError: true,
        response: { data: { message: "Phone number already registered" } },
      });
      vi.spyOn(axios, "post").mockRejectedValue(error);

      const { result } = renderHook(() => useChristmasAddGuest(), {
        wrapper: createWrapper(),
      });
      result.current.addGuest.mutate(request);

      await waitFor(() => expect(result.current.addGuest.isError).toBe(true));
      expect(toast.error).toHaveBeenCalledWith("Registration failed.", {
        description: "Phone number already registered",
      });
      expect(push).not.toHaveBeenCalled();
    });
  });
});
