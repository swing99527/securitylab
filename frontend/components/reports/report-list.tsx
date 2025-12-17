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
  MoreHorizontal,
  Eye,
  Edit,
  Download,
  Send,
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { CreateReportDialog } from "./create-report-dialog"
import { reportApi } from "@/lib/api"

const statusConfig = {
  draft: { label: "草稿", icon: FileText, color: "bg-muted text-muted-foreground" },
  pending_review: { label: "待审核", icon: Clock, color: "bg-warning/10 text-warning" },
  approved: { label: "已通过", icon: CheckCircle, color: "bg-success/10 text-success" },
  rejected: { label: "已驳回", icon: XCircle, color: "bg-destructive/10 text-destructive" },
  signed: { label: "已签章", icon: CheckCircle, color: "bg-primary/10 text-primary" },
}

export function ReportList() {
  const [reports, setReports] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")

  useEffect(() => {
    async function fetchReports() {
      try {
        const response = await reportApi.getList({
          page: 1,
          pageSize: 50,
          status: statusFilter === "all" ? undefined : statusFilter,
          search: searchTerm || undefined,
        })
        console.log("📄 Reports response:", response)

        if (response.code === 200 && response.data) {
          setReports(response.data.list || [])
        } else {
          setError("加载报告失败")
        }
      } catch (err) {
        console.error("Failed to fetch reports:", err)
        setError("加载报告时出错")
      } finally {
        setLoading(false)
      }
    }

    fetchReports()
  }, [statusFilter, searchTerm])

  const filteredReports = reports

  // Statistics
  const stats = {
    total: reports.length,
    draft: reports.filter((r) => r.status === "draft").length,
    pending: reports.filter((r) => r.status === "pending_review").length,
    approved: reports.filter((r) => r.status === "approved" || r.status === "signed").length,
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">加载报告中...</span>
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
              <p className="text-sm text-muted-foreground">全部报告</p>
              <p className="text-2xl font-bold">{stats.total}</p>
            </div>
            <FileText className="h-8 w-8 text-muted-foreground" />
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-muted-foreground">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">草稿</p>
              <p className="text-2xl font-bold">{stats.draft}</p>
            </div>
            <FileText className="h-8 w-8 text-muted-foreground" />
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-warning">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">待审核</p>
              <p className="text-2xl font-bold text-warning">{stats.pending}</p>
            </div>
            <Clock className="h-8 w-8 text-warning" />
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-success">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">已完成</p>
              <p className="text-2xl font-bold text-success">{stats.approved}</p>
            </div>
            <CheckCircle className="h-8 w-8 text-success" />
          </CardContent>
        </Card>
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="relative w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="搜索报告编号或标题..."
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
              <SelectItem value="draft">草稿</SelectItem>
              <SelectItem value="pending_review">待审核</SelectItem>
              <SelectItem value="approved">已通过</SelectItem>
              <SelectItem value="rejected">已驳回</SelectItem>
              <SelectItem value="signed">已签章</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <CreateReportDialog />
      </div>

      {/* Table */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>报告编号</TableHead>
              <TableHead>报告标题</TableHead>
              <TableHead>关联项目</TableHead>
              <TableHead>版本</TableHead>
              <TableHead>状态</TableHead>
              <TableHead>作者</TableHead>
              <TableHead>更新时间</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredReports.map((report) => {
              const status = statusConfig[report.status]
              const StatusIcon = status.icon
              return (
                <TableRow key={report.id}>
                  <TableCell className="font-mono text-sm">{report.id}</TableCell>
                  <TableCell>
                    <Link href={`/reports/${report.id}`} className="hover:text-primary transition-colors">
                      {report.title}
                    </Link>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{report.project}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{report.version}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={cn("gap-1", status.color)}>
                      <StatusIcon className="h-3 w-3" />
                      {status.label}
                    </Badge>
                  </TableCell>
                  <TableCell>{report.author}</TableCell>
                  <TableCell className="text-muted-foreground">{report.updatedAt}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link href={`/reports/${report.id}`}>
                            <Eye className="h-4 w-4 mr-2" />
                            查看
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Edit className="h-4 w-4 mr-2" />
                          编辑
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Download className="h-4 w-4 mr-2" />
                          导出PDF
                        </DropdownMenuItem>
                        {report.status === "draft" && (
                          <DropdownMenuItem>
                            <Send className="h-4 w-4 mr-2" />
                            提交审核
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </Card>
    </div>
  )
}
