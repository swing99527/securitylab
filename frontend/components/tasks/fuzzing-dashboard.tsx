"use client"

import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts"
import { taskApi } from "@/lib/api"

interface FuzzingDashboardProps {
  taskId: string
}

interface MetricData {
  time: string
  latency: number
  throughput: number
}

export function FuzzingDashboard({ taskId }: FuzzingDashboardProps) {
  const [data, setData] = useState<MetricData[]>([])

  useEffect(() => {
    // 获取真实的性能指标数据
    const fetchMetrics = async () => {
      try {
        const response = await taskApi.getLogs(taskId, 200)

        if (response.code === 200 && response.data?.logs) {
          const logs = response.data.logs

          // 提取包含性能指标的日志 - 检查 data 或 extra_data 字段
          const metricsLogs = logs.filter((log: any) => {
            const perfData = log.data || log.extra_data
            return perfData && (perfData.latency !== undefined || perfData.throughput !== undefined)
          })

          console.log(`📊 Fuzzing Dashboard: 找到 ${metricsLogs.length} 个性能指标`)

          // 转换为图表数据格式 - 使用索引作为时间
          const chartData = metricsLogs.map((log: any, index: number) => {
            const perfData = log.data || log.extra_data
            return {
              time: `${index}`,
              latency: perfData.latency || 0,
              throughput: perfData.throughput || 0
            }
          })

          if (chartData.length > 0) {
            console.log(`📊 设置 ${chartData.length} 个数据点`)
            console.log('📊 前3个:', chartData.slice(0, 3))
            setData(chartData)
          } else {
            console.log('📊 没有性能数据')
          }
        }
      } catch (error) {
        console.error('Failed to fetch metrics:', error)
      }
    }

    fetchMetrics()
    const interval = setInterval(fetchMetrics, 2000)
    return () => clearInterval(interval)
  }, [taskId])

  const displayData = data.length > 0 ? data : []
  const hasData = data.length > 0

  return (
    <Card className="h-full flex flex-col">
      <CardContent className="flex-1 p-4">
        <div className="h-full flex flex-col gap-4">
          <div className="flex-1 relative">
            <div className="flex justify-between items-center mb-2">
              <h4 className="text-sm font-medium">响应延迟 (ms)</h4>
              {hasData && (
                <span className="text-xs text-muted-foreground">
                  实时数据 · {data.length} 个请求
                </span>
              )}
            </div>
            {hasData ? (
              <ResponsiveContainer width="100%" height="90%">
                <LineChart data={displayData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis
                    dataKey="time"
                    tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                    stroke="hsl(var(--border))"
                    label={{ value: '请求序号', position: 'insideBottom', offset: -5, fontSize: 10 }}
                  />
                  <YAxis
                    tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                    stroke="hsl(var(--border))"
                    label={{ value: '延迟 (ms)', angle: -90, position: 'insideLeft', fontSize: 10 }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "6px",
                      fontSize: "12px",
                    }}
                    formatter={(value: any, name: string) => {
                      if (name === 'latency') return [`${value.toFixed(2)} ms`, '延迟']
                      return value
                    }}
                  />
                  <ReferenceLine y={100} stroke="#F59E0B" strokeDasharray="5 5" label="警戒线" />
                  <Line
                    type="monotone"
                    dataKey="latency"
                    stroke="#3B82F6"
                    strokeWidth={2}
                    dot={data.length < 20}
                    animationDuration={300}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full">
                <p className="text-sm text-muted-foreground">等待性能数据...</p>
              </div>
            )}
          </div>

          <div className="flex-1 relative">
            <div className="flex justify-between items-center mb-2">
              <h4 className="text-sm font-medium">吞吐量 (req/s)</h4>
              {hasData && (
                <span className="text-xs text-muted-foreground">
                  实时数据
                </span>
              )}
            </div>
            {hasData ? (
              <ResponsiveContainer width="100%" height="90%">
                <LineChart data={displayData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis
                    dataKey="time"
                    tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                    stroke="hsl(var(--border))"
                    label={{ value: '请求序号', position: 'insideBottom', offset: -5, fontSize: 10 }}
                  />
                  <YAxis
                    tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                    stroke="hsl(var(--border))"
                    label={{ value: 'req/s', angle: -90, position: 'insideLeft', fontSize: 10 }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "6px",
                      fontSize: "12px",
                    }}
                    formatter={(value: any, name: string) => {
                      if (name === 'throughput') return [`${value.toFixed(2)} req/s`, '吞吐量']
                      return value
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="throughput"
                    stroke="#10B981"
                    strokeWidth={2}
                    dot={data.length < 20}
                    animationDuration={300}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full">
                <p className="text-sm text-muted-foreground">等待性能数据...</p>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
