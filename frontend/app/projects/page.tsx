"use client"

import { MainLayout } from "@/components/layout/main-layout"
import { ProjectList } from "@/components/projects/project-list"
import { ProtectedRoute } from "@/components/auth/protected-route"

export default function ProjectsPage() {
  return (
    <ProtectedRoute>
      <MainLayout breadcrumbs={[{ label: "项目管理" }]}>
        <ProjectList />
      </MainLayout>
    </ProtectedRoute>
  )
}
