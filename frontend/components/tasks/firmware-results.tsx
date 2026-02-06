"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { FileIcon, AlertTriangle, Key, Lock, Globe, Mail, ExternalLink } from "lucide-react"
import { useState, useEffect } from "react"

interface FirmwareResultsProps {
    taskId: string
    result: any
}

export function FirmwareResults({ taskId, result }: FirmwareResultsProps) {
    const [data, setData] = useState<any>(null)

    useEffect(() => {
        if (result) {
            setData(result)
        }
    }, [result])

    if (!data) {
        return (
            <Card>
                <CardContent className="p-8 text-center text-muted-foreground">
                    暂无固件分析结果
                </CardContent>
            </Card>
        )
    }

    const getSeverityColor = (severity: string) => {
        switch (severity?.toUpperCase()) {
            case 'CRITICAL': return 'destructive'
            case 'HIGH': return 'destructive'
            case 'MEDIUM': return 'default'
            case 'LOW': return 'secondary'
            default: return 'outline'
        }
    }

    return (
        <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="overview">概览</TabsTrigger>
                <TabsTrigger value="findings">
                    安全发现
                    {data.findings?.length > 0 && (
                        <Badge variant="destructive" className="ml-2">{data.findings.length}</Badge>
                    )}
                </TabsTrigger>
                <TabsTrigger value="strings">字符串</TabsTrigger>
                <TabsTrigger value="crypto">加密材料</TabsTrigger>
                <TabsTrigger value="filesystem">文件系统</TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-4">
                <div className="grid gap-4 md:grid-cols-3">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">固件信息</CardTitle>
                            <FileIcon className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {data.firmware_info?.size_mb || 0} MB
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                                {data.firmware_info?.filename}
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">提取文件</CardTitle>
                            <FileIcon className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {data.extraction?.total_files || 0}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                                {data.extraction?.filesystem_type || '未知'} 文件系统
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">安全发现</CardTitle>
                            <AlertTriangle className="h-4 w-4 text-destructive" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-destructive">
                                {data.findings?.length || 0}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                                检测到敏感数据
                            </p>
                        </CardContent>
                    </Card>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>提取摘要</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">状态:</span>
                            <Badge variant={data.extraction?.status === 'success' ? 'default' : 'destructive'}>
                                {data.extraction?.status}
                            </Badge>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">总文件数:</span>
                            <span className="font-medium">{data.extraction?.total_files || 0}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">文件系统类型:</span>
                            <span className="font-medium">{data.extraction?.filesystem_type || '未知'}</span>
                        </div>
                    </CardContent>
                </Card>
            </TabsContent>

            {/* Findings Tab */}
            <TabsContent value="findings">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <AlertTriangle className="h-5 w-5 text-destructive" />
                            敏感发现 ({data.findings?.length || 0})
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {data.findings && data.findings.length > 0 ? (
                            <Accordion type="single" collapsible className="w-full">
                                {data.findings.map((finding: any, index: number) => (
                                    <AccordionItem key={index} value={`finding-${index}`}>
                                        <AccordionTrigger>
                                            <div className="flex items-center gap-2 flex-1">
                                                <Badge variant={getSeverityColor(finding.severity)}>
                                                    {finding.severity}
                                                </Badge>
                                                <span className="text-sm font-medium">{finding.type}</span>
                                                <span className="text-xs text-muted-foreground ml-auto mr-4">
                                                    {finding.file}
                                                </span>
                                            </div>
                                        </AccordionTrigger>
                                        <AccordionContent>
                                            <div className="space-y-2 p-4 bg-muted/50 rounded-lg">
                                                <div>
                                                    <span className="text-sm font-medium">描述:</span>
                                                    <p className="text-sm text-muted-foreground mt-1">{finding.description}</p>
                                                </div>
                                                {finding.matched && (
                                                    <div>
                                                        <span className="text-sm font-medium">匹配内容:</span>
                                                        <pre className="text-xs bg-card p-2 rounded mt-1 overflow-x-auto">
                                                            {finding.matched}
                                                        </pre>
                                                    </div>
                                                )}
                                                {finding.size && (
                                                    <div>
                                                        <span className="text-sm font-medium">大小:</span>
                                                        <span className="text-sm text-muted-foreground ml-2">{finding.size} 字节</span>
                                                    </div>
                                                )}
                                            </div>
                                        </AccordionContent>
                                    </AccordionItem>
                                ))}
                            </Accordion>
                        ) : (
                            <p className="text-center text-muted-foreground py-8">
                                未检测到敏感发现
                            </p>
                        )}
                    </CardContent>
                </Card>
            </TabsContent>

            {/* Strings Tab */}
            <TabsContent value="strings" className="space-y-4">
                {data.strings?.urls && data.strings.urls.length > 0 && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Globe className="h-5 w-5" />
                                URLs ({data.strings.urls.length})
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-1 max-h-64 overflow-y-auto">
                                {data.strings.urls.map((url: string, index: number) => (
                                    <div key={index} className="text-sm font-mono bg-muted p-2 rounded flex items-center gap-2">
                                        <ExternalLink className="h-3 w-3 flex-shrink-0" />
                                        {url}
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                )}

                {data.strings?.ips && data.strings.ips.length > 0 && (
                    <Card>
                        <CardHeader>
                            <CardTitle>IP Addresses ({data.strings.ips.length})</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-3 gap-2">
                                {data.strings.ips.map((ip: string, index: number) => (
                                    <div key={index} className="text-sm font-mono bg-muted p-2 rounded text-center">
                                        {ip}
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                )}

                {data.strings?.emails && data.strings.emails.length > 0 && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Mail className="h-5 w-5" />
                                邮箱地址 ({data.strings.emails.length})
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-1">
                                {data.strings.emails.map((email: string, index: number) => (
                                    <div key={index} className="text-sm font-mono bg-muted p-2 rounded">
                                        {email}
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                )}
            </TabsContent>

            {/* Crypto Tab */}
            <TabsContent value="crypto" className="space-y-4">
                {data.crypto?.private_keys && data.crypto.private_keys.length > 0 && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-destructive">
                                <Key className="h-5 w-5" />
                                私钥 ({data.crypto.private_keys.length})
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>文件</TableHead>
                                        <TableHead>类型</TableHead>
                                        <TableHead>大小</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {data.crypto.private_keys.map((key: any, index: number) => (
                                        <TableRow key={index}>
                                            <TableCell className="font-mono text-xs">{key.file}</TableCell>
                                            <TableCell><Badge>{key.type}</Badge></TableCell>
                                            <TableCell>{key.size} 字节</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                )}

                {data.crypto?.certificates && data.crypto.certificates.length > 0 && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Lock className="h-5 w-5" />
                                证书 ({data.crypto.certificates.length})
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>文件</TableHead>
                                        <TableHead>大小</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {data.crypto.certificates.map((cert: any, index: number) => (
                                        <TableRow key={index}>
                                            <TableCell className="font-mono text-xs">{cert.file}</TableCell>
                                            <TableCell>{cert.size} 字节</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                )}

                {(!data.crypto?.private_keys || data.crypto.private_keys.length === 0) &&
                    (!data.crypto?.certificates || data.crypto.certificates.length === 0) && (
                        <Card>
                            <CardContent className="p-8 text-center text-muted-foreground">
                                未发现加密材料
                            </CardContent>
                        </Card>
                    )}
            </TabsContent>

            {/* Filesystem Tab */}
            <TabsContent value="filesystem">
                <Card>
                    <CardHeader>
                        <CardTitle>文件系统信息</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <p className="text-sm text-muted-foreground">总文件数</p>
                                <p className="text-2xl font-bold">
                                    {data.extraction?.filesystem_info?.total_files || 0}
                                </p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-sm text-muted-foreground">总目录数</p>
                                <p className="text-2xl font-bold">
                                    {data.extraction?.filesystem_info?.total_directories || 0}
                                </p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-sm text-muted-foreground">总大小</p>
                                <p className="text-2xl font-bold">
                                    {data.extraction?.filesystem_info?.total_size_mb || 0} MB
                                </p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-sm text-muted-foreground">文件系统类型</p>
                                <p className="text-2xl font-bold">
                                    {data.extraction?.filesystem_type || '未知'}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </TabsContent>
        </Tabs>
    )
}
