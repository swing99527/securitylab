"use client"

import type { ReactNode } from "react"
import { useAppStore } from "@/lib/store"
import { Sidebar } from "./sidebar"
import { TopBar } from "./top-bar"
import { cn } from "@/lib/utils"

interface MainLayoutProps {
  children: ReactNode
  breadcrumbs?: { label: string; href?: string }[]
}

export function MainLayout({ children, breadcrumbs }: MainLayoutProps) {
  const { sidebarCollapsed } = useAppStore()

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <div className={cn("transition-all duration-300", sidebarCollapsed ? "ml-16" : "ml-60 lg:ml-70 xl:ml-80")}>
        <TopBar breadcrumbs={breadcrumbs} />
        <main className="pt-4 px-6 pb-6">{children}</main>
      </div>
    </div>
  )
}
