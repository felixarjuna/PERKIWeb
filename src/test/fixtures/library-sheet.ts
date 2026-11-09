/**
 * An anonymised copy of the library's book list, laid out like the real one:
 * an unnamed index column, then Title, Author, Publisher, Category, Language,
 * Type, Owner, Lent to, Notes and Review. Titles, authors and people are
 * invented; the value shapes (several owners in one cell, "Ebook, Fisik",
 * "English, Indonesia", "Perki", link rows) are the real sheet's. Trailing
 * empty cells are left out, as Google sends them.
 */
export const LIBRARY_SHEET: string[][] = [
  [
    "0",
    "Title",
    "Author",
    "Publisher",
    "Category",
    "Language",
    "Type",
    "Owner",
    "Lent to",
    "Notes",
    "Review",
  ],
  [
    "1",
    "The Lantern Case",
    "Mara Ellison",
    "Crossway Books",
    "Apologetic",
    "English",
    "Fisik",
    "PERKI",
    "Dara",
    "A detective weighs the evidence for the resurrection.",
  ],
  [
    "2",
    "Walking Together",
    "Owen Pritchard",
    "Banner Of Truth",
    "Church",
    "English",
    "Ebook",
    "Perki",
  ],
  [
    "3",
    "Quiet Harbour",
    "Lena Sutanto",
    "",
    "Christian Life",
    "Indo",
    "Fisik",
    "Arlo, Wren, Vito",
  ],
  [
    "4",
    "Rooted Hearts",
    "Clara Wibisono",
    "Crossway",
    "Women's Book",
    "English, Indonesia",
    "Ebook, Fisik",
    "Wren",
  ],
  [
    "5",
    "Two by Two",
    "Felix Hartono",
    "",
    "Relationship",
    "Indonesia",
    "Fisik, Ebook",
    "",
    "",
    "https://example.org/two-by-two",
  ],
  [
    "6",
    "Small Lamps",
    "Ivo Brandt",
    "Banner of Truth",
    "Biography",
    "Korean",
    "",
    "Arlo",
    "Nadia",
  ],
  [
    "7",
    "Free Christian Books",
    "Misc. authors",
    "",
    "",
    "",
    "Ebook",
    "PERKI",
    "",
    "https://example.org/free-books",
  ],
  [
    "8",
    "Free Christian Books",
    "Misc. authors",
    "",
    "",
    "",
    "Ebook",
    "PERKI",
    "",
    "https://example.org/more-free-books",
  ],
  ["9", "Lowly Paths", "Ruth Amadi", "", "Gospel Humility", "", "Fisik", "Kai"],
  [],
  ["10"],
];

/**
 * An anonymised lending history ("Peminjaman"), laid out like the real tab:
 * Tahun and Bulan written once per month and carried down, an empty row
 * between months, "extend" in Catatan, owners spelled slightly differently
 * ("Arlo."), a title missing from the book list and an extend without a lend.
 */
export const LENDING_SHEET: string[][] = [
  ["Tahun", "Bulan", "Title", "Pemilik", "Peminjam", "Catatan"],
  ["2025", "Desember", "Lowly Paths", "Kai", "Dara"],
  [],
  ["2026", "Juni", "The Lantern Case", "PERKI", "Kai"],
  ["", "", "Quiet Harbour", "Arlo", "Dara"],
  ["", "", "Lowly Paths", "Kai", "Vito"],
  [],
  ["", "Juli", "The Lantern Case", "Perki", "Kai", "extend"],
  ["", "", "Quiet Harbour", "Arlo.", "Dara", "extend"],
  [],
  ["", "Agustus", "The Lantern Case", "PERKI", "Dara"],
  ["", "", "Morning Psalms", "PERKI", "Kai"],
  ["", "", "Small Lamps", "Arlo", "Nadia"],
  [],
  ["", "September", "The Lantern Case", "PERKI", "Dara", "extend"],
  ["", "", "Lowly Paths", "Kai", "Arlo", "extend"],
  ["", "", "Quiet Harbour", "Vito", "Kai"],
  [],
  ["", "Oktober", "Small Lamps", "Arlo", "Nadia", "extend"],
  ["", "", "Quiet Harbour", "Wren", "Dara"],
];

/** The people the fixture names, by how it writes them. */
export const LIBRARY_SHEET_PEOPLE = {
  borrowers: ["Dara", "Nadia"],
  owners: ["Arlo", "Wren", "Vito", "Kai"],
};
