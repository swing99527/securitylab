import { create } from "zustand"

export interface Tab {
  id: string
  title: string
  path: string
  icon?: string
  closable?: boolean
}

interface AppState {
  sidebarCollapsed: boolean
  toggleSidebar: () => void
  tabs: Tab[]
  activeTabId: string
  addTab: (tab: Tab) => void
  removeTab: (id: string) => void
  setActiveTab: (id: string) => void
  hardwareStatus: {
    wifi: "online" | "offline" | "warning"
    ble: "online" | "offline" | "warning"
    zigbee: "online" | "offline" | "warning"
  }
  setHardwareStatus: (key: string, status: "online" | "offline" | "warning") => void
  userStatus: "idle" | "busy"
  setUserStatus: (status: "idle" | "busy") => void
  notifications: Notification[]
  addNotification: (notification: Notification) => void
  clearNotifications: () => void
}

export interface Notification {
  id: string
  title: string
  message: string
  type: "info" | "warning" | "error" | "success"
  timestamp: Date
  read: boolean
}

export const useAppStore = create<AppState>((set) => ({
  sidebarCollapsed: false,
  toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
  tabs: [{ id: "dashboard", title: "工作台", path: "/dashboard", closable: false }],
  activeTabId: "dashboard",
  addTab: (tab) =>
    set((state) => {
      const exists = state.tabs.find((t) => t.id === tab.id)
      if (exists) {
        return { activeTabId: tab.id }
      }
      return { tabs: [...state.tabs, tab], activeTabId: tab.id }
    }),
  removeTab: (id) =>
    set((state) => {
      const newTabs = state.tabs.filter((t) => t.id !== id)
      const newActiveId = state.activeTabId === id ? newTabs[newTabs.length - 1]?.id || "dashboard" : state.activeTabId
      return { tabs: newTabs, activeTabId: newActiveId }
    }),
  setActiveTab: (id) => set({ activeTabId: id }),
  hardwareStatus: {
    wifi: "online",
    ble: "offline",
    zigbee: "offline",
  },
  setHardwareStatus: (key, status) =>
    set((state) => ({
      hardwareStatus: { ...state.hardwareStatus, [key]: status },
    })),
  userStatus: "idle",
  setUserStatus: (status) => set({ userStatus: status }),
  notifications: [
    {
      id: "1",
      title: "扫描完成",
      message: "项目 PRJ-2024-001 端口扫描已完成",
      type: "success",
      timestamp: new Date(),
      read: false,
    },
    {
      id: "2",
      title: "待审核",
      message: "有 3 份报告等待您的审核",
      type: "warning",
      timestamp: new Date(),
      read: false,
    },
  ],
  addNotification: (notification) =>
    set((state) => ({
      notifications: [notification, ...state.notifications],
    })),
  clearNotifications: () => set({ notifications: [] }),
}))
