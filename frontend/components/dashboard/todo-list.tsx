"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"

const todos = [
  {
    id: "1",
    title: "审核报告 RPT-2024-0156",
    project: "PRJ-2024-001",
    priority: "high",
    type: "review",
  },
  {
    id: "2",
    title: "处理异常设备告警",
    project: "实验室设备",
    priority: "critical",
    type: "alert",
  },
  {
    id: "3",
    title: "确认样品入库 SPL-2024-089",
    project: "PRJ-2024-003",
    priority: "medium",
    type: "sample",
  },
  {
    id: "4",
    title: "复核合规矩阵评估结果",
    project: "PRJ-2024-002",
    priority: "medium",
    type: "compliance",
  },
  {
    id: "5",
    title: "签署最终报告",
    project: "PRJ-2024-001",
    priority: "low",
    type: "sign",
  },
]

const priorityConfig = {
  critical: { label: "紧急", color: "bg-destructive text-destructive-foreground" },
  high: { label: "高", color: "bg-warning text-warning-foreground" },
  medium: { label: "中", color: "bg-primary text-primary-foreground" },
  low: { label: "低", color: "bg-muted text-muted-foreground" },
}

export function TodoList() {
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">待办事项</CardTitle>
          <Badge variant="secondary">{todos.length} 项</Badge>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-80">
          <div className="divide-y divide-border">
            {todos.map((todo) => (
              <div key={todo.id} className="p-4 hover:bg-accent/50 transition-colors">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{todo.title}</p>
                    <p className="text-xs text-muted-foreground mt-1">{todo.project}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      className={cn("text-xs", priorityConfig[todo.priority as keyof typeof priorityConfig].color)}
                    >
                      {priorityConfig[todo.priority as keyof typeof priorityConfig].label}
                    </Badge>
                    <Button size="sm" variant="outline">
                      处理
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}
