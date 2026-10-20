import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, it, vi } from "vitest";
import PrayerWall from "./prayer-wall";

const { retry } = vi.hoisted(() => ({ retry: vi.fn() }));
vi.mock("./add-prayer-form", () => ({
  default: () => <p>Prayer request form</p>,
}));
vi.mock("~/trpc/react", () => ({
  api: {
    prayers: {
      acknowledgePrayer: {
        useMutation: () => ({ isPending: false, mutate: vi.fn() }),
      },
      getOwnPrayerAcknowledgements: {
        useQuery: () => ({
          data: [],
          isError: true,
          isLoading: false,
          refetch: retry,
        }),
      },
      getPublishedPrayers: {
        useQuery: () => ({
          data: [
            {
              content: "Pray for my family",
              count: 0,
              id: 1,
              isAnonymous: false,
              name: "Alice",
            },
          ],
          isError: false,
          isLoading: false,
          isSuccess: true,
        }),
      },
    },
    useUtils: () => ({ prayers: { invalidate: () => Promise.resolve() } }),
  },
}));

it("offers recovery when the member prayer status fails independently of the public list", async () => {
  render(<PrayerWall username="alice" />);
  expect(screen.getByText("Pray for my family")).toBeTruthy();
  await userEvent
    .setup()
    .click(screen.getByRole("button", { name: "Retry prayer status" }));
  expect(retry).toHaveBeenCalledOnce();
});
