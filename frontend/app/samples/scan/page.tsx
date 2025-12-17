"use client"

import { MainLayout } from "@/components/layout/main-layout"
import { SampleScan } from "@/components/samples/sample-scan"

export default function SampleScanPage() {
  return (
    <MainLayout breadcrumbs={[{ label: "样品库", href: "/samples" }, { label: "扫码出入库" }]}>
      <SampleScan />
    </MainLayout>
  )
}
