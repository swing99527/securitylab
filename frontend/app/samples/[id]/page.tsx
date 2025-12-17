"use client"

import { useParams } from "next/navigation"
import { MainLayout } from "@/components/layout/main-layout"
import { SampleDetail } from "@/components/samples/sample-detail"

export default function SampleDetailPage() {
  const params = useParams()
  const id = params.id as string

  return (
    <MainLayout breadcrumbs={[{ label: "样品库", href: "/samples" }, { label: `样品 ${id}` }]}>
      <SampleDetail sampleId={id} />
    </MainLayout>
  )
}
