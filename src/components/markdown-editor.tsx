"use client";

import { Markdown } from "@tiptap/markdown";
import {
  type Editor,
  EditorContent,
  useEditor,
  useEditorState,
} from "@tiptap/react";
import {
  Bold,
  Heading2,
  Heading3,
  Italic,
  Link2,
  List,
  ListOrdered,
  Quote,
  Redo2,
  Undo2,
} from "lucide-react";
import {
  type KeyboardEvent,
  type MouseEvent,
  type ReactNode,
  type Ref,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "~/components/ui/popover";
import { Toggle } from "~/components/ui/toggle";
import { tidyMarkdown } from "~/lib/markdown";
import { editorExtensions } from "~/lib/takeaway-editor";
import { cn } from "~/lib/utils";

/**
 * Toolbar buttons keep focus (and the selection) in the editor: a button that
 * took focus would hand it back a frame later, losing keys typed meanwhile.
 */
const keepEditorFocus = (event: MouseEvent) => event.preventDefault();

const HAS_SCHEME = /^[a-z][a-z\d+.-]*:/i;

/** "alkitab.mobi/tb" → "https://alkitab.mobi/tb"; site paths stay as they are. */
export function linkHref(text: string) {
  const href = text.trim();
  if (
    !href ||
    HAS_SCHEME.test(href) ||
    href.startsWith("/") ||
    href.startsWith("#")
  ) {
    return href;
  }
  return `https://${href}`;
}

interface MarkdownEditorProps {
  readonly "aria-describedby"?: string;
  readonly "aria-invalid"?: boolean;
  /** The visible label's id: a contenteditable can't be a label's `for`. */
  readonly "aria-labelledby": string;
  readonly className?: string;
  readonly disabled?: boolean;
  readonly id?: string;
  readonly onBlur?: () => void;
  readonly onChange: (markdown: string) => void;
  readonly ref?: Ref<{ focus: () => void }>;
  /** Names the toolbar, so two editors on one page stay distinct. */
  readonly toolbarLabel?: string;
  readonly value: string | undefined;
}

/**
 * A word-processor-style editor that reads and writes a takeaway's Markdown.
 * Writers format with the toolbar or shortcuts (Ctrl+B, "## ", "- ", "1. ")
 * and see the note styled as the takeaway page shows it.
 */
export function MarkdownEditor({
  "aria-describedby": describedBy,
  "aria-invalid": invalid,
  "aria-labelledby": labelledBy,
  className,
  disabled = false,
  id,
  onBlur,
  onChange,
  ref,
  toolbarLabel = "Formatting",
  value = "",
}: MarkdownEditorProps) {
  // The Markdown this editor last showed or reported, so a new `value` from
  // outside (the edit form loading its takeaway) replaces the content once.
  // Null until the first value is shown: the editor starts empty and the
  // effect below fills it, so the text never shows before this is in step
  // (otherwise the first keystrokes could be overwritten by that effect).
  const current = useRef<string | null>(null);
  // The editable element is the form control: it carries the field's id,
  // label, description and error state.
  const attributes: Record<string, string> = {
    "aria-describedby": describedBy ?? "",
    "aria-invalid": String(Boolean(invalid)),
    "aria-labelledby": labelledBy,
    "aria-multiline": "true",
    class: "takeaway-prose min-h-48 px-3 py-2 outline-none",
    ...(id ? { id } : {}),
    role: "textbox",
  };
  const editor = useEditor({
    content: "",
    contentType: "markdown",
    editable: !disabled,
    editorProps: { attributes },
    extensions: [...editorExtensions, Markdown],
    // Rendered on the client only: the server has no editor to hydrate.
    immediatelyRender: false,
    onBlur: () => onBlur?.(),
    onUpdate: ({ editor: updated }) => {
      const markdown = updated.getMarkdown();
      if (markdown !== current.current) {
        current.current = markdown;
        onChange(markdown);
      }
    },
  });

  useImperativeHandle(
    ref,
    () => ({
      focus: () => {
        editor?.commands.focus();
      },
    }),
    [editor]
  );

  useEffect(() => {
    if (editor && value !== current.current) {
      current.current = value;
      editor.commands.setContent(tidyMarkdown(value), {
        contentType: "markdown",
        emitUpdate: false,
      });
    }
  }, [editor, value]);

  useEffect(() => {
    editor?.setEditable(!disabled);
  }, [editor, disabled]);

  // A label's `for` only focuses form elements, so clicking "Notes"
  // would do nothing; put the cursor at the end of the note instead.
  useEffect(() => {
    const label = id
      ? document.querySelector(`label[for="${CSS.escape(id)}"]`)
      : null;
    if (!(editor && label)) {
      return;
    }
    const focus = () => editor.commands.focus("end");
    label.addEventListener("click", focus);
    return () => label.removeEventListener("click", focus);
  }, [editor, id]);

  // Keep the attributes in step with the field, e.g. after a failed submit.
  const attributeKey = JSON.stringify(attributes);
  useEffect(() => {
    editor?.setOptions({
      editorProps: { attributes: JSON.parse(attributeKey) },
    });
  }, [editor, attributeKey]);

  return (
    <div
      className={cn(
        "rounded-md bg-secondary ring-offset-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2",
        disabled && "cursor-not-allowed opacity-50",
        className
      )}
    >
      {editor ? <Toolbar editor={editor} label={toolbarLabel} /> : null}
      <EditorContent editor={editor} />
    </div>
  );
}

function Toolbar({
  editor,
  label,
}: {
  readonly editor: Editor;
  readonly label: string;
}) {
  const state = useEditorState({
    editor,
    selector: ({ editor: e }) => ({
      blockquote: e.isActive("blockquote"),
      bold: e.isActive("bold"),
      bulletList: e.isActive("bulletList"),
      canRedo: e.can().redo(),
      canUndo: e.can().undo(),
      h2: e.isActive("heading", { level: 2 }),
      h3: e.isActive("heading", { level: 3 }),
      italic: e.isActive("italic"),
      link: e.isActive("link"),
      orderedList: e.isActive("orderedList"),
    }),
  });
  const chain = () => editor.chain().focus();

  return (
    <div
      aria-controls={editor.view.dom.id || undefined}
      aria-label={label}
      className="flex items-center gap-0.5 overflow-x-auto border-background border-b p-1 sm:gap-1"
      role="toolbar"
    >
      <Tool
        label="Heading"
        onPress={() => chain().toggleHeading({ level: 2 }).run()}
        pressed={state.h2}
      >
        <Heading2 />
      </Tool>
      <Tool
        label="Subheading"
        onPress={() => chain().toggleHeading({ level: 3 }).run()}
        pressed={state.h3}
      >
        <Heading3 />
      </Tool>
      <Tool
        label="Bold"
        onPress={() => chain().toggleBold().run()}
        pressed={state.bold}
      >
        <Bold />
      </Tool>
      <Tool
        label="Italic"
        onPress={() => chain().toggleItalic().run()}
        pressed={state.italic}
      >
        <Italic />
      </Tool>
      <Tool
        label="Bulleted list"
        onPress={() => chain().toggleBulletList().run()}
        pressed={state.bulletList}
      >
        <List />
      </Tool>
      <Tool
        label="Numbered list"
        onPress={() => chain().toggleOrderedList().run()}
        pressed={state.orderedList}
      >
        <ListOrdered />
      </Tool>
      <Tool
        label="Quote"
        onPress={() => chain().toggleBlockquote().run()}
        pressed={state.blockquote}
      >
        <Quote />
      </Tool>
      <LinkTool active={state.link} editor={editor} />
      {/* Phones undo with the system gesture, which the editor handles; the
          eight formatting tools then fit one row at 390px. */}
      <span className="ms-auto hidden gap-1 sm:flex">
        <Button
          aria-label="Undo"
          disabled={!state.canUndo}
          onClick={() => chain().undo().run()}
          onMouseDown={keepEditorFocus}
          size="icon"
          title="Undo"
          type="button"
          variant="ghost"
        >
          <Undo2 className="size-4" />
        </Button>
        <Button
          aria-label="Redo"
          disabled={!state.canRedo}
          onClick={() => chain().redo().run()}
          onMouseDown={keepEditorFocus}
          size="icon"
          title="Redo"
          type="button"
          variant="ghost"
        >
          <Redo2 className="size-4" />
        </Button>
      </span>
    </div>
  );
}

function Tool({
  children,
  label,
  onPress,
  pressed,
}: {
  readonly children: ReactNode;
  readonly label: string;
  readonly onPress: () => void;
  readonly pressed: boolean;
}) {
  return (
    <Toggle
      aria-label={label}
      onMouseDown={keepEditorFocus}
      onPressedChange={onPress}
      pressed={pressed}
      title={label}
      type="button"
    >
      {children}
    </Toggle>
  );
}

function LinkTool({
  active,
  editor,
}: {
  readonly active: boolean;
  readonly editor: Editor;
}) {
  const [open, setOpen] = useState(false);
  const [href, setHref] = useState("");

  const onOpenChange = (next: boolean) => {
    if (next) {
      setHref(editor.getAttributes("link").href ?? "");
    }
    setOpen(next);
  };

  const apply = () => {
    const target = linkHref(href);
    const chain = editor.chain().focus().extendMarkRange("link");
    if (target) {
      chain.setLink({ href: target }).run();
    } else {
      chain.unsetLink().run();
    }
    setOpen(false);
  };

  // Enter adds the link instead of submitting the takeaway form.
  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      apply();
    }
  };

  return (
    <Popover onOpenChange={onOpenChange} open={open}>
      <PopoverTrigger asChild>
        <Toggle
          aria-label="Link"
          onMouseDown={keepEditorFocus}
          pressed={active}
          title="Link"
          type="button"
        >
          <Link2 />
        </Toggle>
      </PopoverTrigger>
      <PopoverContent align="start" className="space-y-3">
        <Label className="type-body-sm block space-y-2">
          <span>Link address</span>
          <Input
            inputMode="url"
            onChange={(event) => setHref(event.target.value)}
            onKeyDown={onKeyDown}
            placeholder="alkitab.mobi/tb/Kej/8"
            value={href}
          />
        </Label>
        <div className="flex justify-end gap-2">
          {active ? (
            <Button
              onClick={() => {
                editor
                  .chain()
                  .focus()
                  .extendMarkRange("link")
                  .unsetLink()
                  .run();
                setOpen(false);
              }}
              size="sm"
              type="button"
              variant="ghost"
            >
              Remove link
            </Button>
          ) : null}
          <Button onClick={apply} size="sm" type="button">
            {active ? "Update link" : "Add link"}
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
