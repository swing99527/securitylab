"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import dynamic from "next/dynamic"
import { Card, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"
import {
  ChevronRight,
  ChevronDown,
  ChevronLeft,
  FileText,
  MessageSquare,
  Check,
  X,
  Edit3,
  Download,
  Lock,
  Send,
  Eye,
  FileCheck,
  AlertCircle,
  History,
  Loader2,
  ArrowLeft,
  Clock,
  User,
  Calendar,
  EyeOff,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { reportApi } from "@/lib/api"
import type { Report, ReportSection } from "@/lib/api/types"
import { useToast } from "@/hooks/use-toast"

// 动态导入 SectionEditor，禁用 SSR
const SectionEditor = dynamic(
  () => import('./section-editor').then(mod => ({ default: mod.SectionEditor })),
  {
    ssr: false,
    loading: () => <div className="p-4 text-center">加载编辑器...</div>
  }
)

// 批注接口（保留Mock）
interface Comment {
  id: string
  sectionId: string
  author: string
  avatar?: string
  content: string
  timestamp: Date
  resolved: boolean
  replies?: {
    author: string
    content: string
    timestamp: Date
  }[]
}

const mockComments: Comment[] = [
  {
    id: "c1",
    sectionId: "results-access",
    author: "李审核员",
    content: "此处截图不够清晰，请重新截取测试结果截图",
    timestamp: new Date(Date.now() - 3600000),
    resolved: false,
    replies: [
      {
        author: "张工程师",
        content: "已更新截图，请查看",
        timestamp: new Date(Date.now() - 1800000),
      },
    ],
  },
  {
    id: "c2",
    sectionId: "vulnerabilities",
    author: "王主管",
    content: "请补充漏洞的详细复现步骤",
    timestamp: new Date(Date.now() - 7200000),
    resolved: true,
  },
]

interface ReportEditorProps {
  reportId: string
}

export function ReportEditor({ reportId }: ReportEditorProps) {
  // 状态管理
  const [report, setReport] = useState<Report | null>(null)
  const [sections, setSections] = useState<ReportSection[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedSection, setSelectedSection] = useState<string>("overview")
  const [editingSection, setEditingSection] = useState<string | null>(null)
  const [tocCollapsed, setTocCollapsed] = useState(false)
  const [commentsCollapsed, setCommentsCollapsed] = useState(false)
  const [comments] = useState<Comment[]>(mockComments)
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set())
  const [showRejectDialog, setShowRejectDialog] = useState(false)
  const [showSignDialog, setShowSignDialog] = useState(false)
  const { toast } = useToast()

  // 加载报告数据
  useEffect(() => {
    fetchReport()
  }, [reportId])

  const fetchReport = async () => {
    try {
      setLoading(true)
      const response = await reportApi.getDetail(reportId)
      if (response.code === 200 && response.data) {
        setReport(response.data)
        // sections are nested in content.sections
        setSections(response.data.content?.sections || [])
      }
    } catch (error) {
      console.error("Failed to load report:", error)
      toast({
        title: "加载失败",
        description: "无法加载报告数据",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSaveSectionContent = async (sectionId: string, content: string) => {
    try {
      await reportApi.updateSection(reportId, sectionId, content)
      setSections(prevSections =>
        prevSections.map(s => (s.id === sectionId ? { ...s, content } : s))
      )
      setEditingSection(null)
      toast({
        title: "保存成功",
        description: "章节内容已更新",
      })
    } catch (error) {
      console.error("Failed to save section:", error)
      toast({
        title: "保存失败",
        description: "无法更新章节内容",
        variant: "destructive",
      })
    }
  }

  const toggleSection = (id: string) => {
    const newExpanded = new Set(expandedSections)
    if (newExpanded.has(id)) {
      newExpanded.delete(id)
    } else {
      newExpanded.add(id)
    }
    setExpandedSections(newExpanded)
  }

  const renderSectionTree = (sectionList: ReportSection[], level: number = 0) => {
    return sectionList.map((section) => {
      const hasChildren = section.subsections && section.subsections.length > 0
      const isExpanded = expandedSections.has(section.id)

      return (
        <div key={section.id}>
          <div
            className={cn(
              "flex items-center gap-2 py-2 px-2 rounded cursor-pointer transition-colors",
              selectedSection === section.id ? "bg-primary text-primary-foreground" : "hover:bg-accent",
            )}
            style={{ paddingLeft: `${level * 16 + 8}px` }}
            onClick={() => {
              if (!hasChildren) setSelectedSection(section.id)
            }}
          >
            {hasChildren ? (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  toggleSection(section.id)
                }}
                className="p-0.5 hover:bg-accent rounded"
              >
                {isExpanded ? (
                  <ChevronDown className="h-3.5 w-3.5" />
                ) : (
                  <ChevronRight className="h-3.5 w-3.5" />
                )}
              </button>
            ) : (
              <div className="w-4" />
            )}
            <FileText className="h-3.5 w-3.5" />
            <span className="text-sm flex-1">{section.title}</span>
          </div>
          {hasChildren && isExpanded && renderSectionTree(section.subsections!, level + 1)}
        </div>
      )
    })
  }

  const getSelectedTitle = () => {
    const findSection = (sections: ReportSection[], id: string): ReportSection | null => {
      for (const section of sections) {
        if (section.id === id) return section
        if (section.subsections) {
          const found = findSection(section.subsections, id)
          if (found) return found
        }
      }
      return null
    }
    const section = findSection(sections, selectedSection)
    return section?.title || "未选择章节"
  }

  const getSelectedContent = () => {
    const findSection = (sections: ReportSection[], id: string): ReportSection | null => {
      for (const section of sections) {
        if (section.id === id) return section
        if (section.subsections) {
          const found = findSection(section.subsections, id)
          if (found) return found
        }
      }
      return null
    }
    const section = findSection(sections, selectedSection)
    return section?.content || ""
  }

  const sectionComments = comments.filter((c) => c.sectionId === selectedSection)

  return (
    <div className="h-[calc(100vh-10rem)] flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold">智能门锁安全检测报告</h1>
            <Badge className="bg-warning/10 text-warning border-warning/20">待审核</Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1">报告编号: {reportId} | 版本: v1.2 | 最后修改: 2024-12-15</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <History className="h-4 w-4 mr-1" />
            版本历史
          </Button>
          <Button variant="outline" size="sm">
            <Eye className="h-4 w-4 mr-1" />
            预览PDF
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-1" />
            导出
          </Button>
        </div>
      </div>

      {/* Main Content - 响应式三栏布局 */}
      <div className="flex-1 flex gap-4 min-h-0">
        {/* Left Sidebar - Table of Contents */}
        {!tocCollapsed && (
          <div className="w-64 xl:w-72 2xl:w-80 flex-shrink-0 flex flex-col">
            <Card className="h-full flex flex-col overflow-hidden">
              <CardHeader className="py-3 border-b flex-shrink-0">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm">文档目录</CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setTocCollapsed(true)}
                    className="h-7 w-7 p-0"
                    title="折叠目录"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <ScrollArea className="flex-1">
                <div className="p-2">
                  {loading ? (
                    <div className="flex items-center justify-center p-8">
                      <Loader2 className="h-6 w-6 animate-spin" />
                    </div>
                  ) : (
                    renderSectionTree(sections)
                  )}
                </div>
              </ScrollArea>
            </Card>
          </div>
        )}

        {/* TOC Collapsed - Inline Expand Button */}
        {tocCollapsed && (
          <div className="flex items-start pt-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setTocCollapsed(false)}
              className="h-10 w-10 p-0 shadow-lg"
              title="展开目录"
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>
        )}

        {/* Middle Panel - Document Preview/Edit (响应式居中) */}
        <div className="flex-1 min-h-0 px-4">
          <Card className="h-full flex flex-col bg-card/50 backdrop-blur-sm">
            {!editingSection && (
              <CardHeader className="py-3 border-b flex-shrink-0 bg-muted/30">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm text-foreground">
                    {getSelectedTitle()}
                  </CardTitle>
                  {selectedSection && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setEditingSection(selectedSection)}
                    >
                      <Edit3 className="h-4 w-4 mr-1" />
                      编辑
                    </Button>
                  )}
                </div>
              </CardHeader>
            )}
            <div className="flex-1 overflow-hidden">
              {editingSection === selectedSection ? (
                <div className="h-full">
                  <SectionEditor
                    sectionId={selectedSection}
                    initialContent={getSelectedContent()}
                    onSave={(content) => handleSaveSectionContent(selectedSection, content)}
                    onCancel={() => setEditingSection(null)}
                  />
                </div>
              ) : (
                <ScrollArea className="h-full">
                  <div className="p-8">
                    <div className="prose prose-lg max-w-none dark:prose-invert mx-auto">
                      <h2 className="text-2xl font-semibold mb-6 text-foreground pb-3 border-b">
                        {getSelectedTitle()}
                      </h2>
                      <div
                        className="text-base leading-8 text-foreground/90"
                        dangerouslySetInnerHTML={{ __html: getSelectedContent() || '<p class="text-muted-foreground italic">暂无内容</p>' }}
                      />
                    </div>
                  </div>
                </ScrollArea>
              )}
            </div>
          </Card>
        </div>

        {/* Right Panel - Comments & Annotations */}
        {!commentsCollapsed && (
          <div className="w-80 xl:w-96 2xl:w-[26rem] flex-shrink-0 flex flex-col gap-4">
            <Card className="flex-1 flex flex-col min-h-0">
              <CardHeader className="py-3 border-b flex-shrink-0">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <MessageSquare className="h-4 w-4" />
                    批注 ({sectionComments.length})
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setCommentsCollapsed(true)}
                    className="h-7 w-7 p-0"
                    title="折叠批注"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <ScrollArea className="flex-1">
                <div className="p-3 space-y-3">
                  {sectionComments.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground text-sm">此章节暂无批注</div>
                  ) : (
                    sectionComments.map((comment) => (
                      <div
                        key={comment.id}
                        className={cn(
                          "p-3 rounded-lg border",
                          comment.resolved ? "bg-muted/30 border-muted" : "bg-background border-border"
                        )}
                      >
                        <div className="flex items-start gap-2">
                          <Avatar className="h-7 w-7">
                            <AvatarFallback>{comment.author[0]}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-sm font-medium">{comment.author}</span>
                              {comment.resolved && (
                                <Badge variant="outline" className="h-5 px-1.5 text-xs">
                                  <Check className="h-3 w-3 mr-1" />
                                  已解决
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-foreground/80">{comment.content}</p>
                            <span className="text-xs text-muted-foreground mt-1 block">
                              {comment.timestamp.toLocaleString("zh-CN")}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </Card>
          </div>
        )}

        {/* Comments Collapsed - Inline Expand Button */}
        {commentsCollapsed && (
          <div className="flex items-start pt-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCommentsCollapsed(false)}
              className="h-10 w-10 p-0 shadow-lg"
              title="展开批注"
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
          </div>
        )}
      </div>

      {/* Bottom Action Bar */}
      <div className="flex items-center justify-between p-4 bg-card border rounded-lg">
        <div className="flex items-center gap-4 text-sm">
          <span className="text-muted-foreground">
            未解决批注: <span className="text-warning font-medium">{comments.filter((c) => !c.resolved).length}</span>
          </span>
          <Separator orientation="vertical" className="h-4" />
          <span className="text-muted-foreground">
            审核进度: <span className="text-foreground font-medium">75%</span>
          </span>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            className="text-destructive border-destructive/30 bg-transparent"
            onClick={() => setShowRejectDialog(true)}
          >
            <X className="h-4 w-4 mr-1" />
            驳回修改
          </Button>
          <Button variant="outline" className="text-success border-success/30 bg-transparent">
            <FileCheck className="h-4 w-4 mr-1" />
            通过审核
          </Button>
          <Button onClick={() => setShowSignDialog(true)}>
            <Lock className="h-4 w-4 mr-1" />
            电子签章
          </Button>
        </div>
      </div>
    </div>
  )
}
