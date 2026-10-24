/**
 * Anonymised HTML exports of the notes and TL;DR documents, laid out like
 * Google Docs exports them: one class-based style sheet, a template preamble
 * before the first dated heading, `<span>` runs, empty spacer paragraphs,
 * bullet lists and links through google.com/url.
 */
const STYLE =
  '<style type="text/css">ol{margin:0;padding:0}.c0{color:#000000;font-weight:400;font-size:11pt;font-family:"Arial";font-style:normal}.c1{padding-top:0pt;line-height:1.15;text-align:left}.c2{font-weight:700}.c3{font-style:italic}.c4{padding:0;margin:0}.c5{padding-top:16pt;padding-bottom:4pt}.c6{color:#1155cc;text-decoration:underline}.c9{height:11pt}</style>';

const spacer = '<p class="c1 c9"><span class="c0"></span></p>';

export interface DocEntry {
  heading: string;
  /** Paragraph HTML; `**x**` becomes a bold run. */
  paragraphs: string[];
}

const BOLD_RUN = /\*\*(.+?)\*\*/g;

const paragraph = (text: string) =>
  `<p class="c1"><span class="c0">${text.replace(BOLD_RUN, '</span><span class="c0 c2">$1</span><span class="c0">')}</span></p>`;

const doc = (preamble: string, entries: DocEntry[]) =>
  `<html><head><meta content="text/html; charset=UTF-8" http-equiv="content-type">${STYLE}</head><body class="c4 doc-content">${preamble}${entries
    .map(
      (entry, index) =>
        `<h3 class="c5" id="h.entry${index}"><span class="c0">${entry.heading}</span></h3>${entry.paragraphs.map(paragraph).join(spacer)}${spacer}${spacer}`
    )
    .join("")}</body></html>`;

export const notesDoc = (entries: DocEntry[]) =>
  doc(
    `<div><p class="c1 c9"><span class="c0"></span></p></div><h3 class="c5" id="h.template"><span class="c0">Vorlage Catatan:</span></h3>${paragraph("Write the date first, then the title and the passage.")}`,
    entries
  );

export const tldrDoc = (entries: DocEntry[]) => doc("", entries);

export const NOTES: DocEntry[] = [
  {
    heading: "03-01-2026: Waiting in the Watchtower (Habakuk 1:2-2:5)",
    paragraphs: [
      "Speaker: Pdt. Guest",
      "God hears the **honest** question.",
      "We wait like a watchman waits for the morning.",
    ],
  },
  {
    heading: "10-01-2026: Joy When Life Is Not Fine (Habakuk 3:1-19)",
    paragraphs: [
      "Speaker: Pdt. Visitor",
      "Rejoice in the Lord anyway.",
      '<a class="c6" href="https://www.google.com/url?q=https://www.bible.com/&amp;sa=D&amp;source=editors">Read the passage</a>',
    ],
  },
  {
    heading: "07-06-2026: A Date Typed Wrong (Mazmur 23)",
    paragraphs: ["The heading says the 7th; the gathering was the 6th."],
  },
];

export const TLDRS: DocEntry[] = [
  {
    heading: "TL;DR PA Besar 03.01.2026 : Waiting in the Watchtower",
    paragraphs: ["Bring God your **honest** questions, then wait."],
  },
  {
    heading: "TL;DR Ibadah 10.01.2026 : Joy When Life Is Not Fine",
    paragraphs: ["Joy rests on God, not on how the week went."],
  },
];
