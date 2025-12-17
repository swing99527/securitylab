"use client"

import type React from "react"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Search, Sparkles, Loader2, X } from "lucide-react"
import { useDebounce } from "@/hooks/use-debounce"

interface AISearchProps {
  onSearch: (query: string, useAI: boolean) => void
  isSearching?: boolean
}

export function AISearch({ onSearch, isSearching }: AISearchProps) {
  const [query, setQuery] = useState("")
  const [useAI, setUseAI] = useState(true)

  const debouncedSearch = useDebounce((q: string) => {
    if (q.trim()) {
      onSearch(q, useAI)
    }
  }, 300)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setQuery(value)
    debouncedSearch(value)
  }

  const handleClear = () => {
    setQuery("")
    onSearch("", false)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (query.trim()) {
      onSearch(query, useAI)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="relative flex items-center gap-2">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={query}
          onChange={handleChange}
          placeholder={useAI ? "AI 智能搜索..." : "关键词搜索..."}
          className="pl-10 pr-20 bg-card border-border"
        />
        {query && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute right-10 top-1/2 -translate-y-1/2 h-6 w-6"
            onClick={handleClear}
          >
            <X className="h-3 w-3" />
          </Button>
        )}
        {isSearching && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-primary" />
        )}
      </div>
      <Button
        type="button"
        variant={useAI ? "default" : "outline"}
        size="sm"
        className="gap-1.5"
        onClick={() => setUseAI(!useAI)}
      >
        <Sparkles className="h-3.5 w-3.5" />
        AI
        {useAI && (
          <Badge variant="secondary" className="text-[10px] px-1 py-0">
            ON
          </Badge>
        )}
      </Button>
    </form>
  )
}
