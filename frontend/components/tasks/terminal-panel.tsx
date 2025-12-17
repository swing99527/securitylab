"use client"

import { useEffect, useRef, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Pause, Play, Search, Download, Trash2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { taskApi } from "@/lib/api"

interface TerminalPanelProps {
  taskId: string
}

export function TerminalPanel({ taskId }: TerminalPanelProps) {
  console.log('🔧 TerminalPanel mounted, taskId:', taskId)
  const [logs, setLogs] = useState<any[]>([])
  const [isPaused, setIsPaused] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const scrollRef = useRef<HTMLDivElement>(null)

  // Fetch logs from API
  useEffect(() => {
    console.log('🔧 useEffect triggered, isPaused:', isPaused, 'taskId:', taskId)

    if (isPaused || !taskId) {
      console.log('⏸️  Skipping fetch, isPaused:', isPaused, '!taskId:', !taskId)
      return
    }

    async function fetchLogs() {
      console.log('📞 Calling taskApi.getLogs for task:', taskId)
      try {
        const response = await taskApi.getLogs(taskId, { limit: 200 })
        console.log('📋 getLogs response:', response)
        if (response.code === 200 && response.data) {
          console.log('📋 Logs data:', response.data)
          console.log('📋 Logs array:', response.data.logs)
          setLogs(response.data.logs || [])
        }
      } catch (error) {
        console.error('Failed to fetch logs:', error)
      }
    }

    fetchLogs()
    const interval = setInterval(fetchLogs, 2000) // Poll every 2 seconds

    return () => clearInterval(interval)
  }, [taskId, isPaused])

  useEffect(() => {
    if (!isPaused && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [logs, isPaused])

  const filteredLogs = searchTerm
    ? logs.filter(
      (log) =>
        log.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.level.toLowerCase().includes(searchTerm.toLowerCase()),
    )
    : logs

  const getLevelColor = (level: string) => {
    switch (level) {
      case "ERROR":
        return "text-destructive"
      case "WARN":
        return "text-warning"
      case "INFO":
        return "text-success"
      case "DEBUG":
        return "text-muted-foreground"
      default:
        return "text-foreground"
    }
  }

  return (
    <Card className="h-full flex flex-col bg-[#0a0a0a]">
      <CardHeader className="py-2 px-4 flex-row items-center justify-between border-b border-border flex-shrink-0">
        <CardTitle className="text-sm font-mono">实时终端</CardTitle>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
            <Input
              placeholder="搜索日志..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-7 w-40 pl-7 text-xs font-mono bg-background"
            />
          </div>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setIsPaused(!isPaused)}>
            {isPaused ? <Play className="h-3 w-3" /> : <Pause className="h-3 w-3" />}
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7">
            <Download className="h-3 w-3" />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setLogs([])}>
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="flex-1 p-0 min-h-0">
        <ScrollArea className="h-full" ref={scrollRef}>
          <div className="p-2 font-mono text-xs space-y-0.5">
            {filteredLogs.map((log, index) => (
              <div key={index} className="flex gap-2 hover:bg-accent/20 px-1 rounded">
                <span className="text-muted-foreground w-24 flex-shrink-0">
                  {new Date(log.timestamp).toLocaleTimeString('zh-CN')}
                </span>
                <span className={cn("w-12 flex-shrink-0 font-semibold", getLevelColor(log.level))}>[{log.level}]</span>
                <span className="text-green-400 terminal-text">{log.message}</span>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}
