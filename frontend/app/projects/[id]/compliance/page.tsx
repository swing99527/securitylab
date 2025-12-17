"use client"

import { useParams } from "next/navigation"
import { MainLayout } from "@/components/layout/main-layout"
import { ComplianceMatrix } from "@/components/compliance/compliance-matrix"

export default function CompliancePage() {
  const params = useParams()
  const id = params.id as string

  return (
    <MainLayout
      breadcrumbs={[{ label: "项目管理", href: "/projects" }, { label: `项目 ${id}` }, { label: "EN 18031 合规矩阵" }]}
    >
      <ComplianceMatrix projectId={id} />
    </MainLayout>
  )
}
