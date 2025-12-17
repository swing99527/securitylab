"use client"

import { useState } from "react"
import { useAppStore } from "@/lib/store"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Bell, Wifi, Bluetooth, Radio, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"

interface TopBarProps {
  breadcrumbs?: { label: string; href?: string }[]
}

export function TopBar({ breadcrumbs = [] }: TopBarProps) {
  const { hardwareStatus, notifications } = useAppStore()
  const [notificationOpen, setNotificationOpen] = useState(false)

  const unreadCount = notifications.filter((n) => !n.read).length

  const getStatusColor = (status: "online" | "offline" | "warning") => {
    switch (status) {
      case "online":
        return "bg-success"
      case "offline":
        return "bg-destructive"
      case "warning":
        return "bg-warning"
    }
  }

  const getStatusIcon = (status: "online" | "offline" | "warning") => {
    switch (status) {
      case "online":
        return "🟢"
      case "offline":
        return "🔴"
      case "warning":
        return "🟡"
    }
  }

  return (
    <header className="h-14 border-b border-border bg-card flex items-center justify-between px-4">
      {/* Breadcrumbs */}
      <nav className="flex items-center gap-1 text-sm">
        {breadcrumbs.map((crumb, index) => (
          <div key={index} className="flex items-center gap-1">
            {index > 0 && <ChevronRight className="h-4 w-4 text-muted-foreground" />}
            {crumb.href ? (
              <a href={crumb.href} className="text-muted-foreground hover:text-foreground transition-colors">
                {crumb.label}
              </a>
            ) : (
              <span className="text-foreground font-medium">{crumb.label}</span>
            )}
          </div>
        ))}
      </nav>

      {/* Right Section */}
      <div className="flex items-center gap-4">
        {/* Hardware Status */}
        <div className="flex items-center gap-3 px-3 py-1.5 rounded-lg bg-secondary/50">
          <div className="flex items-center gap-1.5" title="Wi-Fi 探针">
            <Wifi className="h-4 w-4 text-muted-foreground" />
            <span className={cn("w-2 h-2 rounded-full", getStatusColor(hardwareStatus.wifi))} />
          </div>
          <div className="flex items-center gap-1.5" title="BLE 探针">
            <Bluetooth className="h-4 w-4 text-muted-foreground" />
            <span className={cn("w-2 h-2 rounded-full", getStatusColor(hardwareStatus.ble))} />
          </div>
          <div className="flex items-center gap-1.5" title="Zigbee 探针">
            <Radio className="h-4 w-4 text-muted-foreground" />
            <span className={cn("w-2 h-2 rounded-full", getStatusColor(hardwareStatus.zigbee))} />
          </div>
        </div>

        {/* Notifications */}
        <Popover open={notificationOpen} onOpenChange={setNotificationOpen}>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <Badge
                  className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
                  variant="destructive"
                >
                  {unreadCount}
                </Badge>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-0" align="end">
            <div className="p-3 border-b border-border">
              <h4 className="font-semibold text-sm">通知</h4>
            </div>
            <ScrollArea className="h-80">
              {notifications.length === 0 ? (
                <div className="p-4 text-center text-muted-foreground text-sm">暂无通知</div>
              ) : (
                <div className="divide-y divide-border">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={cn(
                        "p-3 hover:bg-accent/50 transition-colors cursor-pointer",
                        !notification.read && "bg-accent/20",
                      )}
                    >
                      <div className="flex items-start gap-2">
                        <span className="text-sm">
                          {notification.type === "success" && "✅"}
                          {notification.type === "warning" && "⚠️"}
                          {notification.type === "error" && "❌"}
                          {notification.type === "info" && "ℹ️"}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium">{notification.title}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{notification.message}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {notification.timestamp.toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </PopoverContent>
        </Popover>
      </div>
    </header>
  )
}
