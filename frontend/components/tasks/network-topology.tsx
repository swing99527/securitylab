"use client"

import { useEffect, useRef, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"

interface Node {
  id: string
  name: string
  type: "scanner" | "dut" | "gateway" | "service"
  x: number
  y: number
}

interface Edge {
  source: string
  target: string
  active: boolean
}

const nodes: Node[] = [
  { id: "scanner", name: "扫描器", type: "scanner", x: 100, y: 150 },
  { id: "gateway", name: "网关", type: "gateway", x: 300, y: 150 },
  { id: "dut", name: "DUT", type: "dut", x: 500, y: 150 },
  { id: "service1", name: "HTTP:80", type: "service", x: 450, y: 80 },
  { id: "service2", name: "SSH:22", type: "service", x: 550, y: 80 },
  { id: "service3", name: "MQTT:1883", type: "service", x: 500, y: 250 },
]

const edges: Edge[] = [
  { source: "scanner", target: "gateway", active: true },
  { source: "gateway", target: "dut", active: true },
  { source: "dut", target: "service1", active: false },
  { source: "dut", target: "service2", active: true },
  { source: "dut", target: "service3", active: false },
]

interface NetworkTopologyProps {
  taskResult?: any
}

export function NetworkTopology({ taskResult }: NetworkTopologyProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [animationOffset, setAnimationOffset] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setAnimationOffset((prev) => (prev + 1) % 20)
    }, 50)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Set canvas size
    canvas.width = canvas.offsetWidth
    canvas.height = canvas.offsetHeight

    // Clear canvas
    ctx.fillStyle = "hsl(222, 47%, 7%)"
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // Draw edges
    edges.forEach((edge) => {
      const sourceNode = nodes.find((n) => n.id === edge.source)
      const targetNode = nodes.find((n) => n.id === edge.target)
      if (!sourceNode || !targetNode) return

      ctx.beginPath()
      ctx.moveTo(sourceNode.x, sourceNode.y)
      ctx.lineTo(targetNode.x, targetNode.y)
      ctx.strokeStyle = edge.active ? "rgba(59, 130, 246, 0.6)" : "rgba(100, 116, 139, 0.3)"
      ctx.lineWidth = edge.active ? 2 : 1
      ctx.stroke()

      // Animated dots for active connections
      if (edge.active) {
        const dx = targetNode.x - sourceNode.x
        const dy = targetNode.y - sourceNode.y
        const len = Math.sqrt(dx * dx + dy * dy)
        const dotCount = 3

        for (let i = 0; i < dotCount; i++) {
          const t = (animationOffset / 20 + i / dotCount) % 1
          const dotX = sourceNode.x + dx * t
          const dotY = sourceNode.y + dy * t

          ctx.beginPath()
          ctx.arc(dotX, dotY, 3, 0, Math.PI * 2)
          ctx.fillStyle = "#3B82F6"
          ctx.fill()
        }
      }
    })

    // Draw nodes
    nodes.forEach((node) => {
      // Node circle
      ctx.beginPath()
      ctx.arc(node.x, node.y, node.type === "service" ? 20 : 30, 0, Math.PI * 2)

      switch (node.type) {
        case "scanner":
          ctx.fillStyle = "rgba(16, 185, 129, 0.2)"
          ctx.strokeStyle = "#10B981"
          break
        case "dut":
          ctx.fillStyle = "rgba(239, 68, 68, 0.2)"
          ctx.strokeStyle = "#EF4444"
          break
        case "gateway":
          ctx.fillStyle = "rgba(245, 158, 11, 0.2)"
          ctx.strokeStyle = "#F59E0B"
          break
        case "service":
          ctx.fillStyle = "rgba(59, 130, 246, 0.2)"
          ctx.strokeStyle = "#3B82F6"
          break
      }

      ctx.lineWidth = 2
      ctx.fill()
      ctx.stroke()

      // Node label
      ctx.fillStyle = "#E2E8F0"
      ctx.font = "12px Inter, sans-serif"
      ctx.textAlign = "center"
      ctx.fillText(node.name, node.x, node.y + 4)
    })
  }, [animationOffset])

  return (
    <Card className="h-full">
      <CardContent className="p-0 h-full">
        <canvas ref={canvasRef} className="w-full h-full rounded-lg" />
      </CardContent>
    </Card>
  )
}
