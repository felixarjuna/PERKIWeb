"use client";

import { Decoration, DecorationSet } from "@tiptap/pm/view";
import { type Editor, EditorContent, useEditor } from "@tiptap/react";
import { MessageSquarePlus, PencilLine } from "lucide-react";
import { type ReactNode, type Ref, useEffect, useRef, useState } from "react";
import { EditorBubbleMenu } from "~/components/kibo-ui/editor-bubble-menu";
import { Button } from "~/components/ui/button";
import {
  Popover,
  PopoverAnchor,
  PopoverContent,
} from "~/components/ui/popover";
import { QUOTE_MAX_LENGTH } from "~/lib/takeaway-comments";
import { PassageCommentForm } from "./passage-comment-form";
import { PassageSuggestionForm } from "./passage-suggestion-form";
import { passageText, reviewReaderExtensions } from "./review-reader";

interface Passage {
  from: number;
  text: string;
  to: number;
}

/** What the selection menu opens: a comment, or a suggested edit (#58). */
type Kind = "comment" | "suggest";

/** Unsent text for one kind, with the passage it was started on. */
interface Draft {
  passage: Passage;
  text: string;
}

const KINDS: Kind[] = ["comment", "suggest"];

const actions: Record<
  Kind,
  {
    draftLabel: string;
    icon: typeof MessageSquarePlus;
    label: string;
    name: string;
  }
> = {
  comment: {
    draftLabel: "Unsent comment",
    icon: MessageSquarePlus,
    label: "Comment",
    name: "Comment on selection",
  },
  suggest: {
    draftLabel: "Unsent suggestion",
    icon: PencilLine,
    label: "Suggest edit",
    name: "Suggest edit for selection",
  },
};

// A suggestion starts as the passage itself; it is a draft once changed.
const isDraft = (kind: Kind, draft: Draft | null): draft is Draft =>
  Boolean(
    draft?.text &&
      (kind === "comment" || draft.text.trim() !== draft.passage.text)
  );

/**
 * A read-only Tiptap view of the already sanitized, server-rendered Markdown.
 * Selecting a passage offers a comment on it, and with `onSuggest` an edit.
 */
