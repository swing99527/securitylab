"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Camera, QrCode, Package, ArrowRight, Check, AlertCircle, Keyboard } from "lucide-react"
import { cn } from "@/lib/utils"

interface ScannedSample {
  id: string
  name: string
  model: string
  status: "in_stock" | "in_use"
  location: string
}

export function SampleScan() {
  const [scanMode, setScanMode] = useState<"camera" | "manual">("manual")
  const [scannedCode, setScannedCode] = useState("")
  const [scannedSample, setScannedSample] = useState<ScannedSample | null>(null)
  const [operationType, setOperationType] = useState<"in" | "out">("in")
  const [scanStatus, setScanStatus] = useState<"idle" | "scanning" | "success" | "error">("idle")
  const inputRef = useRef<HTMLInputElement>(null)

  // Focus input on mount for barcode scanner
  useEffect(() => {
    if (scanMode === "manual" && inputRef.current) {
      inputRef.current.focus()
    }
  }, [scanMode])

  const handleScan = () => {
    if (!scannedCode.trim()) return

    setScanStatus("scanning")

    // Simulate API lookup
    setTimeout(() => {
      if (scannedCode.includes("SPL")) {
        setScannedSample({
          id: scannedCode,
          name: "智能门锁主控板",
          model: "SL-200A",
          status: "in_stock",
          location: "样品库A-03",
        })
        setScanStatus("success")
      } else {
        setScanStatus("error")
        setScannedSample(null)
      }
    }, 500)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleScan()
    }
  }

  const handleConfirm = () => {
    // Process the operation
    alert(`${operationType === "in" ? "入库" : "出库"}操作成功: ${scannedSample?.id}`)
    setScannedCode("")
    setScannedSample(null)
    setScanStatus("idle")
    inputRef.current?.focus()
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Operation Type */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium">操作类型:</span>
            <div className="flex gap-2">
              <Button
                variant={operationType === "in" ? "default" : "outline"}
                onClick={() => setOperationType("in")}
                className={cn(operationType === "in" && "bg-success hover:bg-success/90")}
              >
                <Package className="h-4 w-4 mr-2" />
                样品入库
              </Button>
              <Button
                variant={operationType === "out" ? "default" : "outline"}
                onClick={() => setOperationType("out")}
                className={cn(operationType === "out" && "bg-primary hover:bg-primary/90")}
              >
                <ArrowRight className="h-4 w-4 mr-2" />
                样品出库
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 gap-6">
        {/* Scan Area */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <QrCode className="h-5 w-5" />
              扫码区域
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs value={scanMode} onValueChange={(v) => setScanMode(v as "camera" | "manual")}>
              <TabsList className="w-full">
                <TabsTrigger value="manual" className="flex-1">
                  <Keyboard className="h-4 w-4 mr-2" />
                  手动输入/扫码枪
                </TabsTrigger>
                <TabsTrigger value="camera" className="flex-1">
                  <Camera className="h-4 w-4 mr-2" />
                  摄像头扫码
                </TabsTrigger>
              </TabsList>

              <TabsContent value="manual" className="mt-4">
                <div className="space-y-4">
                  <div>
                    <label className="text-sm text-muted-foreground">扫描或输入样品编号</label>
                    <Input
                      ref={inputRef}
                      placeholder="SPL-2024-001"
                      value={scannedCode}
                      onChange={(e) => setScannedCode(e.target.value)}
                      onKeyDown={handleKeyDown}
                      className="mt-2 text-lg font-mono h-12"
                      autoFocus
                    />
                  </div>
                  <Button onClick={handleScan} className="w-full" disabled={!scannedCode.trim()}>
                    查询样品
                  </Button>
                  <p className="text-xs text-muted-foreground text-center">
                    提示: 使用扫码枪扫描二维码会自动填入并查询
                  </p>
                </div>
              </TabsContent>

              <TabsContent value="camera" className="mt-4">
                <div className="aspect-video bg-black rounded-lg flex items-center justify-center">
                  <div className="text-center text-white/70">
                    <Camera className="h-12 w-12 mx-auto mb-2" />
                    <p className="text-sm">摄像头预览区域</p>
                    <p className="text-xs mt-1">请将二维码对准摄像头</p>
                  </div>
                </div>
                <Button className="w-full mt-4 bg-transparent" variant="outline">
                  启用摄像头
                </Button>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Result Area */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">扫描结果</CardTitle>
          </CardHeader>
          <CardContent>
            {scanStatus === "idle" && (
              <div className="h-64 flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <QrCode className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">等待扫描...</p>
                </div>
              </div>
            )}

            {scanStatus === "scanning" && (
              <div className="h-64 flex items-center justify-center">
                <div className="text-center">
                  <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">查询中...</p>
                </div>
              </div>
            )}

            {scanStatus === "error" && (
              <div className="h-64 flex items-center justify-center">
                <div className="text-center text-destructive">
                  <AlertCircle className="h-12 w-12 mx-auto mb-2" />
                  <p className="font-medium">未找到样品</p>
                  <p className="text-sm mt-1">请检查编号是否正确</p>
                </div>
              </div>
            )}

            {scanStatus === "success" && scannedSample && (
              <div className="space-y-4">
                <div className="p-4 bg-success/10 border border-success/20 rounded-lg">
                  <div className="flex items-center gap-2 text-success">
                    <Check className="h-5 w-5" />
                    <span className="font-medium">样品已识别</span>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">样品编号</span>
                    <span className="font-mono font-medium">{scannedSample.id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">样品名称</span>
                    <span className="font-medium">{scannedSample.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">型号</span>
                    <span>{scannedSample.model}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">当前状态</span>
                    <Badge
                      className={cn(
                        scannedSample.status === "in_stock"
                          ? "bg-success/10 text-success"
                          : "bg-primary/10 text-primary",
                      )}
                    >
                      {scannedSample.status === "in_stock" ? "在库" : "使用中"}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">当前位置</span>
                    <span>{scannedSample.location}</span>
                  </div>
                </div>

                {operationType === "out" && (
                  <div className="pt-4 border-t space-y-3">
                    <div>
                      <label className="text-sm font-medium">领用人</label>
                      <Select>
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="选择领用人" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="zhang">张工程师</SelectItem>
                          <SelectItem value="wang">王工程师</SelectItem>
                          <SelectItem value="li">李工程师</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="text-sm font-medium">目标位置</label>
                      <Select>
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="选择目标位置" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="lab-a">屏蔽室A</SelectItem>
                          <SelectItem value="lab-b">屏蔽室B</SelectItem>
                          <SelectItem value="test-1">测试台1</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="text-sm font-medium">用途</label>
                      <Textarea placeholder="请输入领用用途..." className="mt-1" />
                    </div>
                  </div>
                )}

                <Button
                  className={cn("w-full", operationType === "in" ? "bg-success hover:bg-success/90" : "")}
                  onClick={handleConfirm}
                >
                  确认{operationType === "in" ? "入库" : "出库"}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Operations */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">最近操作记录</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[
              { id: "SPL-2024-003", name: "工业控制器", type: "out", time: "10:15", operator: "王工程师" },
              { id: "SPL-2024-002", name: "车载网关模块", type: "in", time: "09:30", operator: "李管理员" },
            ].map((record, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Badge
                    className={cn(record.type === "in" ? "bg-success/10 text-success" : "bg-primary/10 text-primary")}
                  >
                    {record.type === "in" ? "入库" : "出库"}
                  </Badge>
                  <span className="font-mono text-sm">{record.id}</span>
                  <span className="text-sm">{record.name}</span>
                </div>
                <div className="text-sm text-muted-foreground">
                  {record.operator} | {record.time}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
