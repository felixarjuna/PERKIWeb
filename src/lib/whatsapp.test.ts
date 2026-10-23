import { describe, expect, it } from "vitest";
import { markdownToWhatsApp, whatsAppPost } from "./whatsapp";

describe("markdownToWhatsApp", () => {
  it("turns Markdown emphasis into WhatsApp's", () => {
    expect(
      markdownToWhatsApp("Abraham **believed** God, *by faith*, ~~not sight~~.")
    ).toBe("Abraham *believed* God, _by faith_, ~not sight~.");
  });

  it("writes headings bold and keeps paragraphs apart", () => {
    expect(markdownToWhatsApp("## Faith\n\nFirst.\nSecond line.")).toBe(
      "*Faith*\n\nFirst.\nSecond line."
    );
  });

  it("writes lists, numbered lists and quotes the way WhatsApp formats them", () => {
    expect(
      markdownToWhatsApp(
        "- Trust\n- Obey\n  - Today\n\n3. Three\n4. Four\n\n> Be still"
      )
    ).toBe("- Trust\n- Obey\n  - Today\n\n3. Three\n4. Four\n\n> Be still");
  });

  it("spells out links whose text isn't the address", () => {
    expect(
      markdownToWhatsApp("Read [Romans 4](https://alkitab.mobi/tb/Rm/4)")
    ).toBe("Read Romans 4 (https://alkitab.mobi/tb/Rm/4)");
    expect(markdownToWhatsApp("https://perkiaachen.de")).toBe(
      "https://perkiaachen.de"
    );
  });
});

describe("whatsAppPost", () => {
  it("puts the title above the TL;DR and the link to the notes below", () => {
    expect(
      whatsAppPost({
        title: "Living by faith",
        tldr: "Abraham **believed**.",
        url: "https://perkiaachen.de/takeaway/7",
      })
    ).toBe(
      "*Living by faith*\n\nAbraham *believed*.\n\nRead the whole takeaway: https://perkiaachen.de/takeaway/7"
    );
  });
});
