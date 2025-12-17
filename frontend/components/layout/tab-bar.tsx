"use client"

import type React from "react"

import { useRouter } from "next/navigation"
import { useAppStore, type Tab } from "@/lib/store"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { X } from "lucide-react"

export function TabBar() {
  const router = useRouter()
  const { tabs, activeTabId, setActiveTab, removeTab } = useAppStore()

  const handleTabClick = (tab: Tab) => {
    setActiveTab(tab.id)
    router.push(tab.path)
  }

  const handleTabClose = (e: React.MouseEvent, tab: Tab) => {
    e.stopPropagation()
    if (tab.closable !== false) {
      removeTab(tab.id)
    }
  }

  return (
    <div className="h-10 bg-secondary/30 border-b border-border flex items-center px-2 gap-1 overflow-x-auto">
      {tabs.map((tab) => (
        <div
          key={tab.id}
          onClick={() => handleTabClick(tab)}
          className={cn(
            "group flex items-center gap-2 px-3 py-1.5 rounded-t-md text-sm cursor-pointer transition-colors",
            activeTabId === tab.id
              ? "bg-card text-foreground border-t border-x border-border"
              : "text-muted-foreground hover:text-foreground hover:bg-accent/50",
          )}
        >
          <span className="truncate max-w-32">{tab.title}</span>
          {tab.closable !== false && (
            <Button
              variant="ghost"
              size="icon"
              className="h-4 w-4 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={(e) => handleTabClose(e, tab)}
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>
      ))}
    </div>
  )
}
