/** Keys of the `settings` table. */
export const SETTING_KEYS = {
  discordInviteUrl: "discord_invite_url",
  driveFolderUrl: "drive_folder_url",
  emailEnabled: "email_enabled",
  emailSender: "email_sender",
  scheduleSheetId: "schedule_sheet_id",
  takeawayDeadlineWeekday: "takeaway_deadline_weekday",
  takeawayNotesDocId: "takeaway_notes_doc_id",
  takeawayTldrDocId: "takeaway_tldr_doc_id",
  whatsappGroupUrl: "whatsapp_group_url",
} as const;
export type SettingKey = (typeof SETTING_KEYS)[keyof typeof SETTING_KEYS];

/** The invite used until staff set another one. */
export const DEFAULT_DISCORD_INVITE_URL = "https://discord.gg/4hf5yWFfVP";

const SHEET_URL_ID = /\/spreadsheets\/d\/([\w-]+)/;
const SHEET_ID = /^[\w-]{20,}$/;
const DOC_URL_ID =
  /^https:\/\/docs\.google\.com\/document\/(?:u\/\d+\/)?d\/([\w-]+)/;
const DISCORD_INVITE_PATH = /^\/(invite\/)?[\w-]+\/?$/;
const WHATSAPP_GROUP_PATH = /^\/[\w-]+\/?$/;

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

/**
 * The document id in a pasted Google Docs link
 * (https://docs.google.com/document/d/<id>/edit) or a bare id; null otherwise.
 */
export function docIdFrom(input: string): string | null {
  const value = input.trim();
  const fromUrl = DOC_URL_ID.exec(value)?.[1];
  if (fromUrl) {
    return fromUrl;
  }
  return SHEET_ID.test(value) ? value : null;
}

export const docUrl = (docId: string) =>
  `https://docs.google.com/document/d/${docId}/edit`;

export const sheetUrl = (sheetId: string) =>
  `https://docs.google.com/spreadsheets/d/${sheetId}/edit`;

const httpsUrl = (input: string) => {
  const value = input.trim();
  if (!URL.canParse(value)) {
    return null;
  }
  const url = new URL(value);
  return url.protocol === "https:" ? url : null;
};

/** A Google Drive link (folder or file), or null. */
export function driveUrlFrom(input: string): string | null {
  const url = httpsUrl(input);
  return url?.hostname === "drive.google.com" ? url.toString() : null;
}

/** A Discord invite (discord.gg/<code> or discord.com/invite/<code>), or null. */
export function discordInviteFrom(input: string): string | null {
  const url = httpsUrl(input);
  if (!url) {
    return null;
  }
  const isInvite =
    (url.hostname === "discord.gg" && DISCORD_INVITE_PATH.test(url.pathname)) ||
    (["discord.com", "www.discord.com"].includes(url.hostname) &&
      url.pathname.startsWith("/invite/"));
  return isInvite ? url.toString() : null;
}

/** A WhatsApp group invite (chat.whatsapp.com/<code>), or null. */
export function whatsappGroupFrom(input: string): string | null {
  const url = httpsUrl(input);
  return url?.hostname === "chat.whatsapp.com" &&
    WHATSAPP_GROUP_PATH.test(url.pathname)
    ? url.toString()
    : null;
}
