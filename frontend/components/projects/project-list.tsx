"use client"

import { use, useEffect, useState } from "react"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { FileCheck, Eye, MoreHorizontal, Loader2 } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import { CreateProjectDialog } from "./create-project-dialog"
import { projectApi } from "@/lib/api"

const statusConfig = {
  "pending": { label: "待处理", color: "bg-gray-500 text-white" },
  "in_progress": { label: "进行中", color: "bg-blue-500 text-white" },
  "review": { label: "待审核", color: "bg-yellow-500 text-white" },
  "completed": { label: "已完成", color: "bg-green-500 text-white" },
  "cancelled": { label: "已取消", color: "bg-red-500 text-white" },
}

export function ProjectList() {
  const [projects, setProjects] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchProjects() {
      try {
        const response = await projectApi.getList({ page: 1, pageSize: 50 })
        console.log("📦 Projects response:", response)

        if (response.code === 200 && response.data) {
          setProjects(response.data.list || [])
        } else {
          setError("加载项目失败")
        }
      } catch (err) {
        console.error("Failed to fetch projects:", err)
        setError("加载项目时出错")
      } finally {
        setLoading(false)
      }
    }

    fetchProjects()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">加载项目中...</span>
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
        <h1 className="text-2xl font-bold">项目管理</h1>
        <CreateProjectDialog />
      </div>

      <div className="text-sm text-muted-foreground">
        共 {projects.length} 个项目
      </div>

      <div className="grid gap-4">
        {projects.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              暂无项目数据
            </CardContent>
          </Card>
        ) : (
          projects.map((project) => (
            <Card key={project.id} className="hover:border-primary/50 transition-colors">
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">{project.name}</h3>
                      <Badge className={cn("text-xs", statusConfig[project.status as keyof typeof statusConfig]?.color || "bg-gray-500")}>
                        {statusConfig[project.status as keyof typeof statusConfig]?.label || project.status}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                      <span>{project.code}</span>
                      <span>{project.client}</span>
                      {project.deadline && <span>截止: {new Date(project.deadline).toLocaleDateString('zh-CN')}</span>}
                    </div>
                    <div className="mt-3 flex items-center gap-3">
                      <span className="text-sm text-muted-foreground">进度:</span>
                      <Progress value={project.progress || 0} className="flex-1 h-2" />
                      <span className="text-sm font-medium w-12">{project.progress || 0}%</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Link href={`/projects/${project.id}/compliance`}>
                      <Button size="sm" variant="outline">
                        <FileCheck className="h-4 w-4 mr-1" />
                        合规矩阵
                      </Button>
                    </Link>
                    <Button size="sm" variant="outline">
                      <Eye className="h-4 w-4 mr-1" />
                      详情
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button size="sm" variant="ghost">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>编辑项目</DropdownMenuItem>
                        <DropdownMenuItem>查看报告</DropdownMenuItem>
                        <DropdownMenuItem>导出数据</DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive">删除项目</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
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
