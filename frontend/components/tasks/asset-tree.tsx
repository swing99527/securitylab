"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger } from "@/components/ui/context-menu"
import { ChevronRight, ChevronDown, Folder, FolderOpen, FileCode, FileText, Binary, Cpu } from "lucide-react"
import { cn } from "@/lib/utils"

interface TreeNode {
  id: string
  name: string
  type: "folder" | "file" | "binary" | "config" | "device"
  children?: TreeNode[]
}

interface AssetTreeProps {
  taskId: string
  taskResult: any
  taskType: string
}

const mockTreeData: TreeNode[] = [
  {
    id: "1",
    name: "firmware_v2.3.1.bin",
    type: "folder",
    children: [
      {
        id: "1-1",
        name: "squashfs-root",
        type: "folder",
        children: [
          {
            id: "1-1-1",
            name: "bin",
            type: "folder",
            children: [
              { id: "1-1-1-1", name: "busybox", type: "binary" },
              { id: "1-1-1-2", name: "dropbear", type: "binary" },
            ],
          },
          {
            id: "1-1-2",
            name: "etc",
            type: "folder",
            children: [
              { id: "1-1-2-1", name: "passwd", type: "config" },
              { id: "1-1-2-2", name: "shadow", type: "config" },
              { id: "1-1-2-3", name: "init.d", type: "folder" },
            ],
          },
          { id: "1-1-3", name: "lib", type: "folder" },
          { id: "1-1-4", name: "usr", type: "folder" },
        ],
      },
      { id: "1-2", name: "kernel.img", type: "binary" },
      { id: "1-3", name: "bootloader.bin", type: "binary" },
    ],
  },
  {
    id: "2",
    name: "网络拓扑",
    type: "folder",
    children: [
      { id: "2-1", name: "192.168.1.1 (Gateway)", type: "device" },
      { id: "2-2", name: "192.168.1.100 (DUT)", type: "device" },
      { id: "2-3", name: "192.168.1.200 (Scanner)", type: "device" },
    ],
  },
]

export function AssetTree({ taskId, taskResult, taskType }: AssetTreeProps) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})

  // Generate tree data based on task result
  const generateTreeData = (): TreeNode[] => {
    if (!taskResult) return []

    switch (taskType) {
      case "ping_scan":
        return [
          {
            id: "target",
            name: taskResult.target || "目标主机",
            type: "device",
            children: [
              {
                id: "info",
                name: `状态: ${taskResult.status === "reachable" ? "在线" : "离线"}`,
                type: "file",
              },
              taskResult.avg_latency_ms && {
                id: "latency",
                name: `平均延迟: ${taskResult.avg_latency_ms.toFixed(2)} ms`,
                type: "file",
              },
            ].filter(Boolean) as TreeNode[],
          },
        ]

      case "nmap_scan":
        // TODO: Implement nmap asset tree
        return mockTreeData

      default:
        return mockTreeData
    }
  }

  const treeData = generateTreeData()

  const toggleExpand = (id: string) => {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  const renderNode = (node: TreeNode, level = 0) => {
    const hasChildren = node.children && node.children.length > 0
    const isExpanded = expanded[node.id]

    const getIcon = () => {
      if (hasChildren) {
        return isExpanded ? <FolderOpen className="h-3.5 w-3.5" /> : <Folder className="h-3.5 w-3.5" />
      }
      switch (node.type) {
        case "binary":
          return <Binary className="h-3.5 w-3.5" />
        case "config":
          return <FileText className="h-3.5 w-3.5" />
        case "file":
          return <FileCode className="h-3.5 w-3.5" />
        case "device":
          return <Cpu className="h-3.5 w-3.5" />
        default:
          return <FileCode className="h-3.5 w-3.5" />
      }
    }

    const TreeItem = () => (
      <div>
        <ContextMenuTrigger asChild>
          <div
            className={cn(
              "flex items-center gap-1.5 py-1 px-2 rounded cursor-pointer hover:bg-accent transition-colors",
              level > 0 && "ml-4"
            )}
            onClick={() => hasChildren && toggleExpand(node.id)}
          >
            {hasChildren && (
              <span className="flex-shrink-0">
                {isExpanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
              </span>
            )}
            {!hasChildren && <span className="w-3" />}
            <span className="flex-shrink-0 text-muted-foreground">{getIcon()}</span>
            <span className="text-xs truncate">{node.name}</span>
          </div>
        </ContextMenuTrigger>
        {hasChildren && isExpanded && (
          <div>
            {node.children!.map((child) => (
              <div key={child.id}>{renderNode(child, level + 1)}</div>
            ))}
          </div>
        )}
      </div>
    )

    return (
      <ContextMenu key={node.id}>
        <TreeItem />
        <ContextMenuContent>
          <ContextMenuItem>查看详情</ContextMenuItem>
          <ContextMenuItem>导出</ContextMenuItem>
          <ContextMenuItem>复制路径</ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>
    )
  }

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="py-3 flex-shrink-0">
        <CardTitle className="text-sm">资源树</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 p-0 min-h-0">
        <ScrollArea className="h-full">
          <div className="p-2">
            {treeData.map((node) => renderNode(node))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}
