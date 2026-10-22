import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { takeawaySamples } from "~/test/takeaway-samples";
import { TakeawayMarkdown } from "./takeaway-markdown";

describe("TakeawayMarkdown", () => {
  it("renders headings, lists, emphasis, quotes and line breaks", () => {
    const { container } = render(
      <TakeawayMarkdown markdown={takeawaySamples.markdown} />
    );
    expect(
      screen.getByRole("heading", { level: 2, name: "Integritas Nuh" }).tagName
    ).toBe("H2");
    expect(container.querySelector("strong")?.textContent).toBe(
      "Kejadian 8:20"
    );
    expect(container.querySelector("em")?.textContent).toBe("ketaatan");
    expect(container.querySelector("p br")).not.toBeNull();
    expect(screen.getAllByRole("listitem")).toHaveLength(2);
    expect(container.querySelector("blockquote")?.textContent).toContain(
      "persembahan yang harum"
    );
  });

  it("starts headings at h2, below the page's h1", () => {
    render(<TakeawayMarkdown markdown={"# Judul\n\n### Sub"} />);
    expect(
      screen.getByRole("heading", { level: 2, name: "Judul" }).tagName
    ).toBeTruthy();
    expect(
      screen.getByRole("heading", { level: 3, name: "Sub" }).tagName
    ).toBeTruthy();
    expect(screen.queryByRole("heading", { level: 1 })).toBeNull();
  });

  it("opens external links in a new tab without a referrer", () => {
    render(<TakeawayMarkdown markdown={takeawaySamples.markdown} />);
    const link = screen.getByRole("link", { name: "Alkitab" });
    expect(link.getAttribute("href")).toBe("https://alkitab.mobi/tb/Kej/8/");
    expect(link.getAttribute("target")).toBe("_blank");
    expect(link.getAttribute("rel")).toBe("noopener noreferrer");
  });

  it("keeps links within the site in the same tab", () => {
    render(<TakeawayMarkdown markdown="[Jadwal](/schedule)" />);
    expect(
      screen.getByRole("link", { name: "Jadwal" }).hasAttribute("target")
    ).toBe(false);
  });

  it("shows raw HTML as text and never runs it", () => {
    const { container } = render(
      <TakeawayMarkdown
        markdown={
          'Halo <script>alert(1)</script> <img src="x" onerror="alert(2)"> <b>tebal</b>\n\n<iframe src="https://evil.example"></iframe>'
        }
      />
    );
    for (const tag of ["script", "img", "b", "iframe"]) {
      expect(container.querySelector(tag)).toBeNull();
    }
    expect(container.textContent).toContain("<script>alert(1)</script>");
    expect(container.textContent).toContain("<b>tebal</b>");
  });

  it("empties unsafe link protocols", () => {
    render(
      <TakeawayMarkdown markdown="[klik](javascript:alert(1)) [data](data:text/html,x)" />
    );
    for (const name of ["klik", "data"]) {
      expect(screen.getByText(name).getAttribute("href") ?? "").toBe("");
    }
  });

  it("leaves images out", () => {
    const { container } = render(
      <TakeawayMarkdown markdown="![foto](https://tracker.example/pixel.png)" />
    );
    expect(container.querySelector("img")).toBeNull();
  });

  it("reads Word's padded list markers as a list", () => {
    const { container } = render(
      <TakeawayMarkdown markdown={takeawaySamples.paddedMarkers} />
    );
    expect(container.querySelector("pre")).toBeNull();
    expect(container.querySelector("ol li")?.textContent).toContain(
      "Ada mindset yang berubah"
    );
  });
});
