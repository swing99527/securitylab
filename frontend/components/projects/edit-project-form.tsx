"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, Save, X, Calculator } from "lucide-react"
import { projectApi } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"

const statusOptions = [
    { value: "pending", label: "待处理" },
    { value: "in_progress", label: "进行中" },
    { value: "review", label: "待审核" },
    { value: "completed", label: "已完成" },
    { value: "cancelled", label: "已取消" },
]

interface EditProjectFormProps {
    projectId: string
}

export function EditProjectForm({ projectId }: EditProjectFormProps) {
    const router = useRouter()
    const { toast } = useToast()
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [calculating, setCalculating] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [formData, setFormData] = useState({
        name: "",
        code: "",
        client: "",
        standard: "",
        status: "in_progress",
        description: "",
        deadline: "",
        progress: 0,
    })

    useEffect(() => {
        async function fetchProject() {
            try {
                const response = await projectApi.getDetail(projectId)
                if (response.code === 200 && response.data) {
                    const project = response.data
                    setFormData({
                        name: project.name || "",
                        code: project.code || "",
                        client: project.client || "",
                        standard: project.standard || "",
                        status: project.status || "in_progress",
                        description: project.description || "",
                        deadline: project.deadline ? new Date(project.deadline).toISOString().split('T')[0] : "",
                        progress: project.progress || 0,
                    })
                } else {
                    setError("加载项目失败")
                }
            } catch (err) {
                console.error("Failed to fetch project:", err)
                setError("加载项目时出错")
            } finally {
                setLoading(false)
            }
        }

        fetchProject()
    }, [projectId])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setSaving(true)

        try {
            await projectApi.update(projectId, {
                name: formData.name,
                client: formData.client,
                standard: formData.standard,
                status: formData.status,
                description: formData.description,
                deadline: formData.deadline || undefined,
                progress: formData.progress,
            })

            toast({
                title: "保存成功",
                description: "项目信息已更新",
            })

            router.push(`/projects/${projectId}`)
        } catch (error) {
            console.error("Failed to update project:", error)
            toast({
                title: "保存失败",
                description: "无法更新项目信息",
                variant: "destructive",
            })
        } finally {
            setSaving(false)
        }
    }

    const handleAutoCalculate = async () => {
        setCalculating(true)
        try {
            const response = await projectApi.recalculateProgress(projectId)
            if (response.code === 200 && response.data) {
                setFormData({ ...formData, progress: response.data.progress })
                toast({
                    title: "计算成功",
                    description: response.data.message,
                })
            } else {
                toast({
                    title: "计算失败",
                    description: response.message || "无法计算项目进度",
                    variant: "destructive",
                })
            }
        } catch (error) {
            console.error("Failed to calculate progress:", error)
            toast({
                title: "计算失败",
                description: "无法计算项目进度",
                variant: "destructive",
            })
        } finally {
            setCalculating(false)
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="ml-2">加载项目信息中...</span>
            </div>
        )
    }

    if (error) {
        return (
            <div className="text-center py-12 text-destructive">
                <p>{error}</p>
                <Button className="mt-4" onClick={() => router.push('/projects')}>
                    返回项目列表
                </Button>
            </div>
        )
    }

    return (
        <form onSubmit={handleSubmit}>
            <Card>
                <CardHeader>
                    <CardTitle>编辑项目</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="grid gap-6 md:grid-cols-2">
                        <div className="space-y-2">
                            <Label htmlFor="name">
                                项目名称 <span className="text-destructive">*</span>
                            </Label>
                            <Input
                                id="name"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="code">项目编号</Label>
                            <Input
                                id="code"
                                value={formData.code}
                                disabled
                                className="bg-muted"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="client">客户</Label>
                            <Input
                                id="client"
                                value={formData.client}
                                onChange={(e) => setFormData({ ...formData, client: e.target.value })}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="standard">检测标准</Label>
                            <Input
                                id="standard"
                                placeholder="例如: GB/T 36951-2018"
                                value={formData.standard}
                                onChange={(e) => setFormData({ ...formData, standard: e.target.value })}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="status">项目状态</Label>
                            <Select
                                value={formData.status}
                                onValueChange={(value) => setFormData({ ...formData, status: value })}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {statusOptions.map((option) => (
                                        <SelectItem key={option.value} value={option.value}>
                                            {option.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="deadline">截止日期</Label>
                            <Input
                                id="deadline"
                                type="date"
                                value={formData.deadline}
                                onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="progress">项目进度 (%)</Label>
                            <div className="flex gap-2">
                                <Input
                                    id="progress"
                                    type="number"
                                    min="0"
                                    max="100"
                                    value={formData.progress}
                                    onChange={(e) => setFormData({ ...formData, progress: Number(e.target.value) })}
                                    className="flex-1"
                                />
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={handleAutoCalculate}
                                    disabled={calculating}
                                    className="shrink-0"
                                >
                                    {calculating ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                        <Calculator className="h-4 w-4" />
                                    )}
                                    <span className="ml-2">自动计算</span>
                                </Button>
                            </div>
                            <p className="text-xs text-muted-foreground">
                                基于任务完成率自动计算进度，或手动输入
                            </p>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="description">项目描述</Label>
                        <Textarea
                            id="description"
                            rows={4}
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            placeholder="输入项目的详细描述..."
                        />
                    </div>

                    <div className="flex gap-3 justify-end">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => router.push(`/projects/${projectId}`)}
                        >
                            <X className="h-4 w-4 mr-2" />
                            取消
                        </Button>
                        <Button type="submit" disabled={saving}>
                            {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                            <Save className="h-4 w-4 mr-2" />
                            保存
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </form>
    )
}
