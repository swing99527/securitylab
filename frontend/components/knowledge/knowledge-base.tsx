"use client"

import type React from "react"
import { useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { mutate } from "swr"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/hooks/use-toast"
import { useArticles, useKnowledgeCategories, useReadingHistory, useToggleStar } from "@/lib/api/hooks"
import { CreateArticleDialog } from "./create-article-dialog"
import { AIChatPanel } from "./ai-chat-panel"
import { AISearch } from "./ai-search"
import { AIWritingAssistant } from "./ai-writing-assistant"
import {
  BookOpen,
  FileText,
  Video,
  Download,
  Star,
  StarOff,
  Clock,
  Eye,
  ChevronRight,
  FolderOpen,
  Shield,
  Radio,
  Wifi,
  Lock,
  ExternalLink,
  Plus,
  Loader2,
  Sparkles,
  MessageSquare,
  PenTool,
} from "lucide-react"
import type { Article, ArticleListParams } from "@/lib/api/types"

const iconMap: Record<string, React.ReactNode> = {
  Shield: <Shield className="h-4 w-4" />,
  Radio: <Radio className="h-4 w-4" />,
  Wifi: <Wifi className="h-4 w-4" />,
  Lock: <Lock className="h-4 w-4" />,
  FileText: <FileText className="h-4 w-4" />,
}

const quickLinks = [
  { title: "EN 18031 合规检查清单", url: "#" },
  { title: "常用测试工具下载", url: "#" },
  { title: "报告模板库", url: "#" },
  { title: "漏洞数据库 (CVE)", url: "#" },
]

export function KnowledgeBase() {
  const router = useRouter()
  const { toast } = useToast()
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("all")
  const [showAIChat, setShowAIChat] = useState(false)
  const [showAIWriter, setShowAIWriter] = useState(false)
  const [isAISearching, setIsAISearching] = useState(false)
  const [aiRankedArticles, setAiRankedArticles] = useState<string[] | null>(null)

  // API Hooks
  const { data: categoriesRes, isLoading: categoriesLoading } = useKnowledgeCategories()
  const { data: readingHistoryRes } = useReadingHistory()
  const { trigger: toggleStar } = useToggleStar()

  // 构建查询参数
  const queryParams: ArticleListParams = {
    page: 1,
    pageSize: 50,
    ...(selectedCategory && { category: selectedCategory }),
    ...(searchQuery && { keyword: searchQuery }),
    ...(activeTab === "starred" && { starred: true }),
  }

  const { data: articlesRes, isLoading: articlesLoading } = useArticles(queryParams)

  const categories = categoriesRes?.data || []
  const articles = articlesRes?.data?.list || []
  const readingHistory = readingHistoryRes?.data || []

  const handleAISearch = useCallback(
    async (query: string, useAI: boolean) => {
      setSearchQuery(query)

      if (!query.trim()) {
        setAiRankedArticles(null)
        return
      }

      if (useAI && articles.length > 0) {
        setIsAISearching(true)
        try {
          const response = await fetch("/api/knowledge/search", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ query, articles }),
          })
          const data = await response.json()
          if (data.success) {
            setAiRankedArticles(data.rankedIds)
          }
        } catch (error) {
          console.error("AI search failed:", error)
        } finally {
          setIsAISearching(false)
        }
      } else {
        setAiRankedArticles(null)
      }
    },
    [articles],
  )

  const displayArticles = aiRankedArticles
    ? (aiRankedArticles.map((id) => articles.find((a) => a.id === id)).filter(Boolean) as Article[])
    : articles

  const handleToggleStar = async (e: React.MouseEvent, articleId: string) => {
    e.stopPropagation()
    try {
      await toggleStar(articleId)
      mutate((key) => Array.isArray(key) && key[0] === "articles")
      mutate("starred-articles")
    } catch (error) {
      toast({
        title: "操作失败",
        variant: "destructive",
      })
    }
  }

  const handleArticleClick = (articleId: string) => {
    router.push(`/knowledge/${articleId}`)
  }

  const getTypeIcon = (type: Article["type"]) => {
    switch (type) {
      case "article":
        return <FileText className="h-4 w-4 text-primary" />
      case "video":
        return <Video className="h-4 w-4 text-warning" />
      case "document":
        return <Download className="h-4 w-4 text-success" />
    }
  }

  const renderArticleCard = (article: Article) => (
    <Card
      key={article.id}
      className="bg-card border-border hover:border-primary/50 transition-colors cursor-pointer"
      onClick={() => handleArticleClick(article.id)}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3 flex-1">
            <div className="mt-1">{getTypeIcon(article.type)}</div>
            <div className="flex-1 min-w-0">
              <h3 className="font-medium text-foreground hover:text-primary transition-colors">{article.title}</h3>
              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{article.summary}</p>
              <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Eye className="h-3 w-3" />
                  {article.views}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {article.updatedAt}
                </span>
              </div>
              <div className="flex items-center gap-2 mt-2">
                {article.tags.slice(0, 3).map((tag) => (
                  <Badge key={tag} variant="secondary" className="text-xs">
                    {tag}
                  </Badge>
                ))}
                {article.tags.length > 3 && (
                  <Badge variant="outline" className="text-xs">
                    +{article.tags.length - 3}
                  </Badge>
                )}
              </div>
            </div>
          </div>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => handleToggleStar(e, article.id)}>
            {article.starred ? (
              <Star className="h-4 w-4 fill-warning text-warning" />
            ) : (
              <StarOff className="h-4 w-4 text-muted-foreground" />
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  )

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">知识库</h1>
          <p className="text-muted-foreground mt-1">标准规范、测试方法、技术文档</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={showAIChat ? "default" : "outline"}
            size="sm"
            className="gap-1.5"
            onClick={() => {
              setShowAIChat(!showAIChat)
              setShowAIWriter(false)
            }}
          >
            <MessageSquare className="h-4 w-4" />
            AI 问答
          </Button>
          <Button
            variant={showAIWriter ? "default" : "outline"}
            size="sm"
            className="gap-1.5"
            onClick={() => {
              setShowAIWriter(!showAIWriter)
              setShowAIChat(false)
            }}
          >
            <PenTool className="h-4 w-4" />
            AI 写作
          </Button>
          <CreateArticleDialog>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              新建文章
            </Button>
          </CreateArticleDialog>
        </div>
      </div>

      {showAIChat && (
        <div className="grid grid-cols-12 gap-6">
          <div className="col-span-12 lg:col-span-8 xl:col-span-6">
            <AIChatPanel onClose={() => setShowAIChat(false)} />
          </div>
        </div>
      )}

      {showAIWriter && (
        <div className="grid grid-cols-12 gap-6">
          <div className="col-span-12 lg:col-span-8 xl:col-span-6">
            <AIWritingAssistant />
          </div>
        </div>
      )}

      <div className="grid grid-cols-12 gap-6">
        {/* Categories Sidebar */}
        <div className="col-span-3">
          <Card className="bg-card border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <FolderOpen className="h-4 w-4" />
                分类目录
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[500px]">
                <div className="px-4 pb-4 space-y-1">
                  <Button
                    variant={selectedCategory === null ? "secondary" : "ghost"}
                    className="w-full justify-start"
                    onClick={() => setSelectedCategory(null)}
                  >
                    <BookOpen className="h-4 w-4 mr-2" />
                    全部文章
                    <Badge variant="secondary" className="ml-auto">
                      {articlesRes?.data?.total || 0}
                    </Badge>
                  </Button>

                  {categoriesLoading ? (
                    <div className="space-y-2 p-2">
                      {[1, 2, 3].map((i) => (
                        <Skeleton key={i} className="h-8 w-full" />
                      ))}
                    </div>
                  ) : (
                    categories.map((category) => (
                      <div key={category.id} className="space-y-1">
                        <Button
                          variant="ghost"
                          className="w-full justify-start font-medium"
                          onClick={() => setSelectedCategory(category.id)}
                        >
                          {iconMap[category.icon] || <FileText className="h-4 w-4" />}
                          <span className="ml-2">{category.name}</span>
                          <Badge variant="outline" className="ml-auto">
                            {category.count}
                          </Badge>
                        </Button>
                        {category.children && (
                          <div className="ml-6 space-y-1">
                            {category.children.map((sub) => (
                              <Button
                                key={sub.id}
                                variant={selectedCategory === sub.id ? "secondary" : "ghost"}
                                size="sm"
                                className="w-full justify-start text-muted-foreground hover:text-foreground"
                                onClick={() => setSelectedCategory(sub.id)}
                              >
                                <ChevronRight className="h-3 w-3 mr-1" />
                                {sub.name}
                                <span className="ml-auto text-xs">{sub.count}</span>
                              </Button>
                            ))}
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Quick Links */}
          <Card className="bg-card border-border mt-4">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">快速链接</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {quickLinks.map((link, index) => (
                <a
                  key={index}
                  href={link.url}
                  className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  <ExternalLink className="h-3 w-3" />
                  {link.title}
                </a>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="col-span-9">
          <div className="mb-4">
            <AISearch onSearch={handleAISearch} isSearching={isAISearching} />
            {aiRankedArticles && (
              <div className="flex items-center gap-2 mt-2">
                <Badge variant="secondary" className="gap-1">
                  <Sparkles className="h-3 w-3" />
                  AI 智能排序
                </Badge>
                <span className="text-xs text-muted-foreground">
                  已根据语义相关性重新排序 {aiRankedArticles.length} 篇文章
                </span>
              </div>
            )}
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
            <TabsList className="bg-card border border-border">
              <TabsTrigger value="all">全部</TabsTrigger>
              <TabsTrigger value="starred">已收藏</TabsTrigger>
              <TabsTrigger value="recent">最近阅读</TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="space-y-4">
              {articlesLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <Card key={i} className="bg-card border-border">
                      <CardContent className="p-4">
                        <div className="flex gap-3">
                          <Skeleton className="h-5 w-5 rounded" />
                          <div className="flex-1 space-y-2">
                            <Skeleton className="h-5 w-3/4" />
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-3 w-1/4" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : displayArticles.length > 0 ? (
                displayArticles.map(renderArticleCard)
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>没有找到匹配的文章</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="starred" className="space-y-4">
              {articlesLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : displayArticles.length > 0 ? (
                displayArticles.map(renderArticleCard)
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <Star className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>暂无收藏的文章</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="recent" className="space-y-4">
              {readingHistory.length > 0 ? (
                readingHistory.map((item) => (
                  <Card
                    key={item.articleId}
                    className="bg-card border-border hover:border-primary/50 transition-colors cursor-pointer"
                    onClick={() => handleArticleClick(item.articleId)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <h3 className="font-medium text-foreground">{item.articleTitle}</h3>
                            <p className="text-xs text-muted-foreground mt-1">阅读于 {item.readAt}</p>
                          </div>
                        </div>
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>暂无最近阅读记录</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}
