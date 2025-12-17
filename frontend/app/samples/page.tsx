"use client"

import { MainLayout } from "@/components/layout/main-layout"
import { SampleList } from "@/components/samples/sample-list"
import { ProtectedRoute } from "@/components/auth/protected-route"

export default function SamplesPage() {
  return (
    <ProtectedRoute>
      <MainLayout breadcrumbs={[{ label: "样品库" }]}>
        <SampleList />
      </MainLayout>
    </ProtectedRoute>
  )
}
