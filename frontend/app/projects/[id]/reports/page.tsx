"use client"

import { useParams } from "next/navigation"
import { MainLayout } from "@/components/layout/main-layout"
import { ReportList } from "@/components/reports/report-list"
import { ProtectedRoute } from "@/components/auth/protected-route"

export default function ProjectReportsPage() {
    const params = useParams()
    const projectId = params.id as string

    return (
        <ProtectedRoute>
            <MainLayout breadcrumbs={[
                { label: "项目管理", href: "/projects" },
                { label: "项目报告" }
            ]}>
                <div className="space-y-4">
                    <h2 className="text-2xl font-bold">项目报告列表</h2>
                    <ReportList projectId={projectId} />
                </div>
            </MainLayout>
        </ProtectedRoute>
    )
}
