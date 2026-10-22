"use client";

import { Decoration, DecorationSet } from "@tiptap/pm/view";
import { EditorContent, useEditor } from "@tiptap/react";
import { MessageSquarePlus } from "lucide-react";
import { type ReactNode, useEffect, useRef, useState } from "react";
import { EditorBubbleMenu } from "~/components/kibo-ui/editor-bubble-menu";
import { Button } from "~/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "~/components/ui/popover";
import { QUOTE_MAX_LENGTH } from "~/lib/takeaway-comments";
import { PassageCommentForm } from "./passage-comment-form";
import { passageText, reviewReaderExtensions } from "./review-reader";

interface Passage {
  from: number;
  text: string;
  to: number;
}

/** A read-only Tiptap view of the already sanitized, server-rendered Markdown. */
export function QuoteablePassage({
  children,
  onSubmit,
}: {
  children: ReactNode;
  onSubmit: (input: { body: string; quote: string }) => Promise<void>;
}) {
  const fallback = useRef<HTMLDivElement>(null);
  const resumeButton = useRef<HTMLButtonElement>(null);
  const outsideDismiss = useRef(false);
  const [ready, setReady] = useState(false);
  const [selected, setSelected] = useState("");
  const [inside, setInside] = useState(false);
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const [pending, setPending] = useState(false);
  const [passage, setPassage] = useState<Passage | null>(null);
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

  const changeOpen = (next: boolean) => {
    if (!editor || pending) {
      return;
    }
    if (next) {
      outsideDismiss.current = false;
      const { from, to } = editor.state.selection;
      const text = passageText(editor.state.doc, from, to);
      const captured = draft && passage ? passage : { from, text, to };
      if (!captured.text || captured.text.length > QUOTE_MAX_LENGTH) {
        return;
      }
      setPassage(captured);
      highlight.current = captured;
      editor.commands.setTextSelection({
        from: captured.from,
        to: captured.to,
      });
    } else {
      highlight.current = null;
    }
    setOpen(next);
    editor.view.dispatch(editor.state.tr);
  };

  const tooLong = selected.length > QUOTE_MAX_LENGTH;
  return (
    <div className="min-w-0">
      {ready ? null : <div ref={fallback}>{children}</div>}
      <div hidden={!ready}>
        <EditorContent editor={editor} />
      </div>
      {draft && passage ? (
        <Button
          className="mt-3"
          hidden={open}
          onClick={() => {
            editor?.commands.setTextSelection({
              from: passage.from,
              to: passage.to,
            });
            changeOpen(true);
          }}
          ref={resumeButton}
          size="sm"
          type="button"
          variant="secondary"
        >
          <MessageSquarePlus aria-hidden="true" data-icon="inline-start">
            <title>Resume comment</title>
          </MessageSquarePlus>
          Resume comment
        </Button>
      ) : null}
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
          <Popover onOpenChange={changeOpen} open={open}>
            <PopoverTrigger asChild>
              <Button
                aria-label={
                  draft ? "Resume passage comment" : "Comment on selection"
                }
                disabled={tooLong && !draft}
                onPointerDown={(event) => event.preventDefault()}
                size="sm"
                type="button"
                variant="ghost"
              >
                <MessageSquarePlus data-icon="inline-start">
                  <title>Comment</title>
                </MessageSquarePlus>
                {draft ? "Resume comment" : "Comment"}
              </Button>
            </PopoverTrigger>
            {tooLong && !draft ? (
              <p
                className="max-w-52 px-2 py-1 text-muted-foreground text-xs"
                role="status"
              >
                Select up to {QUOTE_MAX_LENGTH} characters.
              </p>
            ) : null}
            <PopoverContent
              align="start"
              aria-label="Comment on passage"
              className="w-80 max-w-[calc(100vw-1.5rem)]"
              collisionPadding={12}
              onCloseAutoFocus={(event) => {
                // The selection trigger can be detached while the closing
                // animation finishes. Never let it steal focus from a newly
                // reopened composer or an outside input.
                event.preventDefault();
                if (
                  resumeButton.current &&
                  !resumeButton.current.hidden &&
                  !outsideDismiss.current
                ) {
                  resumeButton.current.focus({ preventScroll: true });
                }
              }}
              onInteractOutside={(event) => {
                // Radix defers outside-pointer dismissal until click. During
                // its exit animation, Resume can reopen this same composer;
                // that click must not immediately dismiss it a second time.
                if (
                  pending ||
                  (event.target instanceof Node &&
                    resumeButton.current?.contains(event.target))
                ) {
                  event.preventDefault();
                } else {
                  outsideDismiss.current = true;
                }
              }}
              side="bottom"
            >
              {passage ? (
                <PassageCommentForm
                  body={draft}
                  onBodyChange={setDraft}
                  onClose={() => changeOpen(false)}
                  onPendingChange={setPending}
                  onSubmit={async (input) => {
                    await onSubmit(input);
                    setDraft("");
                    setOpen(false);
                    highlight.current = null;
                    editor.commands.setTextSelection(passage.to);
                  }}
                  quote={passage.text}
                />
              ) : null}
            </PopoverContent>
          </Popover>
        </EditorBubbleMenu>
      ) : null}
    </div>
  );
}
