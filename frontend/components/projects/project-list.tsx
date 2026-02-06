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
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          共 {projects.length} 个项目
        </div>
        <CreateProjectDialog />
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
                    <Link href={`/projects/${project.id}`}>
                      <Button size="sm" variant="outline">
                        <Eye className="h-4 w-4 mr-1" />
                        详情
                      </Button>
                    </Link>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button size="sm" variant="ghost">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => window.location.href = `/projects/${project.id}/edit`}>
                          编辑项目
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => window.location.href = `/projects/${project.id}/reports`}>
                          查看报告
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => alert('导出功能开发中')}>
                          导出数据
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={async () => {
                            try {
                              // Step 1: Get project details to check for related data
                              const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000'
                              const token = localStorage.getItem('token')

                              const detailResponse = await fetch(`${apiBaseUrl}/api/v1/projects/${project.id}`, {
                                headers: { 'Authorization': `Bearer ${token}` }
                              })

                              if (!detailResponse.ok) {
                                throw new Error('获取项目详情失败')
                              }

                              const projectDetail = await detailResponse.json()

                              // Step 2: Build warning message
                              let warningMessage = `确定要删除项目 "${project.name}" 吗？\n\n`

                              const hasRelatedData = (
                                (projectDetail.task_count || 0) > 0 ||
                                (projectDetail.sample_count || 0) > 0
                              )

                              if (hasRelatedData) {
                                warningMessage += '⚠️ 此操作将影响以下数据：\n'
                                if (projectDetail.task_count > 0) {
                                  warningMessage += `- ${projectDetail.task_count} 个任务将被级联删除\n`
                                }
                                if (projectDetail.sample_count > 0) {
                                  warningMessage += `- ${projectDetail.sample_count} 个样品将被解除关联\n`
                                }
                                warningMessage += '\n此操作不可恢复！'
                              } else {
                                warningMessage += '此项目没有关联数据。\n\n确认删除？'
                              }

                              // Step 3: Show confirmation
                              if (!confirm(warningMessage)) {
                                return
                              }

                              // Step 4: Proceed with deletion
                              const response = await fetch(`${apiBaseUrl}/api/v1/projects/${project.id}`, {
                                method: 'DELETE',
                                headers: {
                                  'Authorization': `Bearer ${token}`,
                                  'Content-Type': 'application/json'
                                }
                              })

                              if (!response.ok) {
                                throw new Error(`删除失败: ${response.status}`)
                              }

                              alert('项目已删除')
                              window.location.reload()
                            } catch (error) {
                              alert('删除失败: ' + (error as Error).message)
                            }
                          }}
                        >
                          删除项目
                        </DropdownMenuItem>
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
