"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Play, Pause, Eye, Loader2, RefreshCw } from "lucide-react"
import { cn } from "@/lib/utils"
import { CreateTaskDialog } from "./create-task-dialog"
import { taskApi } from "@/lib/api"

const statusConfig = {
  "pending": { label: "待处理", color: "bg-gray-500 text-white" },
  "running": { label: "运行中", color: "bg-blue-500 text-white" },
  "paused": { label: "已暂停", color: "bg-yellow-500 text-white" },
  "completed": { label: "已完成", color: "bg-green-500 text-white" },
  "cancelled": { label: "已取消", color: "bg-red-500 text-white" },
  "failed": { label: "失败", color: "bg-red-600 text-white" },
}

export function TaskList() {
  const [tasks, setTasks] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchTasks = async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true)

      const response = await taskApi.getList({ page: 1, pageSize: 50 })
      console.log("📋 Tasks response:", response)

      if (response.code === 200 && response.data) {
        setTasks(response.data.list || [])
        setError(null)
      } else {
        setError("加载任务失败")
      }
    } catch (err) {
      console.error("Failed to fetch tasks:", err)
      setError("加载任务时出错")
    } finally {
      setLoading(false)
      if (isRefresh) setRefreshing(false)
    }
  }

  // Initial load
  useEffect(() => {
    fetchTasks()
  }, [])

  // Auto-refresh every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchTasks(false)
    }, 5000)

    return () => clearInterval(interval)
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">加载任务中...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12 text-destructive">
        <p>{error}</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">检测任务</h1>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchTasks(true)}
            disabled={refreshing}
          >
            {refreshing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                刷新中
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4 mr-2" />
                刷新
              </>
            )}
          </Button>
          <CreateTaskDialog />
        </div>
      </div>

      <div className="text-sm text-muted-foreground">
        共 {tasks.length} 个任务
      </div>

      <div className="grid gap-4">
        {tasks.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              暂无任务数据
            </CardContent>
          </Card>
        ) : (
          tasks.map((task) => (
            <Card key={task.id} className="hover:border-primary/50 transition-colors">
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">{task.name}</h3>
                      <Badge className={cn("text-xs", statusConfig[task.status as keyof typeof statusConfig]?.color || "bg-gray-500")}>
                        {statusConfig[task.status as keyof typeof statusConfig]?.label || task.status}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                      <span>{task.code}</span>
                      <span>类型: {task.type}</span>
                      {task.startTime && <span>开始: {new Date(task.startTime).toLocaleString('zh-CN')}</span>}
                    </div>
                    <div className="mt-3 flex items-center gap-3">
                      <Progress value={task.progress || 0} className="flex-1 h-2" />
                      <span className="text-sm text-muted-foreground w-12">{task.progress || 0}%</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {task.status === "running" && (
                      <Button size="sm" variant="outline" onClick={() => taskApi.pause(task.id)}>
                        <Pause className="h-4 w-4" />
                      </Button>
                    )}
                    {(task.status === "paused" || task.status === "pending") && (
                      <Button size="sm" variant="outline" onClick={() => taskApi.resume(task.id)}>
                        <Play className="h-4 w-4" />
                      </Button>
                    )}
                    <Link href={`/tasks/${task.id}`}>
                      <Button size="sm">
                        <Eye className="h-4 w-4 mr-1" />
                        控制台
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
