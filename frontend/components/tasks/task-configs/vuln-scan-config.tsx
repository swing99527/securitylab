"use client"

import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { taskApi } from "@/lib/api"
import { Loader2 } from "lucide-react"

interface VulnScanConfigProps {
    formData: any
    setFormData: (data: any) => void
}

export function VulnScanConfig({ formData, setFormData }: VulnScanConfigProps) {
    const [nmapTasks, setNmapTasks] = useState<any[]>([])
    const [loading, setLoading] = useState(false)

    // Fetch completed Nmap scan tasks
    useEffect(() => {
        fetchNmapTasks()
    }, [])

    const fetchNmapTasks = async () => {
        setLoading(true)
        try {
            const response = await taskApi.getList({
                page: 1,
                pageSize: 100,
                type: 'nmap_scan',
                status: 'completed'
            })

            if (response.code === 200 && response.data) {
                setNmapTasks(response.data.list || [])
            }
        } catch (error) {
            console.error('Failed to fetch Nmap tasks:', error)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="space-y-4 p-4 border rounded-lg bg-muted/20">
            <div className="flex items-center gap-2 mb-4">
                <div className="h-8 w-8 rounded-full bg-purple-500/10 flex items-center justify-center">
                    <span className="text-purple-500 text-lg">🛡️</span>
                </div>
                <div>
                    <h3 className="font-semibold">漏洞扫描配置</h3>
                    <p className="text-xs text-muted-foreground">基于NVD数据库的CVE漏洞检测</p>
                </div>
            </div>

            {/* 数据源说明 */}
            <div className="rounded-lg bg-blue-50 dark:bg-blue-950/20 p-3 text-sm">
                <p className="font-medium text-blue-900 dark:text-blue-100">💡 漏洞扫描说明</p>
                <p className="mt-1 text-xs text-blue-800 dark:text-blue-200">
                    基于Nmap扫描结果识别服务版本，然后查询NVD CVE数据库查找已知漏洞
                </p>
            </div>

            {/* Nmap扫描结果选择 */}
            <div className="space-y-2">
                <Label htmlFor="vulnScanResultId">
                    选择Nmap扫描任务 <span className="text-destructive">*</span>
                </Label>
                <Select
                    value={formData.vulnScanResultId || ''}
                    onValueChange={(value) => setFormData({ ...formData, vulnScanResultId: value })}
                    disabled={loading}
                >
                    <SelectTrigger id="vulnScanResultId">
                        <SelectValue placeholder={loading ? "加载中..." : "选择一个已完成的Nmap扫描"} />
                    </SelectTrigger>
                    <SelectContent>
                        {loading ? (
                            <div className="p-2 text-sm text-muted-foreground flex items-center gap-2">
                                <Loader2 className="h-4 w-4 animate-spin" />
                                加载Nmap扫描任务...
                            </div>
                        ) : nmapTasks.length === 0 ? (
                            <div className="p-2 text-sm text-muted-foreground">
                                暂无已完成的Nmap扫描任务
                            </div>
                        ) : (
                            nmapTasks.map((task) => (
                                <SelectItem key={task.id} value={task.id.toString()}>
                                    {task.name} - {task.config?.target || 'Unknown Target'}
                                </SelectItem>
                            ))
                        )}
                    </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                    从Nmap扫描结果中提取服务信息进行漏洞检测
                </p>
            </div>

            {/* 严重程度过滤 */}
            <div className="space-y-3">
                <Label>严重程度过滤</Label>
                <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                        <input
                            type="checkbox"
                            id="severityCritical"
                            checked={formData.severityFilter?.includes('CRITICAL')}
                            onChange={(e) => {
                                const newFilter = e.target.checked
                                    ? [...(formData.severityFilter || []), 'CRITICAL']
                                    : (formData.severityFilter || []).filter((s: string) => s !== 'CRITICAL')
                                setFormData({ ...formData, severityFilter: newFilter })
                            }}
                            className="rounded border-gray-300"
                        />
                        <Label htmlFor="severityCritical" className="font-normal cursor-pointer">
                            🔴 严重 (CVSS ≥ 9.0)
                        </Label>
                    </div>

                    <div className="flex items-center space-x-2">
                        <input
                            type="checkbox"
                            id="severityHigh"
                            checked={formData.severityFilter?.includes('HIGH')}
                            onChange={(e) => {
                                const newFilter = e.target.checked
                                    ? [...(formData.severityFilter || []), 'HIGH']
                                    : (formData.severityFilter || []).filter((s: string) => s !== 'HIGH')
                                setFormData({ ...formData, severityFilter: newFilter })
                            }}
                            className="rounded border-gray-300"
                        />
                        <Label htmlFor="severityHigh" className="font-normal cursor-pointer">
                            🟠 高危 (CVSS 7.0-8.9)
                        </Label>
                    </div>

                    <div className="flex items-center space-x-2">
                        <input
                            type="checkbox"
                            id="severityMedium"
                            checked={formData.severityFilter?.includes('MEDIUM')}
                            onChange={(e) => {
                                const newFilter = e.target.checked
                                    ? [...(formData.severityFilter || []), 'MEDIUM']
                                    : (formData.severityFilter || []).filter((s: string) => s !== 'MEDIUM')
                                setFormData({ ...formData, severityFilter: newFilter })
                            }}
                            className="rounded border-gray-300"
                        />
                        <Label htmlFor="severityMedium" className="font-normal cursor-pointer">
                            🟡 中危 (CVSS 4.0-6.9)
                        </Label>
                    </div>

                    <div className="flex items-center space-x-2">
                        <input
                            type="checkbox"
                            id="severityLow"
                            checked={formData.severityFilter?.includes('LOW')}
                            onChange={(e) => {
                                const newFilter = e.target.checked
                                    ? [...(formData.severityFilter || []), 'LOW']
                                    : (formData.severityFilter || []).filter((s: string) => s !== 'LOW')
                                setFormData({ ...formData, severityFilter: newFilter })
                            }}
                            className="rounded border-gray-300"
                        />
                        <Label htmlFor="severityLow" className="font-normal cursor-pointer">
                            🟢 低危 (CVSS 0.1-3.9)
                        </Label>
                    </div>
                </div>
                <p className="text-xs text-muted-foreground">
                    只显示选中严重程度的漏洞
                </p>
            </div>

            {/* NVD API密钥 (可选) */}
            <div className="space-y-2">
                <Label htmlFor="nvdApiKey">NVD API密钥 (可选)</Label>
                <Input
                    id="nvdApiKey"
                    type="password"
                    placeholder="提供API密钥可提高速率限制"
                    value={formData.nvdApiKey || ''}
                    onChange={(e) => setFormData({ ...formData, nvdApiKey: e.target.value })}
                />
                <p className="text-xs text-muted-foreground">
                    无密钥: 5请求/30秒 | 有密钥: 50请求/30秒
                </p>
            </div>
        </div>
    )
}
