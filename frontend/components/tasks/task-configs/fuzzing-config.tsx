"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { AlertCircle, BookOpen, Shield } from "lucide-react"
import {
    Alert,
    AlertDescription,
    AlertTitle,
} from "@/components/ui/alert"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"

interface FuzzingConfigProps {
    formData: any
    setFormData: (data: any) => void
}

// 预定义的测试目标
const TEST_TARGETS = [
    {
        category: "本地测试应用 (无需认证)",
        targets: [
            {
                name: "Juice Shop - 产品搜索 (SQL注入)",
                url: "http://target-juiceshop:3000/rest/products/search?q=",
                description: "OWASP Juice Shop 公开搜索接口",
                method: "GET",
                safe: true
            },
            {
                name: "Juice Shop - 用户注册 (XSS)",
                url: "http://target-juiceshop:3000/api/Users",
                description: "用户注册接口",
                method: "POST",
                safe: true
            }
        ]
    },
    {
        category: "需手动登录 (高级)",
        targets: [
            {
                name: "DVWA - SQL注入 (需Cookie)",
                url: "http://target-dvwa:80/vulnerabilities/sqli/",
                description: "注意：扫描前需浏览器登录获取Cookie",
                method: "GET",
                safe: true
            },
            {
                name: "WebGoat - 登录 (表单)",
                url: "http://target-webgoat:8080/WebGoat/login",
                description: "WebGoat 登录页面测试",
                method: "POST",
                safe: true
            }
        ]
    },
    {
        category: "公开测试网站",
        targets: [
            {
                name: "Acunetix 测试站",
                url: "http://testphp.vulnweb.com/search.php?test=query",
                description: "Acunetix官方测试站点",
                method: "GET",
                safe: true
            },
            {
                name: "Google Gruyere (XSS)",
                url: "https://google-gruyere.appspot.com/123/feed.gtl",
                description: "Google 漏洞靶场",
                method: "GET",
                safe: true
            }
        ]
    }
]

