// The API key is validated in env.mjs; read directly so server tests need no
// full environment. Which sheet to read is a workspace setting; e2e points
// GOOGLE_SHEETS_URL at a local stand-in.
const sheetsApi = () =>
  `${process.env.GOOGLE_SHEETS_URL || "https://sheets.googleapis.com"}/v4/spreadsheets`;

async function sheetsRequest<T>(path: string): Promise<T> {
  const url = new URL(`${sheetsApi()}/${path}`);
  url.searchParams.set("key", process.env.NEXT_PUBLIC_GOOGLE_API_KEY ?? "");
  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`Google Sheets answered ${response.status}.`);
  }
  return (await response.json()) as T;
}

/** A spreadsheet's file name, e.g. "2026 - Jadwal Pelayanan PERKI". */
export async function sheetTitle(sheetId: string): Promise<string> {
  const data = await sheetsRequest<{ properties?: { title?: string } }>(
    `${encodeURIComponent(sheetId)}?fields=properties.title`
  );
  return data.properties?.title ?? "";
}

/** Tab titles of a spreadsheet, in sheet order. */
export async function sheetTabs(sheetId: string): Promise<string[]> {
  const data = await sheetsRequest<{
    sheets?: { properties?: { title?: string } }[];
  }>(`${encodeURIComponent(sheetId)}?fields=sheets.properties.title`);
  return (data.sheets ?? []).flatMap((sheet) =>
    sheet.properties?.title ? [sheet.properties.title] : []
  );
}

/** Every cell of a tab as text, row by row (trailing empty cells are left out). */
export async function sheetValues(
  sheetId: string,
  tab: string
): Promise<string[][]> {
  const range = encodeURIComponent(`'${tab.replaceAll("'", "''")}'`);
  const data = await sheetsRequest<{ values?: string[][] }>(
    `${encodeURIComponent(sheetId)}/values/${range}`
  );
  return data.values ?? [];
}
