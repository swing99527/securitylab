"use client"

import { useState, useCallback } from "react"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Upload, FileIcon, XIcon, AlertTriangle } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"

interface FirmwareConfigProps {
    formData: any
    setFormData: (data: any) => void
}

export function FirmwareConfig({ formData, setFormData }: FirmwareConfigProps) {
    const [uploadedFile, setUploadedFile] = useState<File | null>(null)
    const [uploading, setUploading] = useState(false)
    const [uploadError, setUploadError] = useState<string | null>(null)
    const [dragActive, setDragActive] = useState(false)

    const analysisDepths = [
        { value: 'quick', label: '快速扫描', duration: '5-10分钟', description: '基础提取和快速扫描' },
        { value: 'standard', label: '标准分析', duration: '15-30分钟', description: '完整文件系统扫描与检测' },
        { value: 'deep', label: '深度分析', duration: '30-60分钟', description: '使用所有模块进行全面分析' }
    ]

    const scanTypes = [
        { id: 'strings', label: '字符串提取', description: '从二进制文件中提取URL、IP地址、邮箱' },
        { id: 'credentials', label: '凭证检测', description: '查找硬编码的密码、API密钥、令牌' },
        { id: 'crypto', label: '加密材料', description: '扫描私钥、证书' },
        { id: 'vulnerabilities', label: '已知漏洞', description: '与CVE数据库匹配' }
    ]

    const handleDrag = useCallback((e: React.DragEvent) => {
        e.preventDefault()
        e.stopPropagation()
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true)
        } else if (e.type === "dragleave") {
            setDragActive(false)
        }
    }, [])

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault()
        e.stopPropagation()
        setDragActive(false)

        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFileSelection(e.dataTransfer.files[0])
        }
    }, [])

    const handleFileSelection = async (file: File) => {
        setUploadError(null)

        const allowedExtensions = ['.bin', '.img', '.zip', '.tar', '.gz', '.fw', '.elf']
        const fileExt = '.' + file.name.split('.').pop()?.toLowerCase()

        if (!allowedExtensions.includes(fileExt)) {
            setUploadError(`Unsupported file type: ${fileExt}. Allowed: ${allowedExtensions.join(', ')}`)
            return
        }

        const maxSize = 500 * 1024 * 1024
        if (file.size > maxSize) {
            setUploadError(`File too large: ${(file.size / (1024 * 1024)).toFixed(2)}MB. Max: 500MB`)
            return
        }

        setUploadedFile(file)
        setUploading(true)

        try {
            const formDataUpload = new FormData()
            formDataUpload.append('file', file)

            const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000'
            const response = await fetch(`${apiBaseUrl}/api/v1/tasks/firmware/upload`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: formDataUpload
            })

            if (!response.ok) {
                throw new Error('Upload failed')
            }

            const result = await response.json()

            setFormData((prev: any) => ({
                ...prev,
                firmware_file: result.data.file_path,
                firmware_filename: file.name,
                firmware_size: file.size
            }))

        } catch (error) {
            setUploadError('Upload failed. Please try again.')
            setUploadedFile(null)
        } finally {
            setUploading(false)
        }
    }

    const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            handleFileSelection(e.target.files[0])
        }
    }

    const removeFile = () => {
        setUploadedFile(null)
        setUploadError(null)
        setFormData((prev: any) => ({
            ...prev,
            firmware_file: undefined,
            firmware_filename: undefined,
            firmware_size: undefined
        }))
    }

    const handleDepthChange = (value: string) => {
        setFormData((prev: any) => ({
            ...prev,
            analysis_depth: value
        }))
    }

    const handleScanTypeToggle = (scanId: string, checked: boolean) => {
        const currentTypes = formData.scan_types || ['strings', 'credentials', 'crypto']
        const newTypes = checked
            ? [...currentTypes, scanId]
            : currentTypes.filter((t: string) => t !== scanId)

        setFormData((prev: any) => ({
            ...prev,
            scan_types: newTypes
        }))
    }

    return (
        <div className="space-y-6">
            <div className="space-y-2">
                <Label className="flex items-center gap-2">
                    <Upload className="h-4 w-4" />
                    固件文件
                    <Badge variant="outline" className="ml-auto">必填</Badge>
                </Label>

                {!uploadedFile ? (
                    <div
                        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${dragActive ? 'border-primary bg-primary/5' : 'border-border'
                            }`}
                        onDragEnter={handleDrag}
                        onDragLeave={handleDrag}
                        onDragOver={handleDrag}
                        onDrop={handleDrop}
                    >
                        <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                        <p className="text-sm font-medium mb-1">
                            将固件文件拖到此处或点击浏览
                        </p>
                        <p className="text-xs text-muted-foreground mb-4">
                            支持格式: .bin, .img, .zip, .tar, .gz, .fw, .elf (最大500MB)
                        </p>
                        <input
                            type="file"
                            className="hidden"
                            id="firmware-upload"
                            accept=".bin,.img,.zip,.tar,.gz,.fw,.elf"
                            onChange={handleFileInputChange}
                        />
                        <label
                            htmlFor="firmware-upload"
                            className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 cursor-pointer"
                        >
                            选择文件
                        </label>
                    </div>
                ) : (
                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                                <FileIcon className="h-10 w-10 text-primary" />
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium truncate">{uploadedFile.name}</p>
                                    <p className="text-xs text-muted-foreground">
                                        {(uploadedFile.size / (1024 * 1024)).toFixed(2)} MB
                                    </p>
                                    {uploading && (
                                        <p className="text-xs text-primary">上传中...</p>
                                    )}
                                </div>
                                <button
                                    onClick={removeFile}
                                    className="p-1 hover:bg-destructive/10 rounded"
                                    disabled={uploading}
                                >
                                    <XIcon className="h-4 w-4 text-destructive" />
                                </button>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {uploadError && (
                    <div className="flex items-center gap-2 text-sm text-destructive">
                        <AlertTriangle className="h-4 w-4" />
                        {uploadError}
                    </div>
                )}
            </div>

            <div className="space-y-2">
                <Label>分析深度</Label>
                <Select
                    value={formData.analysis_depth || 'standard'}
                    onValueChange={handleDepthChange}
                >
                    <SelectTrigger>
                        <SelectValue placeholder="选择分析深度" />
                    </SelectTrigger>
                    <SelectContent>
                        {analysisDepths.map((depth) => (
                            <SelectItem key={depth.value} value={depth.value}>
                                <div className="flex items-center gap-2">
                                    <span className="font-medium">{depth.label}</span>
                                    <Badge variant="outline" className="text-xs">{depth.duration}</Badge>
                                </div>
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            <div className="space-y-3">
                <Label>扫描类型</Label>
                <div className="space-y-3">
                    {scanTypes.map((scanType) => (
                        <div key={scanType.id} className="flex items-start space-x-3">
                            <Checkbox
                                id={scanType.id}
                                checked={(formData.scan_types || ['strings', 'credentials', 'crypto']).includes(scanType.id)}
                                onCheckedChange={(checked) => handleScanTypeToggle(scanType.id, checked as boolean)}
                            />
                            <div className="grid gap-1.5 leading-none">
                                <label
                                    htmlFor={scanType.id}
                                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                                >
                                    {scanType.label}
                                </label>
                                <p className="text-sm text-muted-foreground">
                                    {scanType.description}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <Card className="border-yellow-500/50 bg-yellow-500/5">
                <CardContent className="p-4">
                    <div className="flex gap-2">
                        <AlertTriangle className="h-5 w-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                        <div className="text-sm">
                            <p className="font-medium text-yellow-700 dark:text-yellow-500 mb-1">
                                重要说明
                            </p>
                            <ul className="text-muted-foreground space-y-1 list-disc list-inside">
                                <li>固件分析可能需要5-60分钟，具体取决于文件大小和深度</li>
                                <li>上传的文件将在24小时后自动删除</li>
                                <li>深度分析可能会消耗大量系统资源</li>
                            </ul>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
