import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { LanguageChip, LanguagePicker, pickedLanguage } from "./language";

describe("LanguageChip", () => {
  it("shows the flag beside the name, the flag hidden from screen readers", () => {
    const { container } = render(<LanguageChip language="de" />);
    expect(container.textContent).toBe("🇩🇪Deutsch");
    expect(screen.getByText("🇩🇪").getAttribute("aria-hidden")).toBe("true");
  });

  it("shows an older free-text language as typed, without a flag", () => {
    const { container } = render(<LanguageChip language="Indonesian" />);
    expect(container.textContent).toBe("Indonesian");
    expect(container.querySelector("[aria-hidden]")).toBeNull();
  });

  it("shows nothing without a language", () => {
    const { container } = render(<LanguageChip language={null} />);
    expect(container.textContent).toBe("");
  });
});

describe("LanguagePicker", () => {
  it("picks a language from the list, or none", async () => {
    const onChange = vi.fn();
    render(<LanguagePicker id="lang" onChange={onChange} value="" />);
    const picker = screen.getByRole("combobox", { name: "Language" });
    expect(picker.textContent).toContain("No language");

    await userEvent.click(picker);
    const options = screen.getAllByRole("option");
    expect(options.map((option) => option.textContent)).toEqual([
      "No language",
      "🇬🇧English",
      "🇩🇪Deutsch",
      "🇮🇩Bahasa Indonesia",
    ]);
    await userEvent.click(screen.getByRole("option", { name: "Deutsch" }));
    expect(onChange).toHaveBeenCalledWith("de");
  });

  it("keeps an older free-text language shown and asks for a pick", () => {
    render(<LanguagePicker id="lang" onChange={vi.fn()} value="Indonesian" />);
    const picker = screen.getByRole("combobox", { name: "Language" });
    expect(picker.textContent).toContain("Indonesian");
    expect(
      screen.getByText(
        "“Indonesian” isn't on the list. Pick its language to save."
      )
    ).toBeTruthy();
  });

  it("only saves a code or none", () => {
    expect(pickedLanguage("")).toBeNull();
    expect(pickedLanguage("id")).toBe("id");
    expect(pickedLanguage("Indonesian")).toBe(false);
  });
});
