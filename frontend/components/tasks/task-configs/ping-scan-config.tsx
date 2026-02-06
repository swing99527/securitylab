"use client"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface PingScanConfigProps {
    formData: any
    setFormData: (data: any) => void
}

export function PingScanConfig({ formData, setFormData }: PingScanConfigProps) {
    return (
        <div className="space-y-4 p-4 border rounded-lg bg-muted/20">
            <div className="flex items-center gap-2 mb-4">
                <div className="h-8 w-8 rounded-full bg-blue-500/10 flex items-center justify-center">
                    <span className="text-blue-500 text-lg">📡</span>
                </div>
                <div>
                    <h3 className="font-semibold">Ping扫描配置</h3>
                    <p className="text-xs text-muted-foreground">测试目标网络连通性</p>
                </div>
            </div>

            <div className="space-y-2">
                <Label htmlFor="targetIp">
                    目标IP/域名 <span className="text-destructive">*</span>
                </Label>
                <Input
                    id="targetIp"
                    placeholder="例如: 8.8.8.8 或 google.com"
                    value={formData.targetIp || ''}
                    onChange={(e) => setFormData({ ...formData, targetIp: e.target.value })}
                />
                <p className="text-xs text-muted-foreground">
                    输入要测试连通性的目标IP地址或域名
                </p>
            </div>

            <div className="space-y-2">
                <Label htmlFor="count">Ping次数</Label>
                <Input
                    id="count"
                    type="number"
                    min="1"
                    max="10"
                    value={formData.count || 4}
                    onChange={(e) => setFormData({ ...formData, count: parseInt(e.target.value) })}
                />
                <p className="text-xs text-muted-foreground">
                    发送ICMP请求的次数（1-10次）
                </p>
            </div>
        </div>
    )
}
