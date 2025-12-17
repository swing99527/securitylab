"use client"

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { Button } from '@/components/ui/button'

export function MinimalEditor() {
    const editor = useEditor({
        extensions: [StarterKit],
        content: '<p>Hello World!</p>',
    })

    if (!editor) {
        return <div>Loading...</div>
    }

    return (
        <div className="border p-4">
            <EditorContent editor={editor} />
            <Button onClick={() => console.log(editor.getHTML())}>
                Log HTML
            </Button>
        </div>
    )
}
