"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { QrCode, Package, Save, Printer, Camera, Upload } from "lucide-react"

export function SampleInbound() {
  const [generatedId, setGeneratedId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    model: "",
    manufacturer: "",
    serialNumber: "",
    category: "",
    voltage: "",
    interface: "",
    firmware: "",
    location: "",
    notes: "",
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Generate sample ID
    const id = `SPL-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 1000)).padStart(3, "0")}`
    setGeneratedId(id)
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="grid grid-cols-3 gap-6">
        {/* Form */}
        <div className="col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                样品入库登记
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Basic Info */}
                <div className="space-y-4">
                  <h3 className="text-sm font-medium text-muted-foreground">基本信息</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">样品名称 *</Label>
                      <Input
                        id="name"
                        placeholder="请输入样品名称"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="model">型号 *</Label>
                      <Input
                        id="model"
                        placeholder="请输入型号"
                        value={formData.model}
                        onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="manufacturer">制造商 *</Label>
                      <Input
                        id="manufacturer"
                        placeholder="请输入制造商"
                        value={formData.manufacturer}
                        onChange={(e) => setFormData({ ...formData, manufacturer: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="serialNumber">序列号</Label>
                      <Input
                        id="serialNumber"
                        placeholder="请输入序列号"
                        value={formData.serialNumber}
                        onChange={(e) => setFormData({ ...formData, serialNumber: e.target.value })}
                      />
                    </div>
                  </div>
                </div>

                {/* Technical Specs */}
                <div className="space-y-4">
                  <h3 className="text-sm font-medium text-muted-foreground">技术规格</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="category">产品类别</Label>
                      <Select
                        value={formData.category}
                        onValueChange={(v) => setFormData({ ...formData, category: v })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="选择类别" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="iot">IoT设备</SelectItem>
                          <SelectItem value="industrial">工业控制器</SelectItem>
                          <SelectItem value="automotive">车载设备</SelectItem>
                          <SelectItem value="medical">医疗设备</SelectItem>
                          <SelectItem value="consumer">消费电子</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="voltage">工作电压</Label>
                      <Input
                        id="voltage"
                        placeholder="如: DC 5V"
                        value={formData.voltage}
                        onChange={(e) => setFormData({ ...formData, voltage: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="interface">接口类型</Label>
                      <Input
                        id="interface"
                        placeholder="如: UART/SPI/I2C"
                        value={formData.interface}
                        onChange={(e) => setFormData({ ...formData, interface: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="firmware">固件版本</Label>
                      <Input
                        id="firmware"
                        placeholder="如: v1.0.0"
                        value={formData.firmware}
                        onChange={(e) => setFormData({ ...formData, firmware: e.target.value })}
                      />
                    </div>
                  </div>
                </div>

                {/* Storage Location */}
                <div className="space-y-4">
                  <h3 className="text-sm font-medium text-muted-foreground">存放信息</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="location">存放位置 *</Label>
                      <Select
                        value={formData.location}
                        onValueChange={(v) => setFormData({ ...formData, location: v })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="选择存放位置" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="A-01">样品库 A-01</SelectItem>
                          <SelectItem value="A-02">样品库 A-02</SelectItem>
                          <SelectItem value="A-03">样品库 A-03</SelectItem>
                          <SelectItem value="B-01">样品库 B-01</SelectItem>
                          <SelectItem value="B-02">样品库 B-02</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                {/* Images */}
                <div className="space-y-4">
                  <h3 className="text-sm font-medium text-muted-foreground">样品图片</h3>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="aspect-video bg-muted/50 rounded-lg border-2 border-dashed flex flex-col items-center justify-center cursor-pointer hover:bg-muted transition-colors">
                      <Upload className="h-6 w-6 text-muted-foreground mb-1" />
                      <span className="text-xs text-muted-foreground">上传图片</span>
                    </div>
                    <div className="aspect-video bg-muted/50 rounded-lg border-2 border-dashed flex flex-col items-center justify-center cursor-pointer hover:bg-muted transition-colors">
                      <Camera className="h-6 w-6 text-muted-foreground mb-1" />
                      <span className="text-xs text-muted-foreground">拍照</span>
                    </div>
                  </div>
                </div>

                {/* Notes */}
                <div className="space-y-2">
                  <Label htmlFor="notes">备注</Label>
                  <Textarea
                    id="notes"
                    placeholder="请输入备注信息..."
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  />
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                  <Button type="submit" className="flex-1">
                    <Save className="h-4 w-4 mr-2" />
                    登记入库
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* QR Code Preview */}
        <div>
          <Card className="sticky top-4">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <QrCode className="h-5 w-5" />
                二维码预览
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center">
              {generatedId ? (
                <>
                  <div className="w-48 h-48 bg-white p-4 rounded-lg border">
                    <img
                      src={`/qr-code-.jpg?height=160&width=160&query=QR Code ${generatedId}`}
                      alt="Generated QR Code"
                      className="w-full h-full"
                    />
                  </div>
                  <p className="text-lg font-mono font-bold mt-4">{generatedId}</p>
                  <p className="text-sm text-muted-foreground mt-1">样品编号</p>
                  <div className="flex gap-2 mt-4 w-full">
                    <Button variant="outline" size="sm" className="flex-1 bg-transparent">
                      <Printer className="h-4 w-4 mr-1" />
                      打印标签
                    </Button>
                  </div>
                </>
              ) : (
                <div className="w-48 h-48 bg-muted rounded-lg flex items-center justify-center">
                  <div className="text-center text-muted-foreground">
                    <QrCode className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">提交后生成</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
