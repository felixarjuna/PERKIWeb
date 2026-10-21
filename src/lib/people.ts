const WHITESPACE = /\s+/;
const BRACKETED = /\(.*?\)/g;
const LETTER = /\p{L}/u;

/** Lowercase, no dots, single spaces: "Winston  A." and "winston a" are one spelling. */
export const nameKey = (name: string) =>
  name
    .toLowerCase()
    .replaceAll(".", " ")
    .split(WHITESPACE)
    .filter(Boolean)
    .join(" ");

/** Up to two initials for an avatar without a photo. */
export function initials(name: string) {
  const words = name
    .replace(BRACKETED, " ")
    .split(WHITESPACE)
    .filter((word) => LETTER.test(word));
  const first = words.at(0)?.at(0) ?? "?";
  const last = words.length > 1 ? (words.at(-1)?.at(0) ?? "") : "";
  return `${first}${last}`.toUpperCase();
}

/** Someone shown on a public page: their name, and a photo only for signed-in viewers. */
export interface Person {
  image: string | null;
  name: string;
}

export interface Account {
  id: string;
  image: string | null;
  name: string | null;
}

/** Edit distance, for spelling slips like "Gasperz" / "Gaspersz". */
function distance(a: string, b: string) {
  let previous = Array.from({ length: b.length + 1 }, (_, index) => index);
  for (const [i, charA] of [...a].entries()) {
    const current = [i + 1];
    for (const [j, charB] of [...b].entries()) {
      current.push(
        Math.min(
          (previous[j + 1] ?? 0) + 1,
          (current[j] ?? 0) + 1,
          (previous[j] ?? 0) + (charA === charB ? 0 : 1)
        )
      );
    }
    previous = current;
  }
  return previous.at(-1) ?? 0;
}

/** Every written word starts the matching word of the account name, in order ("winston a" → "winston alexander"). */
const abbreviates = (written: string[], full: string[]) =>
  written.length <= full.length &&
  written.every((word, index) => full[index]?.startsWith(word));

/**
 * Same first name, and the other written words appear later in the account
 * name in order: a skipped middle name ("Steffen Tjandra" → "Steffen Josua
 * Tjandra"), also abbreviated ("Steffen T.").
 */
function skipsMiddleNames(written: string[], full: string[]) {
  if (written[0] !== full[0]) {
    return false;
  }
  let next = 1;
  for (const word of written.slice(1)) {
    const found = full.findIndex(
      (candidate, index) => index >= next && candidate.startsWith(word)
    );
    if (found === -1) {
      return false;
    }
    next = found + 1;
  }
  return true;
}

const MAX_TYPOS = 2;

/** How well a written name fits an account name; 0 means not at all. */
function score(written: string, full: string) {
  if (written === full) {
    return 4;
  }
  const writtenWords = written.split(" ");
  const fullWords = full.split(" ");
  if (
    writtenWords.length > 1 &&
    (abbreviates(writtenWords, fullWords) ||
      skipsMiddleNames(writtenWords, fullWords))
  ) {
    return 3;
  }
  // Typos only count on full names; two letters off a short first name is
  // another person ("Nina" is not "Wins").
  if (writtenWords.length > 1 && distance(written, full) <= MAX_TYPOS) {
    return 2;
  }
  if (writtenWords.length === 1 && fullWords[0] === written) {
    return 1;
  }
  return 0;
}

/**
 * The account a written name most likely means, or null when nothing fits or
 * two accounts fit equally well (e.g. a first name shared by two members).
 */
export function suggestAccount<T extends Account>(
  name: string,
  accounts: readonly T[]
): T | null {
  const written = nameKey(name);
  let best: T | null = null;
  let bestScore = 0;
  let tied = false;
  for (const account of accounts) {
    const value = account.name ? score(written, nameKey(account.name)) : 0;
    if (value > bestScore) {
      best = account;
      bestScore = value;
      tied = false;
    } else if (value > 0 && value === bestScore) {
      tied = true;
    }
  }
  return tied ? null : best;
}
