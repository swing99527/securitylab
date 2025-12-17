"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Sparkles, FileText, ChevronRight } from "lucide-react"
import type { Article } from "@/lib/api/types"

interface AIRecommendationsProps {
  currentArticle: Article
  allArticles: Article[]
}

export function AIRecommendations({ currentArticle, allArticles }: AIRecommendationsProps) {
  const router = useRouter()
  const [recommendations, setRecommendations] = useState<Article[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchRecommendations = async () => {
      setIsLoading(true)
      try {
        const response = await fetch("/api/knowledge/recommend", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ currentArticle, allArticles }),
        })
        const data = await response.json()

        if (data.success && data.recommendedIds) {
          const recommended = data.recommendedIds
            .map((id: string) => allArticles.find((a) => a.id === id))
            .filter(Boolean)
          setRecommendations(recommended)
        } else {
          // Fallback to tag-based recommendations
          const tagSet = new Set(currentArticle.tags)
          const fallback = allArticles
            .filter((a) => a.id !== currentArticle.id)
            .map((a) => ({
              article: a,
              score: a.tags.filter((t) => tagSet.has(t)).length,
            }))
            .sort((a, b) => b.score - a.score)
            .slice(0, 5)
            .map((item) => item.article)
          setRecommendations(fallback)
        }
      } catch (error) {
        console.error("Failed to fetch recommendations:", error)
        // Fallback to simple recommendations
        setRecommendations(allArticles.filter((a) => a.id !== currentArticle.id).slice(0, 5))
      } finally {
        setIsLoading(false)
      }
    }

    fetchRecommendations()
  }, [currentArticle, allArticles])

  if (isLoading) {
    return (
      <Card className="bg-card border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            AI 推荐阅读
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </CardContent>
      </Card>
    )
  }

  if (recommendations.length === 0) {
    return null
  }

  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          AI 推荐阅读
          <Badge variant="secondary" className="text-xs">
            智能推荐
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {recommendations.map((article) => (
          <div
            key={article.id}
            className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
            onClick={() => router.push(`/knowledge/${article.id}`)}
          >
            <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{article.title}</p>
              <div className="flex items-center gap-2 mt-0.5">
                {article.tags.slice(0, 2).map((tag) => (
                  <Badge key={tag} variant="outline" className="text-[10px] px-1 py-0">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
