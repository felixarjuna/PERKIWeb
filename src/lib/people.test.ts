import { describe, expect, it } from "vitest";
import { initials, nameKey, suggestAccount } from "./people";

const account = (id: string, name: string) => ({ id, image: null, name });
const accounts = [
  account("winston-a", "Winston Alexander"),
  account("winston-y", "Winston Yap"),
  account("karyn", "Karyn Gaspersz"),
  account("felix", "Felix Arjuna"),
  account("jericho", "Jericho Oland Marsahala"),
  account("wins", "Wins"),
  account("eli", "Eli V"),
];

describe("nameKey", () => {
  it("ignores case, dots and extra spaces", () => {
    expect(nameKey("  Winston   A. ")).toBe("winston a");
    expect(nameKey("Jason C.")).toBe(nameKey("jason c"));
  });
});

describe("initials", () => {
  it("uses the first and last word and skips notes in brackets", () => {
    expect(initials("Jericho Oland Marsahala")).toBe("JM");
    expect(initials("Felix")).toBe("F");
    expect(initials("Marcelian (Elin)")).toBe("M");
    expect(initials("Pdt. John Kusuma")).toBe("PK");
  });
});

describe("suggestAccount", () => {
  it("matches abbreviations, typos and unique first names", () => {
    expect(suggestAccount("Winston A.", accounts)?.id).toBe("winston-a");
    expect(suggestAccount("Karyn Gasperz", accounts)?.id).toBe("karyn");
    expect(suggestAccount("Felix", accounts)?.id).toBe("felix");
  });

  it("suggests nothing when a first name is shared or nothing fits", () => {
    expect(suggestAccount("Winston", accounts)).toBeNull();
    expect(suggestAccount("Jco", accounts)).toBeNull();
    expect(suggestAccount("Pdt. John Kusuma", accounts)).toBeNull();
    // Short names never match by typo.
    expect(suggestAccount("Nina", accounts)).toBeNull();
    expect(suggestAccount("Elin", accounts)).toBeNull();
  });

  it("prefers an exact name over a looser match", () => {
    const withCousin = [...accounts, account("felix-2", "Felix Arjun")];
    expect(suggestAccount("Felix Arjuna", withCousin)?.id).toBe("felix");
  });
});
