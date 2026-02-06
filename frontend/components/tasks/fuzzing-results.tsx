"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { AlertTriangle, CheckCircle2, XCircle, ShieldAlert, Activity, Zap } from "lucide-react"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"

interface FuzzingResultsProps {
    taskId: string
    result?: any
}

interface Vulnerability {
    type: string
    severity: string
    url: string
    parameter: string
    payload: string
    evidence: string
    pattern_matched?: string
    status_code?: number
    timestamp: number
}

export function FuzzingResults({ taskId, result }: FuzzingResultsProps) {
    const [stats, setStats] = useState({
        total_requests: 0,
        vulnerabilities_found: 0,
        findings: [] as Vulnerability[]
    })

    useEffect(() => {
        if (result) {
            setStats({
                total_requests: result.total_requests || 0,
                vulnerabilities_found: result.vulnerabilities_found || 0,
                findings: result.findings || []
            })
        }
    }, [result])

    const getSeverityColor = (severity: string) => {
        switch (severity.toUpperCase()) {
            case 'CRITICAL':
                return 'bg-red-500'
            case 'HIGH':
                return 'bg-orange-500'
            case 'MEDIUM':
                return 'bg-yellow-500'
            case 'LOW':
                return 'bg-blue-500'
            default:
                return 'bg-gray-500'
        }
    }

    const getSeverityIcon = (severity: string) => {
        switch (severity.toUpperCase()) {
            case 'CRITICAL':
            case 'HIGH':
                return <AlertTriangle className="h-4 w-4" />
            case 'MEDIUM':
                return <ShieldAlert className="h-4 w-4" />
            default:
                return <Activity className="h-4 w-4" />
        }
    }

    const groupedFindings = stats.findings.reduce((acc, finding) => {
        const key = finding.type
        if (!acc[key]) {
            acc[key] = []
        }
        acc[key].push(finding)
        return acc
    }, {} as Record<string, Vulnerability[]>)

    return (
        <div className="space-y-4">
            {/* 统计卡片 */}
            <div className="grid grid-cols-3 gap-4">
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">测试请求</p>
                                <h3 className="text-2xl font-bold">{stats.total_requests}</h3>
                            </div>
                            <Zap className="h-8 w-8 text-blue-500" />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">发现漏洞</p>
                                <h3 className="text-2xl font-bold text-red-500">{stats.vulnerabilities_found}</h3>
                            </div>
                            <AlertTriangle className="h-8 w-8 text-red-500" />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">成功率</p>
                                <h3 className="text-2xl font-bold">
                                    {stats.total_requests > 0
                                        ? ((stats.vulnerabilities_found / stats.total_requests) * 100).toFixed(1)
                                        : 0}%
                                </h3>
                            </div>
                            <Activity className="h-8 w-8 text-green-500" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* 漏洞列表 */}
            {stats.vulnerabilities_found > 0 ? (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <AlertTriangle className="h-5 w-5 text-red-500" />
                            发现的漏洞详情
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ScrollArea className="h-[400px] pr-4">
                            <Accordion type="single" collapsible className="space-y-2">
                                {Object.entries(groupedFindings).map(([type, findings], idx) => (
                                    <div key={idx} className="space-y-2">
                                        <div className="flex items-center gap-2 mb-2">
                                            <Badge variant="outline">{type}</Badge>
                                            <span className="text-sm text-muted-foreground">
                                                {findings.length} 个漏洞
                                            </span>
                                        </div>
                                        {findings.map((finding, findingIdx) => (
                                            <AccordionItem
                                                key={`${idx}-${findingIdx}`}
                                                value={`${idx}-${findingIdx}`}
                                                className="border rounded-lg px-4"
                                            >
                                                <AccordionTrigger className="hover:no-underline">
                                                    <div className="flex items-center justify-between w-full pr-4">
                                                        <div className="flex items-center gap-3">
                                                            {getSeverityIcon(finding.severity)}
                                                            <div className="text-left">
                                                                <div className="font-medium">{finding.type}</div>
                                                                <div className="text-sm text-muted-foreground">
                                                                    参数: {finding.parameter}
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <Badge className={`${getSeverityColor(finding.severity)} text-white`}>
                                                            {finding.severity}
                                                        </Badge>
                                                    </div>
                                                </AccordionTrigger>
                                                <AccordionContent className="space-y-3 pt-4">
                                                    {/* URL */}
                                                    <div>
                                                        <div className="text-sm font-medium mb-1">目标URL</div>
                                                        <code className="text-xs bg-muted p-2 rounded block break-all">
                                                            {finding.url}
                                                        </code>
                                                    </div>

                                                    {/* Payload */}
                                                    <div>
                                                        <div className="text-sm font-medium mb-1">注入Payload</div>
                                                        <code className="text-xs bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 p-2 rounded block break-all">
                                                            {finding.payload}
                                                        </code>
                                                    </div>

                                                    {/* 证据 */}
                                                    <div>
                                                        <div className="text-sm font-medium mb-1">响应证据</div>
                                                        <ScrollArea className="h-24">
                                                            <code className="text-xs bg-muted p-2 rounded block whitespace-pre-wrap">
                                                                {finding.evidence}
                                                            </code>
                                                        </ScrollArea>
                                                    </div>

                                                    {/* 匹配模式 */}
                                                    {finding.pattern_matched && (
                                                        <div>
                                                            <div className="text-sm font-medium mb-1">匹配模式</div>
                                                            <code className="text-xs bg-muted p-2 rounded block">
                                                                {finding.pattern_matched}
                                                            </code>
                                                        </div>
                                                    )}

                                                    {/* 元数据 */}
                                                    <div className="flex gap-4 text-sm text-muted-foreground">
                                                        {finding.status_code && (
                                                            <div>状态码: <span className="font-mono">{finding.status_code}</span></div>
                                                        )}
                                                        <div>
                                                            时间: {new Date(finding.timestamp * 1000).toLocaleString()}
                                                        </div>
                                                    </div>
                                                </AccordionContent>
                                            </AccordionItem>
                                        ))}
                                    </div>
                                ))}
                            </Accordion>
                        </ScrollArea>
                    </CardContent>
                </Card>
            ) : (
                <Card>
                    <CardContent className="py-12">
                        <div className="flex flex-col items-center justify-center text-center space-y-4">
                            {stats.total_requests > 0 ? (
                                <>
                                    <CheckCircle2 className="h-12 w-12 text-green-500" />
                                    <div>
                                        <h3 className="font-semibold text-lg">未发现漏洞</h3>
                                        <p className="text-sm text-muted-foreground">
                                            已测试 {stats.total_requests} 个请求，未发现安全漏洞
                                        </p>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <XCircle className="h-12 w-12 text-muted-foreground" />
                                    <div>
                                        <h3 className="font-semibold text-lg">暂无结果</h3>
                                        <p className="text-sm text-muted-foreground">
                                            查看"执行日志"选项卡了解详细信息
                                        </p>
                                    </div>
                                </>
                            )}
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}