export function QuoteablePassage({
  children,
  onSubmit,
  onSuggest,
}: {
  children: ReactNode;
  onSubmit: (input: { body: string; quote: string }) => Promise<void>;
  onSuggest?: (input: {
    original: string;
    replacement: string;
  }) => Promise<void>;
}) {
  const fallback = useRef<HTMLDivElement>(null);
  const draftRow = useRef<HTMLDivElement>(null);
  const menu = useRef<HTMLDivElement>(null);
  const outsideDismiss = useRef(false);
  const [ready, setReady] = useState(false);
  const [selected, setSelected] = useState("");
  const [inside, setInside] = useState(false);
  const [open, setOpen] = useState(false);
  const [kind, setKind] = useState<Kind>("comment");
  const [drafts, setDrafts] = useState<Record<Kind, Draft | null>>({
    comment: null,
    suggest: null,
  });
  const [pending, setPending] = useState(false);
  const highlight = useRef<Passage | null>(null);
  const editor = useEditor({
    editable: false,
    editorProps: {
      attributes: {
        "aria-label": "Takeaway text",
        class: "takeaway-prose",
        role: "document",
      },
      decorations: (state) => {
        const range = highlight.current;
        return range
          ? DecorationSet.create(state.doc, [
              Decoration.inline(range.from, range.to, {
                class: "bg-accent text-accent-foreground rounded-sm",
              }),
            ])
          : null;
      },
    },
    extensions: reviewReaderExtensions,
    immediatelyRender: false,
    onSelectionUpdate: ({ editor: current }) => {
      const { from, to } = current.state.selection;
      setSelected(passageText(current.state.doc, from, to));
    },
  });

  useEffect(() => {
    if (editor && fallback.current && !ready) {
      editor.commands.setContent(fallback.current.innerHTML, {
        emitUpdate: false,
      });
      setReady(true);
    }
  }, [editor, ready]);

  useEffect(() => {
    if (!editor) {
      return;
    }
    const checkSelection = () => {
      const selection = window.getSelection();
      setInside(
        Boolean(
          selection?.anchorNode &&
            selection.focusNode &&
            editor.view.dom.contains(selection.anchorNode) &&
            editor.view.dom.contains(selection.focusNode) &&
            !selection.isCollapsed
        )
      );
    };
    document.addEventListener("selectionchange", checkSelection);
    return () =>
      document.removeEventListener("selectionchange", checkSelection);
  }, [editor]);

  useEffect(() => {
    // ProseMirror ignores selections wholly outside a read-only document.
    // Explicitly dismiss its menu when that happens, without changing the quote.
    if (editor && ready && !inside && !open) {
      editor.commands.setMeta("review-comment-menu", "hide");
    }
    if (editor && ready && open) {
      editor.commands.setMeta("review-comment-menu", "show");
      editor.commands.setMeta("review-comment-menu", "updatePosition");
    }
  }, [editor, inside, open, ready]);

  const saved: Record<Kind, boolean> = {
    comment: isDraft("comment", drafts.comment),
    suggest: isDraft("suggest", drafts.suggest),
  };

  // Each kind keeps its draft's passage; without a draft it takes the
  // current selection, so a new selection never replaces a draft's quote.
  const startPassage = (current: Editor, nextKind: Kind) => {
    const existing = drafts[nextKind];
    const { from, to } = current.state.selection;
    const captured = isDraft(nextKind, existing)
      ? existing.passage
      : { from, text: passageText(current.state.doc, from, to), to };
    if (!captured.text || captured.text.length > QUOTE_MAX_LENGTH) {
      return false;
    }
    if (!isDraft(nextKind, existing)) {
      setDrafts((all) => ({
        ...all,
        [nextKind]: {
          passage: captured,
          text: nextKind === "suggest" ? captured.text : "",
        },
      }));
    }
    setKind(nextKind);
    highlight.current = captured;
    current.commands.setTextSelection({
      from: captured.from,
      to: captured.to,
    });
    return true;
  };

  const changeOpen = (next: boolean, nextKind: Kind = kind) => {
    if (!editor || pending) {
      return;
    }
    if (next) {
      outsideDismiss.current = false;
      if (!startPassage(editor, nextKind)) {
        return;
      }
    } else {
      highlight.current = null;
    }
    setOpen(next);
    editor.view.dispatch(editor.state.tr);
  };

  const setText = (text: string) =>
    setDrafts((all) => {
      const draft = all[kind];
      return draft ? { ...all, [kind]: { ...draft, text } } : all;
    });

  const sent = (passage: Passage) => {
    setDrafts((all) => ({ ...all, [kind]: null }));
    setOpen(false);
    highlight.current = null;
    editor?.commands.setTextSelection(passage.to);
  };

  const tooLong = selected.length > QUOTE_MAX_LENGTH;
  const composing = drafts[kind];
  const kinds = onSuggest ? KINDS : KINDS.slice(0, 1);
  return (
    <div className="min-w-0">
      {ready ? null : <div ref={fallback}>{children}</div>}
      <div hidden={!ready}>
        <EditorContent editor={editor} />
      </div>
      <UnsentDrafts
        composing={open ? kind : null}
        kinds={kinds.filter((each) => saved[each])}
        onOpen={(each) => {
          const passage = drafts[each]?.passage;
          if (passage) {
            editor?.commands.setTextSelection(passage);
          }
          changeOpen(true, each);
        }}
        ref={draftRow}
      />
      {editor && ready ? (
        <EditorBubbleMenu
          editor={editor}
          options={{
            flip: true,
            offset: 8,
            placement: "top-start",
            shift: { padding: 12 },
          }}
          pluginKey="review-comment-menu"
          shouldShow={({ state }) => {
            if (open) {
              return true;
            }
            return inside && !state.selection.empty;
          }}
        >
          <Popover onOpenChange={(next) => changeOpen(next)} open={open}>
            <PopoverAnchor className="flex items-center gap-1" ref={menu}>
              {kinds.map((each) => (
                <SelectionAction
                  active={open && kind === each}
                  disabled={tooLong && !saved[each]}
                  key={each}
                  kind={each}
                  // Each action toggles its own composer or switches to it.
                  onClick={() => changeOpen(!(open && kind === each), each)}
                  saved={saved[each]}
                />
              ))}
            </PopoverAnchor>
            {tooLong && !kinds.some((each) => saved[each]) ? (
              <p
                className="max-w-52 px-2 py-1 text-muted-foreground text-xs"
                role="status"
              >
                Select up to {QUOTE_MAX_LENGTH} characters.
              </p>
            ) : null}
            <PopoverContent
              align="start"
              aria-label={
                kind === "comment" ? "Comment on passage" : "Suggest an edit"
              }
              className="w-80 max-w-[calc(100vw-1.5rem)]"
              collisionPadding={12}
              onCloseAutoFocus={(event) => {
                // The selection menu can be detached while the closing
                // animation finishes. Never let it steal focus from a newly
                // reopened composer or an outside input; return focus to the
                // unsent draft's button when there is one.
                event.preventDefault();
                const button = draftRow.current?.querySelector<HTMLElement>(
                  `[data-kind="${kind}"]`
                );
                if (button && !button.hidden && !outsideDismiss.current) {
                  button.focus({ preventScroll: true });
                }
              }}
              onInteractOutside={(event) => {
                // Radix defers outside-pointer dismissal until click. The
                // menu's actions and the unsent drafts open, switch and close
                // the composer themselves; that click must not dismiss it.
                const { target } = event;
                if (
                  pending ||
                  (target instanceof Node &&
                    (draftRow.current?.contains(target) ||
                      menu.current?.contains(target)))
                ) {
                  event.preventDefault();
                } else {
                  outsideDismiss.current = true;
                }
              }}
              side="bottom"
            >
              {composing && kind === "suggest" && onSuggest ? (
                <PassageSuggestionForm
                  onClose={() => changeOpen(false)}
                  onPendingChange={setPending}
                  onReplacementChange={setText}
                  onSubmit={async (input) => {
                    await onSuggest(input);
                    sent(composing.passage);
                  }}
                  original={composing.passage.text}
                  replacement={composing.text}
                />
              ) : null}
              {composing && kind === "comment" ? (
                <PassageCommentForm
                  body={composing.text}
                  onBodyChange={setText}
                  onClose={() => changeOpen(false)}
                  onPendingChange={setPending}
                  onSubmit={async (input) => {
                    await onSubmit(input);
                    sent(composing.passage);
                  }}
                  quote={composing.passage.text}
                />
              ) : null}
            </PopoverContent>
          </Popover>
        </EditorBubbleMenu>
      ) : null}
    </div>
  );
}

