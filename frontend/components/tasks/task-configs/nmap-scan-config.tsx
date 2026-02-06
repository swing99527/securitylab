"use client"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface NmapScanConfigProps {
    formData: any
    setFormData: (data: any) => void
}

export function NmapScanConfig({ formData, setFormData }: NmapScanConfigProps) {
    return (
        <div className="space-y-4 p-4 border rounded-lg bg-muted/20">
            <div className="flex items-center gap-2 mb-4">
                <div className="h-8 w-8 rounded-full bg-green-500/10 flex items-center justify-center">
                    <span className="text-green-500 text-lg">🔍</span>
                </div>
                <div>
                    <h3 className="font-semibold">Nmap扫描配置</h3>
                    <p className="text-xs text-muted-foreground">端口和服务检测</p>
                </div>
            </div>

            <div className="space-y-2">
                <Label htmlFor="nmapTarget">
                    扫描目标 <span className="text-destructive">*</span>
                </Label>
                <Input
                    id="nmapTarget"
                    placeholder="支持: IP(192.168.1.1) | 网段(192.168.1.0/24) | 域名(example.com) | 范围(192.168.1.1-50)"
                    value={formData.target || ''}
                    onChange={(e) => setFormData({ ...formData, target: e.target.value })}
                />
                <p className="text-xs text-muted-foreground">
                    支持单IP、CIDR网段、IP范围或域名，多个目标用空格分隔
                </p>
            </div>

            <div className="space-y-2">
                <Label htmlFor="scanType">扫描类型</Label>
                <Select
                    value={formData.scanType || 'quick'}
                    onValueChange={(value) => setFormData({ ...formData, scanType: value })}
                >
                    <SelectTrigger id="scanType">
                        <SelectValue placeholder="选择扫描类型" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="quick">快速发现 (Top 100端口，~30秒)</SelectItem>
                        <SelectItem value="full">完整审计 (全部65535端口 + 服务检测，10-30分钟)</SelectItem>
                        <SelectItem value="stealth">隐蔽扫描 (SYN扫描，规避检测)</SelectItem>
                        <SelectItem value="custom">高级配置 (完全自定义)</SelectItem>
                    </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                    {formData.scanType === 'quick' && '扫描常用的100个端口，适合快速发现'}
                    {formData.scanType === 'full' && '扫描所有端口并检测服务版本，耗时较长但信息完整'}
                    {formData.scanType === 'stealth' && '使用SYN扫描，不完成TCP连接，更隐蔽'}
                    {formData.scanType === 'custom' && '自定义扫描范围、速度和检测选项'}
                </p>
            </div>

            {formData.scanType === 'custom' && (
                <>
                    <div className="space-y-2">
                        <Label htmlFor="ports">端口范围</Label>
                        <Input
                            id="ports"
                            placeholder="例如: 1-1000 或 80,443,8080"
                            value={formData.ports || ''}
                            onChange={(e) => setFormData({ ...formData, ports: e.target.value })}
                        />
                        <p className="text-xs text-muted-foreground">
                            支持范围(1-1000)、列表(80,443)或组合
                        </p>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="timing">扫描速度</Label>
                        <Select
                            value={formData.timing || 'T4'}
                            onValueChange={(value) => setFormData({ ...formData, timing: value })}
                        >
                            <SelectTrigger id="timing">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="T0">偏执模式 (极慢，规避IDS)</SelectItem>
                                <SelectItem value="T1">鬼祟模式 (很慢)</SelectItem>
                                <SelectItem value="T2">文雅模式 (慢)</SelectItem>
                                <SelectItem value="T3">常规模式 (默认)</SelectItem>
                                <SelectItem value="T4">激进模式 (快速，推荐)</SelectItem>
                                <SelectItem value="T5">疯狂模式 (最快，可能不准)</SelectItem>
                            </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground">
                            速度越快越容易被IDS/IPS检测，根据目标环境选择
                        </p>
                    </div>

                    <div className="space-y-3 pt-2">
                        <Label>检测选项</Label>

                        <div className="flex items-center space-x-2">
                            <input
                                type="checkbox"
                                id="serviceDetection"
                                checked={formData.serviceDetection || false}
                                onChange={(e) => setFormData({ ...formData, serviceDetection: e.target.checked })}
                                className="rounded border-gray-300"
                            />
                            <Label htmlFor="serviceDetection" className="font-normal cursor-pointer">
                                服务版本检测 (-sV)
                            </Label>
                        </div>

                        <div className="flex items-center space-x-2">
                            <input
                                type="checkbox"
                                id="osDetection"
                                checked={formData.osDetection || false}
                                onChange={(e) => setFormData({ ...formData, osDetection: e.target.checked })}
                                className="rounded border-gray-300"
                            />
                            <Label htmlFor="osDetection" className="font-normal cursor-pointer">
                                操作系统检测 (-O，需要root权限)
                            </Label>
                        </div>

                        <div className="flex items-center space-x-2">
                            <input
                                type="checkbox"
                                id="verboseOutput"
                                checked={formData.verboseOutput || false}
                                onChange={(e) => setFormData({ ...formData, verboseOutput: e.target.checked })}
                                className="rounded border-gray-300"
                            />
                            <Label htmlFor="verboseOutput" className="font-normal cursor-pointer">
                                详细输出 (-v)
                            </Label>
                        </div>

                        <div className="flex items-center space-x-2">
                            <input
                                type="checkbox"
                                id="skipHostDiscovery"
                                checked={formData.skipHostDiscovery || false}
                                onChange={(e) => setFormData({ ...formData, skipHostDiscovery: e.target.checked })}
                                className="rounded border-gray-300"
                            />
                            <Label htmlFor="skipHostDiscovery" className="font-normal cursor-pointer">
                                禁用主机发现 (-Pn，扫描防火墙后主机)
                            </Label>
                        </div>
                    </div>
                </>
            )}
        </div>
    )
}
