"use client"

import { useParams, useRouter } from "next/navigation"
import { useEffect } from "react"
import { mutate } from "swr"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/hooks/use-toast"
import { useArticleDetail, useArticles, useToggleStar } from "@/lib/api/hooks"
import { knowledgeApi } from "@/lib/api"
import { MainLayout } from "@/components/layout/main-layout"
import { AIRecommendations } from "@/components/knowledge/ai-recommendations"
import {
  ArrowLeft,
  Star,
  StarOff,
  Eye,
  Clock,
  User,
  Edit,
  Trash2,
  FileText,
  Video,
  Download,
  Share2,
  Loader2,
} from "lucide-react"
import ReactMarkdown from "react-markdown"

export default function ArticleDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const articleId = params.id as string

  const { data: articleRes, isLoading, error } = useArticleDetail(articleId)
  const { data: allArticlesRes } = useArticles({ page: 1, pageSize: 100 })
  const { trigger: toggleStar, isMutating: isTogglingStart } = useToggleStar()

  const article = articleRes?.data
  const allArticles = allArticlesRes?.data?.list || []

  // 添加阅读记录
  useEffect(() => {
    if (article) {
      knowledgeApi.addReadingHistory(article.id, article.title)
      mutate("reading-history")
    }
  }, [article])

  const handleToggleStar = async () => {
    if (!article) return
    try {
      await toggleStar(article.id)
      mutate(["article", articleId])
      mutate((key) => Array.isArray(key) && key[0] === "articles")
      mutate("starred-articles")
      toast({
        title: article.starred ? "已取消收藏" : "已收藏",
      })
    } catch (error) {
      toast({
        title: "操作失败",
        variant: "destructive",
      })
    }
  }

  const handleDelete = async () => {
    if (!article) return
    if (!confirm("确定要删除这篇文章吗？")) return

    try {
      await knowledgeApi.deleteArticle(article.id)
      mutate((key) => Array.isArray(key) && key[0] === "articles")
      toast({
        title: "删除成功",
      })
      router.push("/knowledge")
    } catch (error) {
      toast({
        title: "删除失败",
        variant: "destructive",
      })
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "article":
        return <FileText className="h-4 w-4" />
      case "video":
        return <Video className="h-4 w-4" />
      case "document":
        return <Download className="h-4 w-4" />
      default:
        return <FileText className="h-4 w-4" />
    }
  }

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "article":
        return "文章"
      case "video":
        return "视频"
      case "document":
        return "文档"
      default:
        return "文章"
    }
  }

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    )
  }

  if (error || !article) {
    return (
      <MainLayout>
        <div className="flex flex-col items-center justify-center h-[60vh] text-muted-foreground">
          <FileText className="h-16 w-16 mb-4 opacity-50" />
          <p className="text-lg mb-4">文章不存在或已被删除</p>
          <Button variant="outline" onClick={() => router.push("/knowledge")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            返回知识库
          </Button>
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout>
      <div className="p-6">
        <div className="grid grid-cols-12 gap-6">
          {/* Main Article Content */}
          <div className="col-span-12 lg:col-span-8">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <Button variant="ghost" onClick={() => router.push("/knowledge")}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                返回知识库
              </Button>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="icon" onClick={handleToggleStar} disabled={isTogglingStart}>
                  {article.starred ? (
                    <Star className="h-4 w-4 fill-warning text-warning" />
                  ) : (
                    <StarOff className="h-4 w-4" />
                  )}
                </Button>
                <Button variant="outline" size="icon">
                  <Share2 className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon">
                  <Edit className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon" onClick={handleDelete}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </div>

            {/* Article Content */}
            <Card className="bg-card border-border">
              <CardContent className="p-8">
                {/* Title & Meta */}
                <div className="mb-6">
                  <div className="flex items-center gap-2 mb-3">
                    <Badge variant="outline" className="gap-1">
                      {getTypeIcon(article.type)}
                      {getTypeLabel(article.type)}
                    </Badge>
                    <Badge variant="secondary">{article.categoryName}</Badge>
                  </div>
                  <h1 className="text-2xl font-bold text-foreground mb-4">{article.title}</h1>
                  <div className="flex items-center gap-6 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <User className="h-4 w-4" />
                      {article.author}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {article.updatedAt}
                    </span>
                    <span className="flex items-center gap-1">
                      <Eye className="h-4 w-4" />
                      {article.views} 阅读
                    </span>
                  </div>
                </div>

                {/* Tags */}
                {article.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-6">
                    {article.tags.map((tag) => (
                      <Badge key={tag} variant="secondary">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}

                {/* Summary */}
                <div className="bg-muted/50 rounded-lg p-4 mb-6">
                  <p className="text-muted-foreground">{article.summary}</p>
                </div>

                <Separator className="my-6" />

                {/* Content */}
                <div className="prose prose-invert max-w-none">
                  <ReactMarkdown
                    components={{
                      h1: ({ children }) => (
                        <h1 className="text-2xl font-bold mt-8 mb-4 text-foreground">{children}</h1>
                      ),
                      h2: ({ children }) => (
                        <h2 className="text-xl font-semibold mt-6 mb-3 text-foreground">{children}</h2>
                      ),
                      h3: ({ children }) => (
                        <h3 className="text-lg font-medium mt-4 mb-2 text-foreground">{children}</h3>
                      ),
                      p: ({ children }) => <p className="mb-4 text-muted-foreground leading-relaxed">{children}</p>,
                      ul: ({ children }) => (
                        <ul className="list-disc list-inside mb-4 text-muted-foreground space-y-1">{children}</ul>
                      ),
                      ol: ({ children }) => (
                        <ol className="list-decimal list-inside mb-4 text-muted-foreground space-y-1">{children}</ol>
                      ),
                      li: ({ children }) => <li className="text-muted-foreground">{children}</li>,
                      code: ({ children }) => (
                        <code className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono text-primary">
                          {children}
                        </code>
                      ),
                      pre: ({ children }) => (
                        <pre className="bg-muted p-4 rounded-lg overflow-x-auto mb-4">{children}</pre>
                      ),
                      blockquote: ({ children }) => (
                        <blockquote className="border-l-4 border-primary pl-4 my-4 text-muted-foreground italic">
                          {children}
                        </blockquote>
                      ),
                    }}
                  >
                    {article.content}
                  </ReactMarkdown>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="col-span-12 lg:col-span-4 space-y-4">
            {article && allArticles.length > 1 && (
              <AIRecommendations currentArticle={article} allArticles={allArticles} />
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  )
}
