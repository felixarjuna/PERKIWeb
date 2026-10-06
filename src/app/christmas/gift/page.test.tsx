import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { toast } from "sonner";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  type Guest,
  sendChristmasGiftMessage,
  useAttendingGuests,
} from "~/hooks/use-christmas";
import useGiftExchange from "~/hooks/use-gift-exchange";
import Page from "./page";

vi.mock("react-snowfall", () => ({ default: () => null }));
vi.mock("sonner", () => ({ toast: { error: vi.fn(), success: vi.fn() } }));
vi.mock("~/hooks/use-christmas", () => ({
  sendChristmasGiftMessage: vi.fn(() => Promise.resolve()),
  useAttendingGuests: vi.fn(),
}));

const RANDOMIZE = /randomize/i;
const SEND_MESSAGE = /send message/i;
const WAITING_MESSAGE = /The exchange has not begin yet/;

const guests: Guest[] = [
  { id: 1, names: "Anna", phoneNumber: "+491" },
  { id: 2, names: "Ben", phoneNumber: "+492" },
  { id: 3, names: "Cara", phoneNumber: "+493" },
  { id: 4, names: "Dan", phoneNumber: "+494" },
];

const mockGuests = (value: Partial<ReturnType<typeof useAttendingGuests>>) => {
  vi.mocked(useAttendingGuests).mockReturnValue({
    error: null,
    guests: undefined,
    isLoading: false,
    ...value,
  });
};

const sentPairs = () =>
  vi
    .mocked(sendChristmasGiftMessage)
    .mock.calls.map(([request]) => [request.phoneNumber, request.luckyNumber]);

const expectedPairs = (table: Record<number, number>) =>
  guests.map((guest) => [guest.phoneNumber, table[guest.id]]);

describe("christmas gift page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();
    useGiftExchange.setState({ result: undefined });
    mockGuests({ guests });
  });

  it("shows a waiting message before the draw", () => {
    render(<Page />);
    expect(screen.getByText(WAITING_MESSAGE)).toBeDefined();
  });

  it("refuses to randomize while guests are loading, on error, or empty", async () => {
    const user = userEvent.setup();

    mockGuests({ isLoading: true });
    const { rerender } = render(<Page />);
    await user.click(screen.getByRole("button", { name: RANDOMIZE }));
    expect(toast.error).toHaveBeenLastCalledWith("Guests are still loading.");

    mockGuests({ error: new Error("boom") });
    rerender(<Page />);
    await user.click(screen.getByRole("button", { name: RANDOMIZE }));
    expect(toast.error).toHaveBeenLastCalledWith("Failed to load guests.");

    mockGuests({ guests: [] });
    rerender(<Page />);
    await user.click(screen.getByRole("button", { name: RANDOMIZE }));
    expect(toast.error).toHaveBeenLastCalledWith("No guests to randomize.");

    expect(useGiftExchange.getState().result).toBeUndefined();
  });

  it("RANDOMIZE stores a valid draw and shows each guest's number", async () => {
    const user = userEvent.setup();
    render(<Page />);

    await user.click(screen.getByRole("button", { name: RANDOMIZE }));

    const table = useGiftExchange.getState().result;
    expect(table).toBeDefined();
    for (const guest of guests) {
      expect(table?.[guest.id]).not.toBe(guest.id);
      const badge = screen.getByText(guest.names).parentElement;
      expect(badge?.textContent).toBe(`${guest.names}|${table?.[guest.id]}`);
    }
  });

  it("SEND MESSAGE sends every guest the number they drew", async () => {
    const table = { 1: 3, 2: 4, 3: 2, 4: 1 };
    useGiftExchange.setState({ result: table });
    const user = userEvent.setup();
    render(<Page />);

    await user.click(screen.getByRole("button", { name: SEND_MESSAGE }));

    expect(sentPairs()).toEqual(expectedPairs(table));
    expect(toast.success).toHaveBeenCalledWith(
      "Messages sent",
      expect.anything()
    );
  });

  it("SEND MESSAGE skips draw entries without a matching guest", async () => {
    useGiftExchange.setState({ result: { 1: 2, 2: 1, 99: 1 } });
    const user = userEvent.setup();
    render(<Page />);

    await user.click(screen.getByRole("button", { name: SEND_MESSAGE }));

    expect(sentPairs()).toEqual([
      ["+491", 2],
      ["+492", 1],
    ]);
  });

  // BUG: randomize() calls setResult(table) and then immediately
  // handleSendChristmasGiftMessages(), which reads `result` from the render
  // closure — still the previous value. On the first draw that is undefined,
  // so no messages are sent and "Result for the exchange is still undefined."
  // is shown even though the comment says "randomize then send".
  it.fails("RANDOMIZE sends the freshly drawn numbers on the first draw", async () => {
    const user = userEvent.setup();
    render(<Page />);

    await user.click(screen.getByRole("button", { name: RANDOMIZE }));

    expect(toast.error).not.toHaveBeenCalled();
    const table = useGiftExchange.getState().result ?? {};
    expect(sentPairs()).toEqual(expectedPairs(table));
  });

  // BUG: same stale closure, worse consequence: re-drawing sends everyone the
  // numbers from the PREVIOUS draw while the page shows the new one.
  it.fails("RANDOMIZE on a re-draw sends the new numbers, not the previous ones", async () => {
    // Impossible as a real draw, so it can never equal the new table.
    const previous = { 1: 100, 2: 200, 3: 300, 4: 400 };
    useGiftExchange.setState({ result: previous });
    const user = userEvent.setup();
    render(<Page />);

    await user.click(screen.getByRole("button", { name: RANDOMIZE }));

    const table = useGiftExchange.getState().result ?? {};
    expect(table).not.toEqual(previous);
    expect(sentPairs()).toEqual(expectedPairs(table));
  });

  it("[current behaviour] RANDOMIZE on a re-draw sends the previous draw's numbers", async () => {
    const previous = { 1: 100, 2: 200, 3: 300, 4: 400 };
    useGiftExchange.setState({ result: previous });
    const user = userEvent.setup();
    render(<Page />);

    await user.click(screen.getByRole("button", { name: RANDOMIZE }));

    expect(sentPairs()).toEqual(expectedPairs(previous));
  });
});
