import { expect, test } from "@playwright/test";

test.use({ viewport: { height: 844, width: 390 } });

test("rapid gallery navigation reaches the requested pastor without changing the caption height", async ({
  page,
}) => {
  await page.goto("/");
  const section = page.locator("#pastors");
  await section.scrollIntoViewIfNeeded();
  const caption = section.getByRole("button", { name: "Read story" });
  const captionOffset = () =>
    caption.evaluate((element) => {
      const parent = element.closest(".reveal");
      if (!parent) {
        throw new Error("Missing pastors section");
      }
      return (
        element.getBoundingClientRect().top - parent.getBoundingClientRect().top
      );
    });
  const initialTop = await captionOffset();
  await section
    .getByRole("button", { name: "Next pastor" })
    .evaluate((button) => {
      if (!(button instanceof HTMLButtonElement)) {
        throw new Error("Missing navigation button");
      }
      button.dispatchEvent(
        new MouseEvent("click", { bubbles: true, detail: 1 })
      );
      button.dispatchEvent(
        new MouseEvent("click", { bubbles: true, detail: 1 })
      );
    });
  await expect(
    section.getByRole("button", { exact: true, name: "Ev. Riggruben" })
  ).toHaveAttribute("aria-pressed", "true");
  await expect(
    section.getByRole("button", { name: "Next pastor" })
  ).toBeDisabled();
  await expect.poll(() => captionOffset()).toBeCloseTo(initialTop, 0);
});

test("portraits resize continuously with swipe position", async ({ page }) => {
  await page.goto("/");
  const track = page.locator("#pastors ul");
  await track.scrollIntoViewIfNeeded();
  await track.evaluate((element) => {
    element.style.scrollSnapType = "none";
    const first = element.children.item(0) as HTMLElement;
    const second = element.children.item(1) as HTMLElement;
    element.scrollLeft = (second.offsetLeft - first.offsetLeft) / 2;
  });
  const portrait = track.locator("img").first();
  await expect
    .poll(() =>
      portrait.evaluate(
        (element) => new DOMMatrix(getComputedStyle(element).transform).a
      )
    )
    .toBeCloseTo(0.85, 2);
});

test("a gesture updates arrow navigation before scrolling settles", async ({
  page,
}) => {
  await page.goto("/");
  const section = page.locator("#pastors");
  await section.scrollIntoViewIfNeeded();
  const disabled = await section.evaluate(async (element) => {
    const track = element.querySelector("ul");
    if (!track) {
      throw new Error("Missing gallery track");
    }
    track.dispatchEvent(new WheelEvent("wheel", { bubbles: true }));
    track.scrollTo({ behavior: "instant", left: track.scrollWidth });
    track.dispatchEvent(new Event("scroll"));
    await new Promise((resolve) =>
      requestAnimationFrame(() => requestAnimationFrame(resolve))
    );
    return element.querySelector<HTMLButtonElement>(
      'button[aria-label="Next pastor"]'
    )?.disabled;
  });
  expect(disabled).toBe(true);
  await section.getByRole("button", { name: "Previous pastor" }).click();
  await expect(
    section.getByRole("button", { exact: true, name: "Pdt. Titus Christanto" })
  ).toHaveAttribute("aria-pressed", "true");
});

test("reduced motion changes pastors without smooth scrolling or portrait transitions", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  const section = page.locator("#pastors");
  await section.scrollIntoViewIfNeeded();
  await section.getByRole("button", { name: "Next pastor" }).click();
  const portrait = section.getByRole("button", {
    exact: true,
    name: "Pdt. Titus Christanto",
  });
  await expect(portrait).toHaveAttribute("aria-pressed", "true");
  const centerDistance = await portrait.evaluate((element) => {
    const track = element.closest("ul");
    if (!track) {
      throw new Error("Missing gallery track");
    }
    const item = element.getBoundingClientRect();
    const viewport = track.getBoundingClientRect();
    return Math.abs(
      item.left + item.width / 2 - viewport.left - viewport.width / 2
    );
  });
  expect(centerDistance).toBeLessThan(2);
});
