"use client"

import { useState, useEffect } from "react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { X, Plus, Sparkles } from "lucide-react"

interface ReportMetadata {
    // Client & Testing
    client_company?: string
    client_contact?: string
    client_address?: string
    testing_organization?: string

    // Product
    product_name?: string
    product_model?: string
    manufacturer?: string
    manufacturer_address?: string

    // Sample Info
    sample_info?: {
        serial_number?: string
        firmware_version?: string
        hardware_version?: string
        quantity?: number
        reception_date?: string
        condition?: string
    }

    // Test Standards
    test_standards?: Array<{ standard: string; title: string }>
    test_scope?: string
    test_methodology?: string
    test_limitations?: string
    test_period_start?: string
    test_period_end?: string

    // Conclusion
    security_rating?: string
    compliance_status?: string
    certification_recommendation?: string
    conclusion?: string
}

interface ReportMetadataFormProps {
    projectData?: any
    initialData?: ReportMetadata
    autoFilledFields?: Set<string>
    onChange: (data: ReportMetadata) => void
}

export function ReportMetadataForm({
    projectData,
    initialData,
    autoFilledFields = new Set(),
    onChange
}: ReportMetadataFormProps) {
    const [metadata, setMetadata] = useState<ReportMetadata>(initialData || {})
    const [newStandard, setNewStandard] = useState({ standard: "", title: "" })

    // Auto-fill from project data
    useEffect(() => {
        if (projectData && !initialData) {
            const autoFilled: ReportMetadata = {
                client_company: projectData.client || "",
                testing_organization: "汕头人工智能实验室", // Default
                product_name: projectData.name || "",
                test_standards: projectData.standard ? [{
                    standard: projectData.standard,
                    title: ""
                }] : []
            }
            setMetadata(autoFilled)
            onChange(autoFilled)
        }
    }, [projectData])

    const updateField = (field: string, value: any) => {
        const updated = { ...metadata, [field]: value }
        setMetadata(updated)
        onChange(updated)
    }

    // Helper to check if a field is auto-filled
    const isAutoFilled = (field: string) => autoFilledFields.has(field)

    const updateSampleField = (field: string, value: any) => {
        const updated = {
            ...metadata,
            sample_info: { ...metadata.sample_info, [field]: value }
        }
        setMetadata(updated)
        onChange(updated)
    }

    const addStandard = () => {
        if (!newStandard.standard) return
        const updated = {
            ...metadata,
            test_standards: [...(metadata.test_standards || []), newStandard]
        }
        setMetadata(updated)
        onChange(updated)
        setNewStandard({ standard: "", title: "" })
    }

    const removeStandard = (index: number) => {
        const updated = {
            ...metadata,
            test_standards: metadata.test_standards?.filter((_, i) => i !== index)
        }
        setMetadata(updated)
        onChange(updated)
    }

    return (
        <div className="space-y-6">
            {/* Client & Testing Organization */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-base">客户与检测机构信息</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label className="flex items-center gap-2">
                                委托单位
                                {isAutoFilled('client_company') && (
                                    <Badge variant="secondary" className="text-xs">
                                        <Sparkles className="h-3 w-3 mr-1" />
                                        自动
                                    </Badge>
                                )}
                            </Label>
                            <Input
                                value={metadata.client_company || ""}
                                onChange={(e) => updateField("client_company", e.target.value)}
                                placeholder="例如: 某某科技有限公司"
                                className={isAutoFilled('client_company') ? "bg-blue-50 dark:bg-blue-950/30" : ""}
                            />
                        </div>
                        <div>
                            <Label>联系人</Label>
                            <Input
                                value={metadata.client_contact || ""}
                                onChange={(e) => updateField("client_contact", e.target.value)}
                                placeholder="例如: 张三"
                            />
                        </div>
                    </div>
                    <div>
                        <Label>委托单位地址</Label>
                        <Input
                            value={metadata.client_address || ""}
                            onChange={(e) => updateField("client_address", e.target.value)}
                            placeholder="完整地址"
                        />
                    </div>
                    <div>
                        <Label>检测机构</Label>
                        <Input
                            value={metadata.testing_organization || ""}
                            onChange={(e) => updateField("testing_organization", e.target.value)}
                            placeholder="执行检测的机构名称"
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Product Information */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-base">产品信息</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label className="flex items-center gap-2">
                                产品名称
                                {isAutoFilled('product_name') && (
                                    <Badge variant="secondary" className="text-xs">
                                        <Sparkles className="h-3 w-3 mr-1" />
                                        自动
                                    </Badge>
                                )}
                            </Label>
                            <Input
                                value={metadata.product_name || ""}
                                onChange={(e) => updateField("product_name", e.target.value)}
                                placeholder="例如: 智能门锁"
                                className={isAutoFilled('product_name') ? "bg-blue-50 dark:bg-blue-950/30" : ""}
                            />
                        </div>
                        <div>
                            <Label className="flex items-center gap-2">
                                产品型号
                                {isAutoFilled('product_model') && (
                                    <Badge variant="secondary" className="text-xs">
                                        <Sparkles className="h-3 w-3 mr-1" />
                                        自动
                                    </Badge>
                                )}
                            </Label>
                            <Input
                                value={metadata.product_model || ""}
                                onChange={(e) => updateField("product_model", e.target.value)}
                                placeholder="例如: SL-X1-2024"
                                className={isAutoFilled('product_model') ? "bg-blue-50 dark:bg-blue-950/30" : ""}
                            />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label className="flex items-center gap-2">
                                制造商
                                {isAutoFilled('manufacturer') && (
                                    <Badge variant="secondary" className="text-xs">
                                        <Sparkles className="h-3 w-3 mr-1" />
                                        自动
                                    </Badge>
                                )}
                            </Label>
                            <Input
                                value={metadata.manufacturer || ""}
                                onChange={(e) => updateField("manufacturer", e.target.value)}
                                placeholder="制造商名称"
                                className={isAutoFilled('manufacturer') ? "bg-blue-50 dark:bg-blue-950/30" : ""}
                            />
                        </div>
                        <div>
                            <Label>制造商地址</Label>
                            <Input
                                value={metadata.manufacturer_address || ""}
                                onChange={(e) => updateField("manufacturer_address", e.target.value)}
                                placeholder="制造商地址"
                            />
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Sample Information */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-base">样品信息</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-3 gap-4">
                        <div>
                            <Label>序列号</Label>
                            <Input
                                value={metadata.sample_info?.serial_number || ""}
                                onChange={(e) => updateSampleField("serial_number", e.target.value)}
                                placeholder="SN20241225001"
                            />
                        </div>
                        <div>
                            <Label>固件版本</Label>
                            <Input
                                value={metadata.sample_info?.firmware_version || ""}
                                onChange={(e) => updateSampleField("firmware_version", e.target.value)}
                                placeholder="v2.0.1"
                            />
                        </div>
                        <div>
                            <Label>硬件版本</Label>
                            <Input
                                value={metadata.sample_info?.hardware_version || ""}
                                onChange={(e) => updateSampleField("hardware_version", e.target.value)}
                                placeholder="HW1.0"
                            />
                        </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                        <div>
                            <Label>样品数量</Label>
                            <Input
                                type="number"
                                value={metadata.sample_info?.quantity || ""}
                                onChange={(e) => updateSampleField("quantity", parseInt(e.target.value) || 0)}
                                placeholder="1"
                            />
                        </div>
                        <div>
                            <Label>接收日期</Label>
                            <Input
                                type="date"
                                value={metadata.sample_info?.reception_date || ""}
                                onChange={(e) => updateSampleField("reception_date", e.target.value)}
                            />
                        </div>
                        <div>
                            <Label>样品状态</Label>
                            <Input
                                value={metadata.sample_info?.condition || ""}
                                onChange={(e) => updateSampleField("condition", e.target.value)}
                                placeholder="例如: 全新未拆封"
                            />
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Test Standards */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-base">测试标准</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex flex-wrap gap-2 mb-4">
                        {metadata.test_standards?.map((std, idx) => (
                            <Badge key={idx} variant="secondary" className="px-3 py-1">
                                <span className="font-medium">{std.standard}</span>
                                {std.title && <span className="ml-1 text-muted-foreground">: {std.title}</span>}
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="ml-2 h-4 w-4 p-0"
                                    onClick={() => removeStandard(idx)}
                                >
                                    <X className="h-3 w-3" />
                                </Button>
                            </Badge>
                        ))}
                    </div>
                    <div className="flex gap-2">
                        <Input
                            placeholder="标准编号 (例如: GB/T 36951-2018)"
                            value={newStandard.standard}
                            onChange={(e) => setNewStandard({ ...newStandard, standard: e.target.value })}
                            className="flex-1"
                        />
                        <Input
                            placeholder="标准名称 (可选)"
                            value={newStandard.title}
                            onChange={(e) => setNewStandard({ ...newStandard, title: e.target.value })}
                            className="flex-1"
                        />
                        <Button onClick={addStandard} size="sm">
                            <Plus className="h-4 w-4 mr-1" />
                            添加
                        </Button>
                    </div>
                    <div className="text-xs text-muted-foreground">
                        常用标准: GB/T 36951-2018, ISO/IEC 62443, ETSI EN 303 645
                    </div>
                </CardContent>
            </Card>

            {/* Test Scope & Methodology */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-base">测试范围与方法</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div>
                        <Label className="flex items-center gap-2">
                            测试范围
                            {isAutoFilled('test_scope') && (
                                <Badge variant="secondary" className="text-xs">
                                    <Sparkles className="h-3 w-3 mr-1" />
                                    自动
                                </Badge>
                            )}
                        </Label>
                        <Textarea
                            value={metadata.test_scope || ""}
                            onChange={(e) => updateField("test_scope", e.target.value)}
                            placeholder="描述测试覆盖的系统组件和功能范围"
                            rows={3}
                            className={isAutoFilled('test_scope') ? "bg-blue-50 dark:bg-blue-950/30" : ""}
                        />
                    </div>
                    <div>
                        <Label className="flex items-center gap-2">
                            测试方法
                            {isAutoFilled('test_methodology') && (
                                <Badge variant="secondary" className="text-xs">
                                    <Sparkles className="h-3 w-3 mr-1" />
                                    自动
                                </Badge>
                            )}
                        </Label>
                        <Textarea
                            value={metadata.test_methodology || ""}
                            onChange={(e) => updateField("test_methodology", e.target.value)}
                            placeholder="描述采用的测试方法和技术"
                            rows={3}
                            className={isAutoFilled('test_methodology') ? "bg-blue-50 dark:bg-blue-950/30" : ""}
                        />
                    </div>
                    <div>
                        <Label>测试限制</Label>
                        <Textarea
                            value={metadata.test_limitations || ""}
                            onChange={(e) => updateField("test_limitations", e.target.value)}
                            placeholder="说明测试的限制条件和未覆盖的内容"
                            rows={2}
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label className="flex items-center gap-2">
                                测试开始时间
                                {isAutoFilled('test_period_start') && (
                                    <Badge variant="secondary" className="text-xs">
                                        <Sparkles className="h-3 w-3 mr-1" />
                                        自动
                                    </Badge>
                                )}
                            </Label>
                            <Input
                                type="datetime-local"
                                value={metadata.test_period_start || ""}
                                onChange={(e) => updateField("test_period_start", e.target.value)}
                                className={isAutoFilled('test_period_start') ? "bg-blue-50 dark:bg-blue-950/30" : ""}
                            />
                        </div>
                        <div>
                            <Label className="flex items-center gap-2">
                                测试结束时间
                                {isAutoFilled('test_period_end') && (
                                    <Badge variant="secondary" className="text-xs">
                                        <Sparkles className="h-3 w-3 mr-1" />
                                        自动
                                    </Badge>
                                )}
                            </Label>
                            <Input
                                type="datetime-local"
                                value={metadata.test_period_end || ""}
                                onChange={(e) => updateField("test_period_end", e.target.value)}
                                className={isAutoFilled('test_period_end') ? "bg-blue-50 dark:bg-blue-950/30" : ""}
                            />
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Conclusion */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-base">测试结论</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label className="flex items-center gap-2">
                                安全评级
                                {isAutoFilled('security_rating') && (
                                    <Badge variant="secondary" className="text-xs">
                                        <Sparkles className="h-3 w-3 mr-1" />
                                        自动计算
                                    </Badge>
                                )}
                            </Label>
                            <select
                                className={`flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ${isAutoFilled('security_rating') ? 'bg-blue-50 dark:bg-blue-950/30' : ''}`}
                                value={metadata.security_rating || ""}
                                onChange={(e) => updateField("security_rating", e.target.value)}
                            >
                                <option value="">请选择</option>
                                <option value="excellent">优秀</option>
                                <option value="good">良好</option>
                                <option value="fair">中等</option>
                                <option value="poor">较差</option>
                            </select>
                        </div>
                        <div>
                            <Label className="flex items-center gap-2">
                                合规状态
                                {isAutoFilled('compliance_status') && (
                                    <Badge variant="secondary" className="text-xs">
                                        <Sparkles className="h-3 w-3 mr-1" />
                                        自动计算
                                    </Badge>
                                )}
                            </Label>
                            <select
                                className={`flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ${isAutoFilled('compliance_status') ? 'bg-blue-50 dark:bg-blue-950/30' : ''}`}
                                value={metadata.compliance_status || ""}
                                onChange={(e) => updateField("compliance_status", e.target.value)}
                            >
                                <option value="">请选择</option>
                                <option value="pass">通过</option>
                                <option value="conditional_pass">有条件通过</option>
                                <option value="fail">不通过</option>
                            </select>
                        </div>
                    </div>
                    <div>
                        <Label>测试结论</Label>
                        <Textarea
                            value={metadata.conclusion || ""}
                            onChange={(e) => updateField("conclusion", e.target.value)}
                            placeholder="总结测试结果和发现"
                            rows={3}
                        />
                    </div>
                    <div>
                        <Label>认证建议</Label>
                        <Textarea
                            value={metadata.certification_recommendation || ""}
                            onChange={(e) => updateField("certification_recommendation", e.target.value)}
                            placeholder="提供认证相关的建议"
                            rows={2}
                        />
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
