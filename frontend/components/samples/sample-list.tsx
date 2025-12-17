"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import {
  Search,
  Filter,
  Plus,
  MoreHorizontal,
  Eye,
  QrCode,
  PackageOpen,
  Package,
  History,
  Trash2,
  Archive,
  ArrowRightLeft,
  Loader2,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { sampleApi } from "@/lib/api"

interface Sample {
  id: string
  code: string
  name: string
  model: string
  manufacturer: string
  status: "in_stock" | "in_use" | "returned" | "scrapped"
  location: string
  projectId?: string
  createdAt: string
  updatedAt: string
}

const statusConfig = {
  in_stock: { label: "在库", color: "bg-success/10 text-success border-success/20" },
  in_use: { label: "使用中", color: "bg-primary/10 text-primary border-primary/20" },
  returned: { label: "待归还", color: "bg-warning/10 text-warning border-warning/20" },
  scrapped: { label: "已报废", color: "bg-muted text-muted-foreground" },
}

export function SampleList() {
  const [samples, setSamples] = useState<Sample[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")

  useEffect(() => {
    async function fetchSamples() {
      try {
        const response = await sampleApi.getList({ page: 1, pageSize: 100 })
        console.log("📦 Samples response:", response)

        if (response.code === 200 && response.data) {
          setSamples(response.data.list || [])
        } else {
          setError("加载样品失败")
        }
      } catch (err) {
        console.error("Failed to fetch samples:", err)
        setError("加载样品时出错")
      } finally {
        setLoading(false)
      }
    }

    fetchSamples()
  }, [])

  const filteredSamples = samples.filter((sample) => {
    const matchesSearch =
      sample.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sample.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sample.model?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "all" || sample.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const stats = {
    total: samples.length,
    inStock: samples.filter((s) => s.status === "in_stock").length,
    inUse: samples.filter((s) => s.status === "in_use").length,
    returned: samples.filter((s) => s.status === "returned").length,
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">加载样品中...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12 text-destructive">
        <p>{error}</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">样品总数</p>
              <p className="text-2xl font-bold">{stats.total}</p>
            </div>
            <Package className="h-8 w-8 text-muted-foreground" />
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-success">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">在库</p>
              <p className="text-2xl font-bold text-success">{stats.inStock}</p>
            </div>
            <Archive className="h-8 w-8 text-success" />
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-primary">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">使用中</p>
              <p className="text-2xl font-bold text-primary">{stats.inUse}</p>
            </div>
            <PackageOpen className="h-8 w-8 text-primary" />
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-warning">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">待归还</p>
              <p className="text-2xl font-bold text-warning">{stats.returned}</p>
            </div>
            <ArrowRightLeft className="h-8 w-8 text-warning" />
          </CardContent>
        </Card>
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="relative w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="搜索样品编号、名称或型号..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-32">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="状态" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部状态</SelectItem>
              <SelectItem value="in_stock">在库</SelectItem>
              <SelectItem value="in_use">使用中</SelectItem>
              <SelectItem value="returned">待归还</SelectItem>
              <SelectItem value="scrapped">已报废</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" asChild>
            <Link href="/samples/scan">
              <QrCode className="h-4 w-4 mr-2" />
              扫码出入库
            </Link>
          </Button>
          <Button asChild>
            <Link href="/samples/new">
              <Plus className="h-4 w-4 mr-2" />
              新增样品
            </Link>
          </Button>
        </div>
      </div>

      {/* Table */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>样品编号</TableHead>
              <TableHead>样品名称</TableHead>
              <TableHead>型号</TableHead>
              <TableHead>制造商</TableHead>
              <TableHead>状态</TableHead>
              <TableHead>当前位置</TableHead>
              <TableHead>持有人</TableHead>
              <TableHead>更新时间</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredSamples.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                  {searchTerm || statusFilter !== "all" ? "没有匹配的样品" : "暂无样品数据"}
                </TableCell>
              </TableRow>
            ) : (
              filteredSamples.map((sample) => {
                const status = statusConfig[sample.status]
                return (
                  <TableRow key={sample.id}>
                    <TableCell className="font-mono text-sm">{sample.code}</TableCell>
                    <TableCell>
                      <Link href={`/samples/${sample.id}`} className="hover:text-primary transition-colors">
                        {sample.name}
                      </Link>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{sample.model}</TableCell>
                    <TableCell className="text-muted-foreground">{sample.manufacturer}</TableCell>
                    <TableCell>
                      <Badge className={cn(status.color)}>{status.label}</Badge>
                    </TableCell>
                    <TableCell>{sample.location}</TableCell>
                    <TableCell>-</TableCell>
                    <TableCell className="text-muted-foreground">{new Date(sample.updatedAt).toLocaleDateString('zh-CN')}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link href={`/samples/${sample.id}`}>
                              <Eye className="h-4 w-4 mr-2" />
                              查看详情
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <History className="h-4 w-4 mr-2" />
                            流转记录
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <QrCode className="h-4 w-4 mr-2" />
                            打印二维码
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive">
                            <Trash2 className="h-4 w-4 mr-2" />
                            报废
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  )
}
