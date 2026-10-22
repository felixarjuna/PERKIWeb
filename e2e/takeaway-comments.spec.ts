import { expect, test } from "@playwright/test";
import { setTestSession } from "./auth-fixtures";
import { insertSchedule, insertTakeaway } from "./db";
import { uniqueSuffix, WRITER, WRITER_2 } from "./fixtures";

test("reviewer quotes a passage and the writer resolves and reopens feedback", async ({
  page,
}) => {
  const title = `Comment review ${uniqueSuffix()}`;
  const quote = "Abraham believed God";
  const id = await insertTakeaway(
    await insertSchedule(title),
    `${quote}, and it was counted to him as righteousness.`,
    WRITER.id,
    "in_review"
  );
  await setTestSession(page, WRITER_2);
  await page.goto(`/admin/takeaways/${id}`);
  await expect(page.getByRole("heading", { name: title })).toBeVisible();
  await page.getByLabel("Quoted passage (optional)").fill(quote);
  await page
    .getByLabel("Comment", { exact: true })
    .fill("Could you add the verse reference?");
  await page.getByRole("button", { name: "Add comment" }).click();
  const thread = page.getByRole("region", { name: "Review comments" });
  await expect(thread.getByText("1 open · 0 resolved")).toBeVisible();
  await expect(thread.getByRole("blockquote")).toHaveText(quote);
  await page.reload();
  await expect(
    thread.getByText("Could you add the verse reference?")
  ).toBeVisible();
  await setTestSession(page, WRITER);
  await page.goto(`/admin/takeaways/${id}/edit`);
  await thread.getByRole("button", { exact: true, name: "Resolve" }).click();
  await expect(thread.getByText("0 open · 1 resolved")).toBeVisible();
  await expect(thread.getByText(`Resolved by ${WRITER.name}`)).toBeVisible();
  await thread.getByRole("button", { name: "Reopen" }).click();
  await expect(thread.getByText("1 open · 0 resolved")).toBeVisible();
});
