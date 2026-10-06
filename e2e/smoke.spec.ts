import { expect, test } from "@playwright/test";

const PUBLIC_PAGES = ["/", "/group", "/schedule", "/takeaway", "/christmas"];
const PROTECTED_PAGES = [
  "/prayers",
  "/account",
  "/member/join",
  "/admin/dashboard",
];

for (const path of PUBLIC_PAGES) {
  test(`public page ${path} renders without client errors`, async ({
    page,
  }) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));

    const response = await page.goto(path);

    expect(response?.status()).toBe(200);
    await expect(page).toHaveURL(path);
    expect(errors).toEqual([]);
  });
}

for (const path of PROTECTED_PAGES) {
  test(`protected page ${path} redirects signed-out visitors`, async ({
    page,
  }) => {
    await page.goto(path);
    await expect(page).toHaveURL("/auth/signin");
  });
}
