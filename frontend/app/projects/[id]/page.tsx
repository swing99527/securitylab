"use client"

import { useParams } from "next/navigation"
import { MainLayout } from "@/components/layout/main-layout"
import { ProjectDetail } from "@/components/projects/project-detail"
import { ProtectedRoute } from "@/components/auth/protected-route"

export default function ProjectDetailPage() {
    const params = useParams()
    const id = params.id as string

    return (
        <ProtectedRoute>
            <MainLayout breadcrumbs={[
                { label: "项目管理", href: "/projects" },
                { label: "项目详情" }
            ]}>
                <ProjectDetail projectId={id} />
            </MainLayout>
        </ProtectedRoute>
    )
}
