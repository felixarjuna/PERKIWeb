import { expect, test } from "@playwright/test";
import { insertGroupWith, insertProfiledUser } from "./db";
import { MEMBER_STORAGE_STATE, uniqueSuffix } from "./fixtures";
import { adminLogin, toast } from "./helpers";

test.use({ storageState: MEMBER_STORAGE_STATE });

test("mita add a registered member and a guest to a group", async ({
  page,
}) => {
  const suffix = uniqueSuffix();
  const group = `Picker ${suffix.slice(-6)}`;
  const first = await insertProfiledUser(`Group First ${suffix}`, "member");
  const member = await insertProfiledUser(`Group Pick ${suffix}`, "member");
  const guest = `Group Guest ${suffix}`;
  await insertGroupWith(group, first, new Date().toISOString().slice(0, 10));

  await adminLogin(page);
  await page.goto("/admin/groups");
  const card = page.getByRole("region", { name: group });

  await card.getByRole("button", { name: `Add a person to ${group}` }).click();
  let dialog = page.getByRole("dialog");
  await dialog.getByPlaceholder("Search members…").fill(first.name);
  await expect(dialog.getByRole("option", { name: first.name })).toContainText(
    `In ${group}`
  );
  await dialog.getByPlaceholder("Search members…").fill(member.name);
  await dialog.getByRole("option", { name: member.name }).click();
  await dialog.getByRole("button", { name: `Add to ${group}` }).click();
  await expect(toast(page, `${member.name} added to ${group}`)).toBeVisible();
  await expect(card.getByText(member.name, { exact: true })).toBeVisible();
  await expect(card.getByText("No account linked")).toHaveCount(0);

  await card.getByRole("button", { name: `Add a person to ${group}` }).click();
  dialog = page.getByRole("dialog");
  await dialog.getByRole("button", { name: "Not on the site yet" }).click();
  await dialog.getByLabel("Name").fill(guest);
  await dialog.getByRole("button", { name: `Add to ${group}` }).click();
  await expect(toast(page, `${guest} added to ${group}`)).toBeVisible();
  await expect(card.getByText(guest, { exact: true })).toBeVisible();
  await expect(card.getByText("No account linked")).toHaveCount(1);
});
