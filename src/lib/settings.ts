/** Keys of the `settings` table. */
export const SETTING_KEYS = {
  scheduleSheetId: "schedule_sheet_id",
} as const;
export type SettingKey = (typeof SETTING_KEYS)[keyof typeof SETTING_KEYS];

const SHEET_URL_ID = /\/spreadsheets\/d\/([\w-]+)/;
const SHEET_ID = /^[\w-]{20,}$/;

/**
 * The spreadsheet id in a pasted Google Sheets link
 * (https://docs.google.com/spreadsheets/d/<id>/edit#gid=0) or a bare id;
 * null when it's neither.
 */
export function sheetIdFrom(input: string): string | null {
  const value = input.trim();
  const fromUrl = SHEET_URL_ID.exec(value)?.[1];
  if (fromUrl) {
    return fromUrl;
  }
  return SHEET_ID.test(value) ? value : null;
}

export const sheetUrl = (sheetId: string) =>
  `https://docs.google.com/spreadsheets/d/${sheetId}/edit`;
