/**
 * API响应适配器 - 后端格式转前端格式
 */

// 转换snake_case到camelCase的辅助函数
function toCamelCase(str: string): string {
  return str.replace(/_([a-z])/g, (g) => g[1].toUpperCase())
}

// 转换对象的键从snake_case到camelCase
function transformKeys(obj: any): any {
  if (Array.isArray(obj)) {
    return obj.map(transformKeys)
  } else if (obj !== null && typeof obj === 'object') {
    return Object.keys(obj).reduce((result, key) => {
      const camelKey = toCamelCase(key)
      result[camelKey] = transformKeys(obj[key])
      return result
    }, {} as any)
  }
  return obj
}

// 后端分页响应 → 前端分页格式
export function adaptPaginatedResponse<T>(backendResponse: any) {
  // 转换items中的每个对象的键
  const transformedItems = (backendResponse.items || []).map(transformKeys)

  return {
    code: 200,
    message: "success",
    data: {
      list: transformedItems,
      total: backendResponse.total || 0,
      page: backendResponse.page || 1,
      pageSize: backendResponse.page_size || 20,
    },
  }
}

// 后端认证响应 → 前端认证格式
export function adaptAuthResponse(backendResponse: any) {
  return {
    code: 200,
    message: "success",
    data: {
      token: backendResponse.access_token,
      refreshToken: backendResponse.refresh_token,
      user: {
        id: backendResponse.user.id,
        name: backendResponse.user.name,
        email: backendResponse.user.email,
        role: backendResponse.user.role,
        status: backendResponse.user.status || "active",
      },
    },
  }
}

// 后端项目详情 → 前端项目格式
export function adaptProjectDetail(backendProject: any) {
  const transformed = transformKeys(backendProject)
  return {
    ...transformed,
    sampleCount: transformed.sampleCount || backendProject.sample_count || 0,
    taskCount: transformed.taskCount || backendProject.task_count || 0,
    completedTaskCount: transformed.completedTaskCount || backendProject.completed_task_count || 0,
    managerName: transformed.managerName || backendProject.manager_name || "Unknown",
  }
}

// 后端样品详情 → 前端样品格式
export function adaptSampleDetail(backendSample: any) {
  const transformed = transformKeys(backendSample)
  return {
    ...transformed,
    projectName: transformed.projectName || backendSample.project_name || "Unknown Project",
    projectCode: transformed.projectCode || backendSample.project_code || "N/A",
    qrCodeUrl: transformed.qrCodeUrl || backendSample.qr_code_url,
    serialNumber: transformed.code || backendSample.code,
  }
}

// 后端任务详情 → 前端任务格式
export function adaptTaskDetail(backendTask: any) {
  const transformed = transformKeys(backendTask)
  return {
    ...transformed,
    projectName: transformed.projectName || backendTask.project_name || "Unknown Project",
    sampleCode: transformed.sampleCode || backendTask.sample_code,
    assigneeName: transformed.assigneeName || backendTask.assignee_name,
  }
}

// 通用错误处理
export function handleApiError(error: any) {
  console.error("API Error:", error)
  return {
    code: error.response?.status || 500,
    message: error.response?.data?.detail || error.message || "请求失败",
    data: null,
  }
}
