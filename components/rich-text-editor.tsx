import { useEditor, EditorContent, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import {
  Bold,
  Strikethrough,
  Italic,
  List,
  ListOrdered,
  LinkIcon,
} from "lucide-react";
import { Toggle } from "@/components/ui/toggle";
import { Separator } from "@/components/ui/separator";
import { Markdown } from "tiptap-markdown";
import { Link } from "@tiptap/extension-link";
import classNames from "classnames";
import { ToggleProps } from "@radix-ui/react-toggle";
import React from "react";

interface ToolbarToggleProps extends Omit<ToggleProps, "type"> {
  children: React.ReactNode;
}

const RichTextEditor = ({
  value,
  onChange,
  disabled = false,
}: {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}) => {
  const editor = useEditor({
    editorProps: {
      attributes: {
        class: classNames(
          "min-h-[250px] w-full px-4 py-3 text-base leading-relaxed focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 overflow-auto resize-y prose prose-neutral dark:prose-invert prose-headings:font-bold prose-p:my-2 prose-ul:my-2 prose-ol:my-2",
          { "opacity-50 cursor-not-allowed": disabled }
        ),
      },
    },
    editable: !disabled,
    extensions: [
      StarterKit.configure({
        orderedList: {
          HTMLAttributes: {
            class: "list-decimal pl-6 my-2",
          },
        },
        bulletList: {
          HTMLAttributes: {
            class: "list-disc pl-6 my-2",
          },
        },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: "text-primary underline decoration-primary underline-offset-4",
        },
      }),
      Markdown.configure({
        html: true,
        tightLists: true,
        tightListClass: "tight",
        bulletListMarker: "-",
        linkify: true,
        breaks: false,
        transformPastedText: true,
        transformCopiedText: true,
      }),
    ],
    content: value,
    onUpdate: ({ editor }) => {
      onChange(editor.storage.markdown.getMarkdown());
    },
  });

  const addLink = () => {
    const url = prompt("Enter the URL");
    if (url && editor) {
      editor
        .chain()
        .focus()
        .extendMarkRange("link")
        .setLink({ href: url })
        .run();
    }
  };

  return (
    <div className="border rounded-lg overflow-hidden bg-background">
      {editor ? (
        <RichTextEditorToolbar
          editor={editor}
          disabled={disabled}
          addLink={addLink}
        />
      ) : null}
      <div className="border-t">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
};

const RichTextEditorToolbar = ({
  editor,
  disabled,
  addLink,
}: {
  editor: Editor;
  disabled: boolean;
  addLink: () => void;
}) => {
  return (
    <div
      className={classNames(
        "bg-muted/50 p-2 flex flex-row items-center gap-1",
        { "opacity-50 cursor-not-allowed": disabled }
      )}
    >
      <ToolbarToggle
        pressed={editor.isActive("bold")}
        onPressedChange={() => editor.chain().focus().toggleBold().run()}
        disabled={disabled}
      >
        <Bold className="h-4 w-4" />
      </ToolbarToggle>
      <ToolbarToggle
        pressed={editor.isActive("italic")}
        onPressedChange={() => editor.chain().focus().toggleItalic().run()}
        disabled={disabled}
      >
        <Italic className="h-4 w-4" />
      </ToolbarToggle>
      <ToolbarToggle
        pressed={editor.isActive("strike")}
        onPressedChange={() => editor.chain().focus().toggleStrike().run()}
        disabled={disabled}
      >
        <Strikethrough className="h-4 w-4" />
      </ToolbarToggle>
      <Separator orientation="vertical" className="mx-1 h-6" />
      <ToolbarToggle
        pressed={editor.isActive("bulletList")}
        onPressedChange={() => editor.chain().focus().toggleBulletList().run()}
        disabled={disabled}
      >
        <List className="h-4 w-4" />
      </ToolbarToggle>
      <ToolbarToggle
        pressed={editor.isActive("orderedList")}
        onPressedChange={() => editor.chain().focus().toggleOrderedList().run()}
        disabled={disabled}
      >
        <ListOrdered className="h-4 w-4" />
      </ToolbarToggle>
      <Separator orientation="vertical" className="mx-1 h-6" />
      <ToolbarToggle
        pressed={editor.isActive("link")}
        onPressedChange={addLink}
        disabled={disabled}
      >
        <LinkIcon className="h-4 w-4" />
      </ToolbarToggle>
    </div>
  );
};

const ToolbarToggle: React.FC<ToolbarToggleProps> = ({
  children,
  ...props
}) => (
  <Toggle
    size="sm"
    variant="outline"
    className={classNames(
      "h-8 w-8 p-0 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground",
      "hover:bg-muted hover:text-foreground",
      "focus-visible:ring-1 focus-visible:ring-ring"
    )}
    {...props}
  >
    {React.cloneElement(children as React.ReactElement, {
      className: "h-4 w-4",
    })}
  </Toggle>
);

export default RichTextEditor;
