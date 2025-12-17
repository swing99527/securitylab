"use client"

import { useParams } from "next/navigation"
import { MainLayout } from "@/components/layout/main-layout"
import { ReportEditor } from "@/components/reports/report-editor"

export default function ReportDetailPage() {
  const params = useParams()
  const id = params.id as string

  return (
    <MainLayout breadcrumbs={[{ label: "报告中心", href: "/reports" }, { label: `报告 ${id}` }]}>
      <ReportEditor reportId={id} />
    </MainLayout>
  )
}
