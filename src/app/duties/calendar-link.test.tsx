import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import CalendarLink, { googleCalendarUrl } from "./calendar-link";

const state = vi.hoisted(() => ({ regenerate: vi.fn() }));
vi.mock("~/trpc/react", () => ({
  api: {
    calendarFeed: {
      regenerate: {
        useMutation: () => ({ isPending: false, mutate: state.regenerate }),
      },
    },
  },
}));
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));

const OLD_LINK_WARNING = /old link stops working/;

const path = `/api/calendar/${"a".repeat(43)}.ics`;

describe("CalendarLink", () => {
  beforeEach(() => {
    state.regenerate.mockReset();
  });

  it("offers to make a link when the member has none", () => {
    render(<CalendarLink feed={null} />);
    expect(screen.queryByRole("textbox")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Get calendar link" }));
    expect(state.regenerate).toHaveBeenCalled();
  });

  it("shows the link, and asks before replacing it", () => {
    render(<CalendarLink feed={{ createdAt: new Date(), path }} />);
    const link = screen.getByRole("textbox", { name: "Your calendar link" });
    expect((link as HTMLInputElement).value).toBe(
      `${window.location.origin}${path}`
    );
    expect(
      screen.getByRole("link", { name: "Add to Google Calendar" })
    ).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "New link" }));
    expect(state.regenerate).not.toHaveBeenCalled();
    expect(screen.getByText(OLD_LINK_WARNING)).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Make a new link" }));
    expect(state.regenerate).toHaveBeenCalled();
  });
});

describe("googleCalendarUrl", () => {
  it("subscribes Google Calendar to the feed over webcal", () => {
    expect(googleCalendarUrl(`https://perki.example${path}`)).toBe(
      `https://calendar.google.com/calendar/r?cid=${encodeURIComponent(
        `webcal://perki.example${path}`
      )}`
    );
  });
});