export function FuzzingConfig({ formData, setFormData }: FuzzingConfigProps) {
    const [showWarningDialog, setShowWarningDialog] = useState(false)
    const [pendingUrl, setPendingUrl] = useState("")
    const testTypes = formData.test_types || ["sql_injection", "xss", "path_traversal"];

    const toggleTestType = (type: string) => {
        const current = formData.test_types || ["sql_injection", "xss", "path_traversal"];
        const updated = current.includes(type)
            ? current.filter((t: string) => t !== type)
            : [...current, type];
        setFormData({ ...formData, test_types: updated });
    };

    const handleUrlChange = (url: string) => {
        // 检查是否为localhost
        const isLocalhost = url.includes('localhost') || url.includes('127.0.0.1')

        if (!isLocalhost && url.trim() !== '') {
            setPendingUrl(url)
            setShowWarningDialog(true)
        } else {
            setFormData({ ...formData, target_url: url })
        }
    }

    const confirmNonLocalTarget = () => {
        setFormData({ ...formData, target_url: pendingUrl })
        setShowWarningDialog(false)
        setPendingUrl("")
    }

    const loadExample = (target: any) => {
        setFormData({
            ...formData,
            target_url: target.url,
            method: target.method
        })
    }

    return (
        <div className="space-y-4 p-4 border rounded-lg bg-muted/20">
            <div className="flex items-center gap-2 mb-4">
                <div className="h-8 w-8 rounded-full bg-red-500/10 flex items-center justify-center">
                    <span className="text-red-500 text-lg">⚡</span>
                </div>
                <div>
                    <h3 className="font-semibold">模糊测试配置</h3>
                    <p className="text-xs text-muted-foreground">Web应用漏洞Fuzzing测试</p>
                </div>
            </div>

            {/* 法律警告 - 置顶显示 */}
            <Alert variant="destructive">
                <Shield className="h-4 w-4" />
                <AlertTitle>⚖️ 法律声明</AlertTitle>
                <AlertDescription className="space-y-2 text-xs">
                    <p><strong>未经授权的安全测试是违法行为！</strong></p>
                    <ul className="list-disc list-inside space-y-1">
                        <li>仅可对<strong>明确授权</strong>的系统进行测试</li>
                        <li>建议使用下方<strong>本地测试应用</strong></li>
                        <li>对未授权目标测试将承担法律责任</li>
                    </ul>
                </AlertDescription>
            </Alert>

            {/* 测试目标示例 */}
            <div className="space-y-3">
                <div className="flex items-center gap-2">
                    <BookOpen className="h-4 w-4 text-muted-foreground" />
                    <Label>测试目标示例</Label>
                </div>
                <div className="space-y-3 p-3 border rounded-lg bg-background">
                    {TEST_TARGETS.map((category) => (
                        <div key={category.category}>
                            <p className="text-xs font-medium text-muted-foreground mb-2">
                                {category.category}
                            </p>
                            <div className="space-y-1">
                                {category.targets.map((target) => (
                                    <Button
                                        key={target.url}
                                        variant="outline"
                                        size="sm"
                                        className="w-full justify-start text-left h-auto py-2"
                                        onClick={() => loadExample(target)}
                                    >
                                        <div className="flex-1">
                                            <div className="font-medium text-xs">{target.name}</div>
                                            <div className="text-xs text-muted-foreground truncate">
                                                {target.url}
                                            </div>
                                        </div>
                                    </Button>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* 目标URL */}
            <div className="space-y-2">
                <Label htmlFor="target_url">目标URL *</Label>
                <Input
                    id="target_url"
                    placeholder="选择上方示例或输入URL"
                    value={formData.target_url || ''}
                    onChange={(e) => handleUrlChange(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                    💡 推荐使用上方预设的测试目标
                </p>
            </div>

            {/* HTTP方法 */}
            <div className="space-y-2">
                <Label htmlFor="method">HTTP方法</Label>
                <Select
                    value={formData.method || 'GET'}
                    onValueChange={(value) => setFormData({ ...formData, method: value })}
                >
                    <SelectTrigger>
                        <SelectValue placeholder="选择HTTP方法" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="GET">GET</SelectItem>
                        <SelectItem value="POST">POST</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* 测试类型 */}
            <div className="space-y-2">
                <Label>测试类型</Label>
                <div className="space-y-2 p-3 border rounded-lg">
                    <div className="flex items-center space-x-2">
                        <Checkbox
                            id="sql"
                            checked={testTypes.includes("sql_injection")}
                            onCheckedChange={() => toggleTestType("sql_injection")}
                        />
                        <label htmlFor="sql" className="text-sm cursor-pointer">
                            SQL注入检测
                        </label>
                    </div>
                    <div className="flex items-center space-x-2">
                        <Checkbox
                            id="xss"
                            checked={testTypes.includes("xss")}
                            onCheckedChange={() => toggleTestType("xss")}
                        />
                        <label htmlFor="xss" className="text-sm cursor-pointer">
                            XSS跨站脚本检测
                        </label>
                    </div>
                    <div className="flex items-center space-x-2">
                        <Checkbox
                            id="path"
                            checked={testTypes.includes("path_traversal")}
                            onCheckedChange={() => toggleTestType("path_traversal")}
                        />
                        <label htmlFor="path" className="text-sm cursor-pointer">
                            路径遍历检测
                        </label>
                    </div>
                </div>
            </div>

            {/* 高级选项 */}
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="fuzzTimeout">超时时间 (秒)</Label>
                    <Input
                        id="fuzzTimeout"
                        type="number"
                        value={formData.fuzzTimeout || '10'}
                        onChange={(e) => setFormData({ ...formData, fuzzTimeout: e.target.value })}
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="fuzzIterations">最大请求数</Label>
                    <Input
                        id="fuzzIterations"
                        type="number"
                        value={formData.fuzzIterations || '1000'}
                        onChange={(e) => setFormData({ ...formData, fuzzIterations: e.target.value })}
                    />
                </div>
            </div>

            {/* 安全警告 */}
            <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>⚠️ 安全提示</AlertTitle>
                <AlertDescription className="text-xs">
                    模糊测试具有攻击性，可能导致目标系统不稳定或崩溃。仅在授权测试环境中使用！
                </AlertDescription>
            </Alert>

            {/* 非本地目标确认对话框 */}
            <Dialog open={showWarningDialog} onOpenChange={setShowWarningDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Shield className="h-5 w-5 text-destructive" />
                            法律风险警告
                        </DialogTitle>
                        <DialogDescription className="space-y-3 pt-4">
                            <p className="font-medium text-destructive">
                                您正在尝试测试非本地目标！
                            </p>
                            <p>目标URL: <code className="text-xs bg-muted px-2 py-1 rounded">{pendingUrl}</code></p>
                            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3 space-y-2 text-sm">
                                <p className="font-medium">⚠️ 请确认：</p>
                                <ul className="list-disc list-inside space-y-1 text-xs">
                                    <li>您拥有该系统的<strong>明确书面授权</strong></li>
                                    <li>该测试在<strong>合法授权范围内</strong></li>
                                    <li>您理解并承担所有<strong>法律责任</strong></li>
                                </ul>
                            </div>
                            <p className="text-xs text-muted-foreground">
                                未经授权对计算机系统进行渗透测试违反多国法律，包括但不限于《中华人民共和国网络安全法》。
                            </p>
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => {
                            setShowWarningDialog(false)
                            setPendingUrl("")
                        }}>
                            取消
                        </Button>
                        <Button variant="destructive" onClick={confirmNonLocalTarget}>
                            我已获得授权，继续
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
