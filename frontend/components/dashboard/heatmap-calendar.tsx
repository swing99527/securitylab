"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"

const days = ["日", "一", "二", "三", "四", "五", "六"]
const hours = Array.from({ length: 12 }, (_, i) => i + 8) // 8:00 - 19:00

// Generate mock data for lab utilization
const generateHeatmapData = () => {
  const data: { day: number; hour: number; value: number }[] = []
  for (let day = 0; day < 7; day++) {
    for (let hour = 0; hour < 12; hour++) {
      data.push({
        day,
        hour,
        value: Math.random() > 0.3 ? Math.floor(Math.random() * 4) : 0,
      })
    }
  }
  return data
}

export function HeatmapCalendar() {
  // Generate data on client-side only to avoid hydration mismatch
  const [heatmapData, setHeatmapData] = useState<{ day: number; hour: number; value: number }[]>([])
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setHeatmapData(generateHeatmapData())
    setMounted(true)
  }, [])

  const getColor = (value: number) => {
    switch (value) {
      case 0:
        return "bg-muted"
      case 1:
        return "bg-success/30"
      case 2:
        return "bg-warning/50"
      case 3:
        return "bg-destructive/70"
      default:
        return "bg-muted"
    }
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">实验室负荷热力图 (未来7天)</CardTitle>
      </CardHeader>
      <CardContent>
        {!mounted ? (
          <div className="h-48 flex items-center justify-center text-muted-foreground">
            加载中...
          </div>
        ) : (
          <div className="space-y-2">
            {/* Header */}
            <div className="flex gap-1 ml-8">
              {hours.map((hour) => (
                <div key={hour} className="w-6 text-xs text-muted-foreground text-center">
                  {hour}
                </div>
              ))}
            </div>

            {/* Grid */}
            {days.map((day, dayIndex) => (
              <div key={day} className="flex items-center gap-1">
                <span className="w-6 text-xs text-muted-foreground">{day}</span>
                <div className="flex gap-1">
                  {hours.map((_, hourIndex) => {
                    const cell = heatmapData.find((d) => d.day === dayIndex && d.hour === hourIndex)
                    return (
                      <div
                        key={hourIndex}
                        className={cn(
                          "w-6 h-6 rounded-sm cursor-pointer hover:ring-1 hover:ring-primary transition-all",
                          getColor(cell?.value || 0),
                        )}
                        title={`${day} ${hours[hourIndex]}:00 - 占用率: ${(cell?.value || 0) * 25}%`}
                      />
                    )
                  })}
                </div>
              </div>
            ))}

            {/* Legend */}
            <div className="flex items-center gap-4 mt-4 text-xs text-muted-foreground">
              <span>占用率:</span>
              <div className="flex items-center gap-1">
                <div className="w-4 h-4 rounded-sm bg-muted" />
                <span>空闲</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-4 h-4 rounded-sm bg-success/30" />
                <span>低</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-4 h-4 rounded-sm bg-warning/50" />
                <span>中</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-4 h-4 rounded-sm bg-destructive/70" />
                <span>高</span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
