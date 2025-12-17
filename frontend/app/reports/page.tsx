"use client"

import { MainLayout } from "@/components/layout/main-layout"
import { ReportList } from "@/components/reports/report-list"
import { ProtectedRoute } from "@/components/auth/protected-route"

export default function ReportsPage() {
  return (
    <ProtectedRoute>
      <MainLayout breadcrumbs={[{ label: "报告中心" }]}>
        <ReportList />
      </MainLayout>
    </ProtectedRoute>
  )
}
