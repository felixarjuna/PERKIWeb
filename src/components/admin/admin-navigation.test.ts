import { expect, it } from "vitest";
import { adminNavigation } from "./admin-navigation";

it("separates the overview and member directory from content management", () => {
  expect(adminNavigation.map((item) => item.url)).toEqual([
    "/admin/dashboard",
    "/admin/members",
    "/admin/schedules",
    "/admin/takeaways",
    "/admin/prayers",
  ]);
});
