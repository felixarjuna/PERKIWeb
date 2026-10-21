const WHITESPACE = /\s+/;

/** "Welcome, Maria" from the account name, or just "Welcome". */
export function welcomeTitle(name: string | null | undefined): string {
  const first = name?.trim().split(WHITESPACE)[0];
  return first ? `Welcome, ${first}` : "Welcome";
}
