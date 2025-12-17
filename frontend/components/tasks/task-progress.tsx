"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"

interface TaskProgressProps {
  progress?: number
  message?: string
}

export function TaskProgress({ progress = 0, message = "" }: TaskProgressProps) {
  return (
    <Card>
      <CardContent className="pt-4 space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">{message || "执行中..."}</span>
          <span className="font-mono">{progress}%</span>
        </div>
        <Progress value={progress} className="h-2" />
      </CardContent>
    </Card>
  )
}