/**
 * One action in the selection menu. A dot marks an unsent draft while its
 * composer is closed; the action reopens it with its own passage.
 */
function SelectionAction({
  active,
  disabled,
  kind,
  onClick,
  saved,
}: {
  active: boolean;
  disabled: boolean;
  kind: Kind;
  onClick: () => void;
  saved: boolean;
}) {
  const { icon: Icon, label, name } = actions[kind];
  return (
    <Button
      aria-expanded={active}
      aria-haspopup="dialog"
      aria-label={saved ? `${label} (draft saved)` : name}
      className="aria-expanded:bg-accent"
      disabled={disabled}
      onClick={onClick}
      onPointerDown={(event) => event.preventDefault()}
      size="sm"
      type="button"
      variant="ghost"
    >
      <Icon aria-hidden="true" data-icon="inline-start">
        <title>{label}</title>
      </Icon>
      {label}
      {saved && !active ? (
        <span aria-hidden="true" className="size-1.5 rounded-full bg-primary" />
      ) : null}
    </Button>
  );
}

/** Reopens drafts once the selection that showed the menu is gone. */
function UnsentDrafts({
  composing,
  kinds,
  onOpen,
  ref,
}: {
  /** The draft open in the composer, whose button hides but stays mounted. */
  composing: Kind | null;
  kinds: Kind[];
  onOpen: (kind: Kind) => void;
  ref: Ref<HTMLDivElement>;
}) {
  return (
    <div
      className="mt-3 flex flex-wrap gap-2"
      hidden={kinds.every((kind) => kind === composing)}
      ref={ref}
    >
      {kinds.map((kind) => {
        const { draftLabel, icon: Icon } = actions[kind];
        return (
          <Button
            data-kind={kind}
            hidden={kind === composing}
            key={kind}
            onClick={() => onOpen(kind)}
            size="sm"
            type="button"
            variant="secondary"
          >
            <Icon aria-hidden="true" data-icon="inline-start">
              <title>{draftLabel}</title>
            </Icon>
            {draftLabel}
          </Button>
        );
      })}
    </div>
  );
}
