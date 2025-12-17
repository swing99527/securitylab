"use client"

import { useParams } from "next/navigation"
import { MainLayout } from "@/components/layout/main-layout"
import { TaskCockpit } from "@/components/tasks/task-cockpit"

export default function TaskDetailPage() {
  const params = useParams()
  const id = params.id as string

  return (
    <MainLayout breadcrumbs={[{ label: "检测任务", href: "/tasks" }, { label: `任务 ${id}` }]}>
      <TaskCockpit taskId={id} />
    </MainLayout>
  )
}
