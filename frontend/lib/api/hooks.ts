// API Hooks - 使用 SWR 进行数据获取和缓存

import useSWR from "swr"
import useSWRMutation from "swr/mutation"
import {
  taskApi,
  projectApi,
  reportApi,
  sampleApi,
  complianceApi,
  dashboardApi,
  notificationApi,
  hardwareApi,
  knowledgeApi,
} from "./index"
import type {
  TaskListParams,
  ProjectListParams,
  ReportListParams,
  SampleListParams,
  SampleIntakeRequest,
  ReportReviewRequest,
  ComplianceUpdateRequest,
  ArticleListParams,
  CreateArticleRequest,
  UpdateArticleRequest,
} from "./types"

// ==================== 任务 Hooks ====================
export function useTasks(params?: TaskListParams) {
  return useSWR(["tasks", params], () => taskApi.getList(params), {
    revalidateOnFocus: false,
  })
}

export function useTaskDetail(id: string) {
  return useSWR(id ? ["task", id] : null, () => taskApi.getDetail(id), {
    revalidateOnFocus: false,
  })
}

export function useTaskLogs(id: string) {
  return useSWR(id ? ["task-logs", id] : null, () => taskApi.getLogs(id), {
    refreshInterval: 2000, // 每2秒刷新
  })
}

export function useFuzzingStats(id: string) {
  return useSWR(id ? ["fuzzing-stats", id] : null, () => taskApi.getFuzzingStats(id), {
    refreshInterval: 1000,
  })
}

export function useFuzzingCoverage(id: string) {
  return useSWR(id ? ["fuzzing-coverage", id] : null, () => taskApi.getFuzzingCoverage(id), {
    refreshInterval: 5000,
  })
}

export function useNetworkTopology(id: string) {
  return useSWR(id ? ["network-topology", id] : null, () => taskApi.getNetworkTopology(id), {
    refreshInterval: 3000,
  })
}

// ==================== 项目 Hooks ====================
export function useProjects(params?: ProjectListParams) {
  return useSWR(["projects", params], () => projectApi.getList(params), {
    revalidateOnFocus: false,
  })
}

export function useProjectDetail(id: string) {
  return useSWR(id ? ["project", id] : null, () => projectApi.getDetail(id), {
    revalidateOnFocus: false,
  })
}

// ==================== 报告 Hooks ====================
export function useReports(params?: ReportListParams) {
  return useSWR(["reports", params], () => reportApi.getList(params), {
    revalidateOnFocus: false,
  })
}

export function useReportDetail(id: string) {
  return useSWR(id ? ["report", id] : null, () => reportApi.getDetail(id), {
    revalidateOnFocus: false,
  })
}

export function useReportAnnotations(reportId: string) {
  return useSWR(reportId ? ["report-annotations", reportId] : null, () => reportApi.getAnnotations(reportId), {
    revalidateOnFocus: false,
  })
}

export function useReportReview(id: string) {
  return useSWRMutation(["report", id], (_, { arg }: { arg: ReportReviewRequest }) => reportApi.review(id, arg))
}

// ==================== 样品 Hooks ====================
export function useSamples(params?: SampleListParams) {
  return useSWR(["samples", params], () => sampleApi.getList(params), {
    revalidateOnFocus: false,
  })
}

export function useSampleDetail(id: string) {
  return useSWR(id ? ["sample", id] : null, () => sampleApi.getDetail(id), {
    revalidateOnFocus: false,
  })
}

export function useSampleStats() {
  return useSWR("sample-stats", () => sampleApi.getStats(), {
    revalidateOnFocus: false,
  })
}

export function useSampleIntake() {
  return useSWRMutation("sample-intake", (_, { arg }: { arg: SampleIntakeRequest }) => sampleApi.intake(arg))
}

// ==================== 合规 Hooks ====================
export function useComplianceMatrix(projectId: string) {
  return useSWR(projectId ? ["compliance", projectId] : null, () => complianceApi.getMatrix(projectId), {
    revalidateOnFocus: false,
  })
}

export function useComplianceStats(projectId: string) {
  return useSWR(projectId ? ["compliance-stats", projectId] : null, () => complianceApi.getStats(projectId), {
    revalidateOnFocus: false,
  })
}

export function useComplianceUpdate() {
  return useSWRMutation("compliance-update", (_, { arg }: { arg: ComplianceUpdateRequest }) =>
    complianceApi.updateItem(arg),
  )
}

// ==================== 仪表盘 Hooks ====================
export function useDashboardStats() {
  return useSWR("dashboard-stats", () => dashboardApi.getStats(), {
    refreshInterval: 30000, // 30秒刷新
  })
}

export function useHeatmapData() {
  return useSWR("heatmap", () => dashboardApi.getHeatmap(), {
    revalidateOnFocus: false,
  })
}

export function useVulnerabilityTrend() {
  return useSWR("vulnerability-trend", () => dashboardApi.getVulnerabilityTrend(), {
    refreshInterval: 60000, // 1分钟刷新
  })
}

export function useTodos() {
  return useSWR("todos", () => dashboardApi.getTodos(), {
    revalidateOnFocus: false,
  })
}

// ==================== 通知 Hooks ====================
export function useNotifications() {
  return useSWR("notifications", () => notificationApi.getList(), {
    refreshInterval: 30000,
  })
}

// ==================== 硬件 Hooks ====================
export function useHardwareStatus() {
  return useSWR("hardware-status", () => hardwareApi.getStatus(), {
    refreshInterval: 5000,
  })
}

// ==================== 知识库 Hooks ====================
export function useKnowledgeCategories() {
  return useSWR("knowledge-categories", () => knowledgeApi.getCategories(), {
    revalidateOnFocus: false,
  })
}

export function useArticles(params?: ArticleListParams) {
  return useSWR(["articles", params], () => knowledgeApi.getArticles(params), {
    revalidateOnFocus: false,
  })
}

export function useArticleDetail(id: string | null) {
  return useSWR(id ? ["article", id] : null, () => knowledgeApi.getArticleDetail(id!), {
    revalidateOnFocus: false,
  })
}

export function useStarredArticles() {
  return useSWR("starred-articles", () => knowledgeApi.getStarredArticles(), {
    revalidateOnFocus: false,
  })
}

export function useReadingHistory() {
  return useSWR("reading-history", () => knowledgeApi.getReadingHistory(), {
    revalidateOnFocus: false,
  })
}

export function useCreateArticle() {
  return useSWRMutation("create-article", (_, { arg }: { arg: CreateArticleRequest }) =>
    knowledgeApi.createArticle(arg),
  )
}

export function useUpdateArticle() {
  return useSWRMutation("update-article", (_, { arg }: { arg: UpdateArticleRequest }) =>
    knowledgeApi.updateArticle(arg),
  )
}

export function useToggleStar() {
  return useSWRMutation("toggle-star", (_, { arg }: { arg: string }) => knowledgeApi.toggleStar(arg))
}
