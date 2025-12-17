"use client"

import { MainLayout } from "@/components/layout/main-layout"
import { SampleInbound } from "@/components/samples/sample-inbound"

export default function NewSamplePage() {
  return (
    <MainLayout breadcrumbs={[{ label: "样品库", href: "/samples" }, { label: "新增样品" }]}>
      <SampleInbound />
    </MainLayout>
  )
}
