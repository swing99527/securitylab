"use client"

import { MainLayout } from "@/components/layout/main-layout"
import { DashboardContent } from "@/components/dashboard/dashboard-content"
import { ProtectedRoute } from "@/components/auth/protected-route"

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <MainLayout breadcrumbs={[{ label: "工作台" }]}>
        <DashboardContent />
      </MainLayout>
    </ProtectedRoute>
  )
}
