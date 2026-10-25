import { HandHelping } from "lucide-react";
import { expect, it } from "vitest";
import {
  adminNavigation,
  navigationFor,
  sidebarEntries,
} from "./admin-navigation";

it("separates the overview and member directory from content management", () => {
  expect(adminNavigation.map((item) => item.url)).toEqual([
    "/admin/dashboard",
    "/admin/members",
    "/admin/groups",
    "/admin/serving",
    "/admin/access",
    "/admin/names",
    "/admin/schedules",
    "/admin/speakers",
    "/admin/takeaways",
    "/admin/prayers",
    "/admin/settings",
  ]);
});

it("nests cooking and cleaning and the serving teams under Serving", () => {
  const community = adminNavigation.filter(
    (item) => item.group === "Community"
  );
  expect(
    sidebarEntries(community).map((entry) =>
      "items" in entry
        ? { [entry.title]: entry.items.map((item) => item.title) }
        : entry.title
    )
  ).toEqual([
    "Overview",
    "Members",
    { Serving: ["Cooking & cleaning", "Serving teams"] },
    "Access",
    "Name links",
  ]);
  const [, , serving] = sidebarEntries(community);
  expect(serving && "items" in serving ? serving.icon : null).toBe(HandHelping);
});

it("shows writers only the takeaways page", () => {
  expect(navigationFor("writer").map((item) => item.url)).toEqual([
    "/admin/takeaways",
  ]);
  expect(navigationFor("mita")).toEqual(adminNavigation);
  expect(navigationFor("owner")).toEqual(adminNavigation);
});
