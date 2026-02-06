"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { Loader2, Edit, Trash2, FileText, CheckSquare, Package, PlayCircle, Eye, QrCode } from "lucide-react"
import { projectApi } from "@/lib/api"
import { cn } from "@/lib/utils"
import Link from "next/link"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

const statusConfig = {
    "pending": { label: "待处理", color: "bg-gray-500 text-white" },
    "in_progress": { label: "进行中", color: "bg-blue-500 text-white" },
    "review": { label: "待审核", color: "bg-yellow-500 text-white" },
    "completed": { label: "已完成", color: "bg-green-500 text-white" },
    "cancelled": { label: "已取消", color: "bg-red-500 text-white" },
}

interface ProjectDetailProps {
    projectId: string
}

export function ProjectDetail({ projectId }: ProjectDetailProps) {
    const router = useRouter()
    const [project, setProject] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    // Samples and tasks state
    const [samples, setSamples] = useState<any[]>([])
    const [tasks, setTasks] = useState<any[]>([])
    const [samplesLoading, setSamplesLoading] = useState(false)
    const [tasksLoading, setTasksLoading] = useState(false)

    useEffect(() => {
        async function fetchProjectDetail() {
            try {
                const response = await projectApi.getDetail(projectId)
                console.log("📋 Project detail response:", response)

                if (response.code === 200 && response.data) {
                    setProject(response.data)
                } else {
                    setError("加载项目详情失败")
                }
            } catch (err) {
                console.error("Failed to fetch project detail:", err)
                setError("加载项目详情时出错")
            } finally {
                setLoading(false)
            }
        }

        fetchProjectDetail()
    }, [projectId])

    // Fetch project samples
    const fetchProjectSamples = async () => {
        try {
            setSamplesLoading(true)
            const token = localStorage.getItem('token')
            const response = await fetch(`http://localhost:8000/api/v1/samples?project_id=${projectId}&page=1&page_size=100`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            })
            const data = await response.json()
            setSamples(data.items || [])
        } catch (err) {
            console.error('Failed to fetch samples:', err)
        } finally {
            setSamplesLoading(false)
        }
    }

    // Fetch project tasks
    const fetchProjectTasks = async () => {
        try {
            setTasksLoading(true)
            const token = localStorage.getItem('token')
            const response = await fetch(`http://localhost:8000/api/v1/tasks?project_id=${projectId}&page=1&page_size=100`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            })
            const data = await response.json()
            setTasks(data.items || [])
        } catch (err) {
            console.error('Failed to fetch tasks:', err)
        } finally {
            setTasksLoading(false)
        }
    }

    const handleDelete = async () => {
        try {
            // Step 1: project is already loaded, use its stats
            let warningMessage = `确定要删除项目 "${project?.name}" 吗？\n\n`

            const hasRelatedData = (
                (project.task_count || 0) > 0 ||
                (project.sample_count || 0) > 0
            )

            if (hasRelatedData) {
                warningMessage += '⚠️ 此操作将影响以下数据：\n'
                if (project.task_count > 0) {
                    warningMessage += `- ${project.task_count} 个任务将被级联删除\n`
                }
                if (project.sample_count > 0) {
                    warningMessage += `- ${project.sample_count} 个样品将被解除关联\n`
                }
                warningMessage += '\n此操作不可恢复！'
            } else {
                warningMessage += '此项目没有关联数据。\n\n确认删除？'
            }

            // Step 2: Show confirmation
            if (!confirm(warningMessage)) {
                return
            }

            // Step 3: Proceed with deletion
            const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000'
            const token = localStorage.getItem('token')
            const response = await fetch(`${apiBaseUrl}/api/v1/projects/${projectId}`, {
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
            router.push('/projects')
        } catch (error) {
            alert('删除失败: ' + (error as Error).message)
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="ml-2">加载项目详情中...</span>
            </div>
        )
    }

    if (error || !project) {
        return (
            <div className="text-center py-12 text-destructive">
                <p>{error || "项目不存在"}</p>
                <Button className="mt-4" onClick={() => router.push('/projects')}>
                    返回项目列表
                </Button>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <div className="flex items-center gap-3">
                        <h1 className="text-3xl font-bold">{project.name}</h1>
                        <Badge className={cn("text-sm", statusConfig[project.status as keyof typeof statusConfig]?.color || "bg-gray-500")}>
                            {statusConfig[project.status as keyof typeof statusConfig]?.label || project.status}
                        </Badge>
                    </div>
                    <p className="text-muted-foreground mt-2">项目编号: {project.code}</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={() => router.push(`/projects/${projectId}/edit`)}>
                        <Edit className="h-4 w-4 mr-2" />
                        编辑项目
                    </Button>
                    <Button variant="destructive" onClick={handleDelete}>
                        <Trash2 className="h-4 w-4 mr-2" />
                        删除项目
                    </Button>
                </div>
            </div>

            {/* Overview Cards */}
            <div className="grid gap-4 md:grid-cols-5">
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium text-muted-foreground">进度</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{project.progress || 0}%</div>
                        <Progress value={project.progress || 0} className="mt-2" />
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium text-muted-foreground">样品数</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold flex items-center gap-2">
                            <Package className="h-6 w-6 text-primary" />
                            {project.sample_count || 0}
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium text-muted-foreground">任务数</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold flex items-center gap-2">
                            <PlayCircle className="h-6 w-6 text-primary" />
                            {project.task_count || 0}
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium text-muted-foreground">客户</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{project.client || "未设置"}</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium text-muted-foreground">截止日期</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {project.deadline ? new Date(project.deadline).toLocaleDateString('zh-CN') : "未设置"}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Tabs */}
            <Tabs defaultValue="overview" className="space-y-4" onValueChange={(value) => {
                if (value === 'samples' && samples.length === 0 && !samplesLoading) {
                    fetchProjectSamples()
                }
                if (value === 'tasks' && tasks.length === 0 && !tasksLoading) {
                    fetchProjectTasks()
                }
            }}>
                <TabsList>
                    <TabsTrigger value="overview">概览</TabsTrigger>
                    <TabsTrigger value="tasks">任务</TabsTrigger>
                    <TabsTrigger value="reports">报告</TabsTrigger>
                    <TabsTrigger value="samples">样品</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>项目信息</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid gap-4 md:grid-cols-2">
                                <div>
                                    <div className="text-sm font-medium text-muted-foreground">项目名称</div>
                                    <div className="mt-1">{project.name}</div>
                                </div>
                                <div>
                                    <div className="text-sm font-medium text-muted-foreground">项目编号</div>
                                    <div className="mt-1">{project.code}</div>
                                </div>
                                <div>
                                    <div className="text-sm font-medium text-muted-foreground">客户</div>
                                    <div className="mt-1">{project.client || "未设置"}</div>
                                </div>
                                <div>
                                    <div className="text-sm font-medium text-muted-foreground">标准</div>
                                    <div className="mt-1">{project.standard || "未设置"}</div>
                                </div>
                                <div>
                                    <div className="text-sm font-medium text-muted-foreground">创建时间</div>
                                    <div className="mt-1">
                                        {project.created_at ? new Date(project.created_at).toLocaleString('zh-CN') : "未知"}
                                    </div>
                                </div>
                                <div>
                                    <div className="text-sm font-medium text-muted-foreground">更新时间</div>
                                    <div className="mt-1">
                                        {project.updated_at ? new Date(project.updated_at).toLocaleString('zh-CN') : "未知"}
                                    </div>
                                </div>
                            </div>
                            {project.description && (
                                <div>
                                    <div className="text-sm font-medium text-muted-foreground">项目描述</div>
                                    <div className="mt-1">{project.description}</div>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <div className="grid gap-4 md:grid-cols-2">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <FileText className="h-5 w-5" />
                                    快速操作
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2">
                                <Button className="w-full justify-start" variant="outline" onClick={() => router.push(`/projects/${projectId}/compliance`)}>
                                    <CheckSquare className="h-4 w-4 mr-2" />
                                    查看合规矩阵
                                </Button>
                                <Button className="w-full justify-start" variant="outline" onClick={() => router.push(`/projects/${projectId}/reports`)}>
                                    <FileText className="h-4 w-4 mr-2" />
                                    查看项目报告
                                </Button>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                <TabsContent value="tasks">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <PlayCircle className="h-5 w-5" />
                                项目任务 ({tasks.length})
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {tasksLoading ? (
                                <div className="flex items-center justify-center py-12">
                                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                                    <span className="ml-2">加载任务中...</span>
                                </div>
                            ) : tasks.length === 0 ? (
                                <div className="text-center py-12">
                                    <PlayCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                                    <p className="text-muted-foreground mb-4">该项目暂无关联任务</p>
                                    <Link href="/tasks/new">
                                        <Button>
                                            <PlayCircle className="h-4 w-4 mr-2" />
                                            创建任务
                                        </Button>
                                    </Link>
                                </div>
                            ) : (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>任务名称</TableHead>
                                            <TableHead>类型</TableHead>
                                            <TableHead>状态</TableHead>
                                            <TableHead>关联样品</TableHead>
                                            <TableHead>创建时间</TableHead>
                                            <TableHead className="text-right">操作</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {tasks.map((task) => (
                                            <TableRow key={task.id}>
                                                <TableCell className="font-medium">{task.name}</TableCell>
                                                <TableCell>
                                                    <Badge variant="outline">{task.type}</Badge>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant={
                                                        task.status === 'completed' ? 'default' :
                                                            task.status === 'running' ? 'destructive' :
                                                                'secondary'
                                                    }>
                                                        {task.status === 'pending' ? '待执行' :
                                                            task.status === 'running' ? '运行中' :
                                                                task.status === 'completed' ? '已完成' :
                                                                    task.status}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-muted-foreground">
                                                    {task.sample_code || '-'}
                                                </TableCell>
                                                <TableCell className="text-muted-foreground text-sm">
                                                    {task.created_at ? new Date(task.created_at).toLocaleDateString('zh-CN') : '-'}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <Link href={`/tasks/${task.id}`}>
                                                        <Button variant="ghost" size="sm">
                                                            <Eye className="h-4 w-4" />
                                                        </Button>
                                                    </Link>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="reports">
                    <Card>
                        <CardContent className="p-8 text-center text-muted-foreground">
                            报告列表请访问 <a href={`/projects/${projectId}/reports`} className="text-primary underline">项目报告页面</a>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="samples">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Package className="h-5 w-5" />
                                项目样品 ({samples.length})
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {samplesLoading ? (
                                <div className="flex items-center justify-center py-12">
                                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                                    <span className="ml-2">加载样品中...</span>
                                </div>
                            ) : samples.length === 0 ? (
                                <div className="text-center py-12">
                                    <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                                    <p className="text-muted-foreground mb-4">该项目暂无关联样品</p>
                                    <Button onClick={() => router.push('/samples/new')}>
                                        <Package className="h-4 w-4 mr-2" />
                                        登记样品
                                    </Button>
                                </div>
                            ) : (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>样品编号</TableHead>
                                            <TableHead>样品名称</TableHead>
                                            <TableHead>型号</TableHead>
                                            <TableHead>制造商</TableHead>
                                            <TableHead>状态</TableHead>
                                            <TableHead>存放位置</TableHead>
                                            <TableHead className="text-right">操作</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {samples.map((sample) => (
                                            <TableRow key={sample.id}>
                                                <TableCell className="font-mono text-sm">{sample.code}</TableCell>
                                                <TableCell>{sample.name}</TableCell>
                                                <TableCell className="text-muted-foreground">{sample.model}</TableCell>
                                                <TableCell className="text-muted-foreground">{sample.manufacturer}</TableCell>
                                                <TableCell>
                                                    <Badge variant={sample.status === 'in_stock' ? 'default' : 'secondary'}>
                                                        {sample.status === 'in_stock' ? '在库' : sample.status}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>{sample.location}</TableCell>
                                                <TableCell className="text-right space-x-2">
                                                    <Link href={`/samples/${sample.id}`}>
                                                        <Button variant="ghost" size="sm">
                                                            <Eye className="h-4 w-4" />
                                                        </Button>
                                                    </Link>
                                                    {sample.qr_code_url && (
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => window.open(sample.qr_code_url, '_blank')}
                                                        >
                                                            <QrCode className="h-4 w-4" />
                                                        </Button>
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    )
}
