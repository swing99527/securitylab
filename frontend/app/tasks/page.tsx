"use client"

import { MainLayout } from "@/components/layout/main-layout"
import { TaskList } from "@/components/tasks/task-list"
import { ProtectedRoute } from "@/components/auth/protected-route"

export default function TasksPage() {
  return (
    <ProtectedRoute>
      <MainLayout breadcrumbs={[{ label: "检测任务" }]}>
        <TaskList />
      </MainLayout>
    </ProtectedRoute>
  )
}
