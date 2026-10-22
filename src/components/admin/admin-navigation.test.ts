import { expect, it } from "vitest";
import { adminNavigation, navigationFor } from "./admin-navigation";

it("separates the overview and member directory from content management", () => {
  expect(adminNavigation.map((item) => item.url)).toEqual([
    "/admin/dashboard",
    "/admin/members",
    "/admin/access",
    "/admin/names",
    "/admin/schedules",
    "/admin/speakers",
    "/admin/takeaways",
    "/admin/prayers",
    "/admin/settings",
  ]);
});

it("shows writers only the takeaways page", () => {
  expect(navigationFor("writer").map((item) => item.url)).toEqual([
    "/admin/takeaways",
  ]);
  expect(navigationFor("mita")).toEqual(adminNavigation);
  expect(navigationFor("owner")).toEqual(adminNavigation);
});
