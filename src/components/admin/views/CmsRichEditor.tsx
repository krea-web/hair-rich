"use client";

import { useEffect } from "react";
import { useEditor, EditorContent, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import { Markdown } from "tiptap-markdown";

interface CmsRichEditorProps {
    value: string;
    onChange: (markdown: string) => void;
}

function ToolbarButton({
    active,
    onClick,
    label,
    title,
}: {
    active?: boolean;
    onClick: () => void;
    label: string;
    title: string;
}) {
    return (
        <button
            type="button"
            title={title}
            onMouseDown={(e) => e.preventDefault()}
            onClick={onClick}
            className={`min-w-[30px] h-7 px-2 rounded text-xs font-body font-semibold transition-colors ${
                active
                    ? "bg-accent-warm text-black"
                    : "text-silver hover:text-warm-white hover:bg-carbon-2"
            }`}
        >
            {label}
        </button>
    );
}

function Toolbar({ editor }: { editor: Editor }) {
    const promptLink = () => {
        const prev = editor.getAttributes("link").href ?? "";
        const url = window.prompt("URL del link:", prev);
        if (url === null) return;
        if (url === "") {
            editor.chain().focus().extendMarkRange("link").unsetLink().run();
            return;
        }
        editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
    };

    return (
        <div className="flex flex-wrap items-center gap-1 border-b border-line bg-carbon px-2 py-1.5">
            <ToolbarButton
                title="Grassetto"
                label="B"
                active={editor.isActive("bold")}
                onClick={() => editor.chain().focus().toggleBold().run()}
            />
            <ToolbarButton
                title="Corsivo"
                label="I"
                active={editor.isActive("italic")}
                onClick={() => editor.chain().focus().toggleItalic().run()}
            />
            <span className="w-px h-5 bg-line mx-1" />
            <ToolbarButton
                title="Titolo grande"
                label="H2"
                active={editor.isActive("heading", { level: 2 })}
                onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            />
            <ToolbarButton
                title="Sottotitolo"
                label="H3"
                active={editor.isActive("heading", { level: 3 })}
                onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            />
            <span className="w-px h-5 bg-line mx-1" />
            <ToolbarButton
                title="Elenco puntato"
                label="•"
                active={editor.isActive("bulletList")}
                onClick={() => editor.chain().focus().toggleBulletList().run()}
            />
            <ToolbarButton
                title="Citazione"
                label="❝"
                active={editor.isActive("blockquote")}
                onClick={() => editor.chain().focus().toggleBlockquote().run()}
            />
            <ToolbarButton
                title="Link"
                label="🔗"
                active={editor.isActive("link")}
                onClick={promptLink}
            />
            <span className="flex-1" />
            <ToolbarButton
                title="Annulla (Ctrl+Z)"
                label="↶"
                onClick={() => editor.chain().focus().undo().run()}
            />
            <ToolbarButton
                title="Ripeti (Ctrl+Y)"
                label="↷"
                onClick={() => editor.chain().focus().redo().run()}
            />
        </div>
    );
}

export default function CmsRichEditor({ value, onChange }: CmsRichEditorProps) {
    const editor = useEditor({
        extensions: [
            StarterKit.configure({ codeBlock: false }),
            Link.configure({ openOnClick: false, autolink: false }),
            Markdown.configure({ html: false, transformPastedText: true }),
        ],
        content: value,
        editorProps: {
            attributes: {
                class: "prose-cms min-h-[120px] px-4 py-3 text-warm-white text-sm leading-relaxed focus:outline-none",
            },
        },
        onUpdate: ({ editor }) => {
            onChange(editor.storage.markdown.getMarkdown());
        },
    });

    // Sync external resets (e.g. "Annulla") without firing onUpdate, avoiding loops.
    useEffect(() => {
        if (!editor) return;
        const current = editor.storage.markdown.getMarkdown();
        if (value !== current) {
            editor.commands.setContent(value, false);
        }
    }, [value, editor]);

    if (!editor) return null;

    return (
        <div className="bg-black-2 border border-line rounded-md overflow-hidden">
            <Toolbar editor={editor} />
            <EditorContent editor={editor} />
        </div>
    );
}
