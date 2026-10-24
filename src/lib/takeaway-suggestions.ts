import { mayCommentOn } from "./takeaway-comments";
import {
  mayEditTakeaway,
  type TakeawaySubject,
  type TakeawayViewer,
} from "./takeaway-status";

/** The longest replacement a suggested edit accepts. */
export const REPLACEMENT_MAX_LENGTH = 2000;

/**
 * Who may suggest an edit (#58): every reviewer who may comment, while it is
 * a draft (#75); once submitted the text is locked. The writer edits their
 * own text directly instead.
 */
export const maySuggestOn = (
  takeaway: TakeawaySubject,
  viewer: TakeawayViewer
) =>
  takeaway.status === "draft" &&
  takeaway.authorId !== viewer.id &&
  mayCommentOn(takeaway, viewer);

/**
 * Who may accept or reject suggestions: whoever may change the text, i.e. its
 * writer, mita and the dev, while it is a draft.
 */
export const mayDecideSuggestions = mayEditTakeaway;

/**
 * The notes with the suggested passage replaced, or null when the passage no
 * longer appears exactly once (it changed since, or it is ambiguous). The
 * passage is the plain text a reviewer selected, so a selection across
 * formatting or paragraphs never matches and the writer applies it by hand.
 */
export const applySuggestion = (
  markdown: string,
  original: string,
  replacement: string
) => {
  const text = markdown.replaceAll("\r\n", "\n");
  const at = text.indexOf(original);
  if (at === -1 || text.indexOf(original, at + 1) !== -1) {
    return null;
  }
  return `${text.slice(0, at)}${replacement}${text.slice(at + original.length)}`;
};
