"use client"

import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import type { LucideIcon } from "lucide-react"

interface StatCardProps {
  title: string
  value: number | string
  icon: LucideIcon
  trend?: {
    value: number
    isUp: boolean
  }
  variant?: "default" | "warning" | "danger" | "success"
}

export function StatCard({ title, value, icon: Icon, trend, variant = "default" }: StatCardProps) {
  const variantStyles = {
    default: "border-l-primary",
    warning: "border-l-warning",
    danger: "border-l-destructive",
    success: "border-l-success",
  }

  return (
    <Card className={cn("border-l-4", variantStyles[variant])}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-3xl font-bold mt-1">{value}</p>
            {trend && (
              <p className={cn("text-sm mt-1", trend.isUp ? "text-success" : "text-destructive")}>
                {trend.isUp ? "↑" : "↓"} {Math.abs(trend.value)}% 较昨日
              </p>
            )}
          </div>
          <div
            className={cn(
              "w-12 h-12 rounded-xl flex items-center justify-center",
              variant === "default" && "bg-primary/10 text-primary",
              variant === "warning" && "bg-warning/10 text-warning",
              variant === "danger" && "bg-destructive/10 text-destructive",
              variant === "success" && "bg-success/10 text-success",
            )}
          >
            <Icon className="h-6 w-6" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
