"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Sparkles, Wand2, FileText, CheckCircle, Expand, Shrink, Loader2, Copy, Check } from "lucide-react"

interface AIWritingAssistantProps {
  initialContent?: string
  onInsert?: (content: string) => void
}

export function AIWritingAssistant({ initialContent = "", onInsert }: AIWritingAssistantProps) {
  const [content, setContent] = useState(initialContent)
  const [completion, setCompletion] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [copied, setCopied] = useState(false)

  const handleAction = async (action: string) => {
    if (!content.trim() && action !== "generate") return

    setIsLoading(true)
    setCompletion("")

    try {
      const response = await fetch("/api/knowledge/assist-write", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, content }),
      })

      const data = await response.json()
      setCompletion(data.content || "生成失败，请重试。")
    } catch (error) {
      console.error("AI assist error:", error)
      setCompletion("抱歉，AI 服务暂时不可用。请稍后重试。")
    } finally {
      setIsLoading(false)
    }
  }

  const handleCopy = async () => {
    const textToCopy = completion || content
    await navigator.clipboard.writeText(textToCopy)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleInsert = () => {
    if (onInsert && completion) {
      onInsert(completion)
    }
  }

  const actions = [
    { id: "expand", label: "扩展内容", icon: Expand, description: "添加更多细节和示例" },
    { id: "simplify", label: "简化内容", icon: Shrink, description: "使内容更易理解" },
    { id: "format", label: "格式化", icon: FileText, description: "转换为结构化 Markdown" },
    { id: "proofread", label: "校对检查", icon: CheckCircle, description: "检查语法和准确性" },
    { id: "generate", label: "生成文章", icon: Wand2, description: "基于主题生成完整文章" },
  ]

  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          AI 写作助手
          <Badge variant="secondary" className="text-xs">
            Beta
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Input Area */}
        <div>
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="输入内容或主题，让 AI 帮您完善..."
            className="min-h-[120px] bg-background resize-none"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-2">
          {actions.map((action) => (
            <Button
              key={action.id}
              variant="outline"
              size="sm"
              className="gap-1.5 bg-transparent"
              onClick={() => handleAction(action.id)}
              disabled={isLoading || (!content.trim() && action.id !== "generate")}
            >
              {isLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <action.icon className="h-3.5 w-3.5" />}
              {action.label}
            </Button>
          ))}
        </div>

        {/* Output Area */}
        {(completion || isLoading) && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">AI 输出:</span>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleCopy} disabled={!completion}>
                  {copied ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
                </Button>
                {onInsert && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={handleInsert}
                    disabled={!completion}
                  >
                    插入编辑器
                  </Button>
                )}
              </div>
            </div>
            <div className="bg-muted/50 rounded-lg p-4 min-h-[100px]">
              {isLoading ? (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm">AI 正在思考...</span>
                </div>
              ) : (
                <pre className="whitespace-pre-wrap text-sm text-foreground font-mono">{completion}</pre>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
