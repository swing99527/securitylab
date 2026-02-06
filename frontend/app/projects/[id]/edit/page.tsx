"use client"

import { useParams } from "next/navigation"
import { MainLayout } from "@/components/layout/main-layout"
import { EditProjectForm } from "@/components/projects/edit-project-form"
import { ProtectedRoute } from "@/components/auth/protected-route"

export default function EditProjectPage() {
    const params = useParams()
    const id = params.id as string

    return (
        <ProtectedRoute>
            <MainLayout breadcrumbs={[
                { label: "项目管理", href: "/projects" },
                { label: "编辑项目" }
            ]}>
                <EditProjectForm projectId={id} />
            </MainLayout>
        </ProtectedRoute>
    )
}
