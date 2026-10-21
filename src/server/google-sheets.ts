const SHEETS_API = "https://sheets.googleapis.com/v4/spreadsheets";

// Validated in env.mjs; read directly so server tests need no full environment.

/** The schedule sheet's id, or null when the import isn't configured. */
export const scheduleSheetId = () => process.env.SCHEDULE_SHEET_ID || null;

async function sheetsRequest<T>(path: string): Promise<T> {
  const url = new URL(`${SHEETS_API}/${path}`);
  url.searchParams.set("key", process.env.NEXT_PUBLIC_GOOGLE_API_KEY ?? "");
  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`Google Sheets answered ${response.status}.`);
  }
  return (await response.json()) as T;
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
