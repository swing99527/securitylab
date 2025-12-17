"use client"

import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts"

interface FuzzingDashboardProps {
  taskId: string
}

export function FuzzingDashboard({ taskId }: FuzzingDashboardProps) {
  const [data, setData] = useState<{ time: string; latency: number; throughput: number }[]>([])

  useEffect(() => {
    // Initialize with some data
    const initialData = Array.from({ length: 20 }, (_, i) => ({
      time: `${i}s`,
      latency: Math.random() * 50 + 20,
      throughput: Math.random() * 1000 + 500,
    }))
    setData(initialData)

    // Simulate real-time updates
    const interval = setInterval(() => {
      setData((prev) => {
        const newPoint = {
          time: `${prev.length}s`,
          latency: Math.random() * 50 + 20 + (Math.random() > 0.95 ? 200 : 0), // Occasional spike
          throughput: Math.random() * 1000 + 500,
        }
        return [...prev.slice(-19), newPoint]
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  return (
    <Card className="h-full flex flex-col">
      <CardContent className="flex-1 p-4">
        <div className="h-full flex flex-col gap-4">
          <div className="flex-1">
            <h4 className="text-sm font-medium mb-2">响应延迟 (ms)</h4>
            <ResponsiveContainer width="100%" height="90%">
              <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis
                  dataKey="time"
                  tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                  stroke="hsl(var(--border))"
                />
                <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} stroke="hsl(var(--border))" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "6px",
                    fontSize: "12px",
                  }}
                />
                <ReferenceLine y={100} stroke="#F59E0B" strokeDasharray="5 5" label="警戒线" />
                <Line type="monotone" dataKey="latency" stroke="#3B82F6" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="flex-1">
            <h4 className="text-sm font-medium mb-2">吞吐量 (req/s)</h4>
            <ResponsiveContainer width="100%" height="90%">
              <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis
                  dataKey="time"
                  tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                  stroke="hsl(var(--border))"
                />
                <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} stroke="hsl(var(--border))" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "6px",
                    fontSize: "12px",
                  }}
                />
                <Line type="monotone" dataKey="throughput" stroke="#10B981" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
