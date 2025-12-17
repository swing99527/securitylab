"use client"

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import { Button } from '@/components/ui/button'
import { useState } from 'react'
import {
    Loader2, Save, X,
    Bold, Italic, List, ListOrdered,
    Heading2, Heading3, Quote, Code,
    Undo, Redo
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Separator } from '@/components/ui/separator'

interface SectionEditorProps {
    sectionId: string
    initialContent: string
    onSave: (content: string) => Promise<void>
    onCancel: () => void
    readOnly?: boolean
}

export function SectionEditor({
    sectionId,
    initialContent,
    onSave,
    onCancel,
    readOnly = false
}: SectionEditorProps) {
    const [saving, setSaving] = useState(false)

    const editor = useEditor({
        extensions: [
            StarterKit,
            Placeholder.configure({
                placeholder: '开始编写内容...',
            }),
        ],
        content: initialContent || '<p></p>',
        editable: !readOnly,
        immediatelyRender: false,
        editorProps: {
            attributes: {
                class: 'prose prose-slate dark:prose-invert max-w-none focus:outline-none px-8 py-6 text-base leading-relaxed',
            },
        },
    })

    const handleSave = async () => {
        if (!editor) return

        setSaving(true)
        try {
            const html = editor.getHTML()
            await onSave(html)
        } catch (error) {
            console.error('保存失败:', error)
        } finally {
            setSaving(false)
        }
    }

    if (!editor) {
        return (
            <div className="flex items-center justify-center h-96 text-muted-foreground">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        )
    }

    const ToolbarButton = ({
        onClick,
        isActive,
        icon: Icon,
        label
    }: {
        onClick: () => void
        isActive?: boolean
        icon: any
        label: string
    }) => (
        <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onClick}
            className={cn(
                'h-9 w-9 p-0 hover:bg-accent hover:text-accent-foreground transition-colors',
                isActive && 'bg-accent text-accent-foreground'
            )}
            disabled={readOnly}
            title={label}
        >
            <Icon className="h-4 w-4" />
        </Button>
    )

    return (
        <div className="rounded-lg border border-border bg-background shadow-sm overflow-hidden h-full flex flex-col">
            {/* Modern Toolbar */}
            <div className="border-b border-border bg-muted/30 px-4 py-2 flex-shrink-0">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1">
                        {/* Text Formatting */}
                        <div className="flex items-center gap-0.5">
                            <ToolbarButton
                                onClick={() => editor.chain().focus().toggleBold().run()}
                                isActive={editor.isActive('bold')}
                                icon={Bold}
                                label="加粗 (Ctrl+B)"
                            />
                            <ToolbarButton
                                onClick={() => editor.chain().focus().toggleItalic().run()}
                                isActive={editor.isActive('italic')}
                                icon={Italic}
                                label="斜体 (Ctrl+I)"
                            />
                            <ToolbarButton
                                onClick={() => editor.chain().focus().toggleCode().run()}
                                isActive={editor.isActive('code')}
                                icon={Code}
                                label="代码"
                            />
                        </div>

                        <Separator orientation="vertical" className="mx-2 h-6" />

                        {/* Headings */}
                        <div className="flex items-center gap-0.5">
                            <ToolbarButton
                                onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                                isActive={editor.isActive('heading', { level: 2 })}
                                icon={Heading2}
                                label="标题 2"
                            />
                            <ToolbarButton
                                onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
                                isActive={editor.isActive('heading', { level: 3 })}
                                icon={Heading3}
                                label="标题 3"
                            />
                        </div>

                        <Separator orientation="vertical" className="mx-2 h-6" />

                        {/* Lists */}
                        <div className="flex items-center gap-0.5">
                            <ToolbarButton
                                onClick={() => editor.chain().focus().toggleBulletList().run()}
                                isActive={editor.isActive('bulletList')}
                                icon={List}
                                label="无序列表"
                            />
                            <ToolbarButton
                                onClick={() => editor.chain().focus().toggleOrderedList().run()}
                                isActive={editor.isActive('orderedList')}
                                icon={ListOrdered}
                                label="有序列表"
                            />
                            <ToolbarButton
                                onClick={() => editor.chain().focus().toggleBlockquote().run()}
                                isActive={editor.isActive('blockquote')}
                                icon={Quote}
                                label="引用"
                            />
                        </div>

                        <Separator orientation="vertical" className="mx-2 h-6" />

                        {/* History */}
                        <div className="flex items-center gap-0.5">
                            <ToolbarButton
                                onClick={() => editor.chain().focus().undo().run()}
                                icon={Undo}
                                label="撤销 (Ctrl+Z)"
                            />
                            <ToolbarButton
                                onClick={() => editor.chain().focus().redo().run()}
                                icon={Redo}
                                label="重做 (Ctrl+Y)"
                            />
                        </div>
                    </div>

                    {/* Action Buttons */}
                    {!readOnly && (
                        <div className="flex items-center gap-2">
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={onCancel}
                                disabled={saving}
                                className="h-9"
                            >
                                <X className="h-4 w-4 mr-2" />
                                取消
                            </Button>
                            <Button
                                type="button"
                                size="sm"
                                onClick={handleSave}
                                disabled={saving}
                                className="h-9 bg-primary hover:bg-primary/90"
                            >
                                {saving ? (
                                    <>
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                        保存中...
                                    </>
                                ) : (
                                    <>
                                        <Save className="h-4 w-4 mr-2" />
                                        保存
                                    </>
                                )}
                            </Button>
                        </div>
                    )}
                </div>
            </div>

            {/* Editor Content Area */}
            <div className="bg-background flex-1 overflow-auto">
                <EditorContent
                    editor={editor}
                    className="h-full"
                />
            </div>

            {/* Footer with tips */}
            {!readOnly && (
                <div className="border-t border-border bg-muted/20 px-6 py-2 text-xs text-muted-foreground flex-shrink-0">
                    提示：使用 Markdown 语法快速格式化 • Ctrl+B 加粗 • Ctrl+I 斜体
                </div>
            )}
        </div>
    )
}
