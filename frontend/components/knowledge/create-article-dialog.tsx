"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { mutate } from "swr"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { useKnowledgeCategories, useCreateArticle } from "@/lib/api/hooks"
import { X, Loader2 } from "lucide-react"
import type { ArticleType } from "@/lib/api/types"

interface CreateArticleDialogProps {
  children: React.ReactNode
}

export function CreateArticleDialog({ children }: CreateArticleDialogProps) {
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState("")
  const [summary, setSummary] = useState("")
  const [content, setContent] = useState("")
  const [category, setCategory] = useState("")
  const [type, setType] = useState<ArticleType>("article")
  const [tags, setTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState("")

  const router = useRouter()
  const { toast } = useToast()
  const { data: categoriesRes } = useKnowledgeCategories()
  const { trigger: createArticle, isMutating } = useCreateArticle()

  const categories = categoriesRes?.data || []
  const allCategories = categories.flatMap((c) => [
    { id: c.id, name: c.name, isParent: true },
    ...(c.children || []).map((sub) => ({ id: sub.id, name: sub.name, isParent: false })),
  ])

  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()])
      setTagInput("")
    }
  }

  const handleRemoveTag = (tag: string) => {
    setTags(tags.filter((t) => t !== tag))
  }

  const handleSubmit = async () => {
    if (!title.trim() || !category || !summary.trim()) {
      toast({
        title: "请填写必填项",
        description: "标题、分类和摘要为必填项",
        variant: "destructive",
      })
      return
    }

    try {
      const result = await createArticle({
        title: title.trim(),
        summary: summary.trim(),
        content: content.trim(),
        category,
        type,
        tags,
      })

      if (result?.code === 200) {
        toast({
          title: "创建成功",
          description: "文章已成功创建",
        })
        mutate((key) => Array.isArray(key) && key[0] === "articles")
        setOpen(false)
        resetForm()
        // 跳转到文章详情页
        router.push(`/knowledge/${result.data.id}`)
      }
    } catch (error) {
      toast({
        title: "创建失败",
        description: "请稍后重试",
        variant: "destructive",
      })
    }
  }

  const resetForm = () => {
    setTitle("")
    setSummary("")
    setContent("")
    setCategory("")
    setType("article")
    setTags([])
    setTagInput("")
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[700px] bg-card border-border max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>新建文章</DialogTitle>
          <DialogDescription>创建新的知识库文章</DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="title">标题 *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="输入文章标题"
              className="bg-background border-border"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="category">分类 *</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="bg-background border-border">
                  <SelectValue placeholder="选择分类" />
                </SelectTrigger>
                <SelectContent>
                  {allCategories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id} className={cat.isParent ? "font-medium" : "pl-6"}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="type">类型</Label>
              <Select value={type} onValueChange={(v) => setType(v as ArticleType)}>
                <SelectTrigger className="bg-background border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="article">文章</SelectItem>
                  <SelectItem value="video">视频</SelectItem>
                  <SelectItem value="document">文档</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="summary">摘要 *</Label>
            <Textarea
              id="summary"
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder="输入文章摘要（显示在列表中）"
              className="bg-background border-border h-20"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="content">正文内容</Label>
            <Textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="输入文章正文（支持 Markdown 格式）"
              className="bg-background border-border h-40 font-mono text-sm"
            />
          </div>

          <div className="grid gap-2">
            <Label>标签</Label>
            <div className="flex gap-2">
              <Input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                placeholder="输入标签后按回车"
                className="bg-background border-border flex-1"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault()
                    handleAddTag()
                  }
                }}
              />
              <Button type="button" variant="outline" onClick={handleAddTag}>
                添加
              </Button>
            </div>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="gap-1">
                    {tag}
                    <X className="h-3 w-3 cursor-pointer hover:text-destructive" onClick={() => handleRemoveTag(tag)} />
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            取消
          </Button>
          <Button onClick={handleSubmit} disabled={isMutating}>
            {isMutating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            创建文章
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
