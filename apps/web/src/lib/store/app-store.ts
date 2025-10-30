import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'

/**
 * Notification type definition
 */
interface Notification {
  id: string
  type: 'info' | 'success' | 'warning' | 'error'
  title: string
  message?: string
  timestamp: Date
}

/**
 * Application State Interface
 *
 * Manages global UI state including:
 * - Sidebar toggle state
 * - Notifications
 * - User preferences (language, currency, date format)
 */
interface AppState {
  // Sidebar
  sidebarOpen: boolean
  toggleSidebar: () => void
  setSidebarOpen: (open: boolean) => void

  // Notifications
  notifications: Notification[]
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp'>) => void
  removeNotification: (id: string) => void
  clearNotifications: () => void

  // User Preferences
  preferences: {
    language: string
    currency: string
    dateFormat: string
  }
  updatePreferences: (preferences: Partial<AppState['preferences']>) => void
}

/**
 * Application Store
 *
 * Global state management using Zustand with:
 * - DevTools integration for debugging
 * - Persistence to localStorage
 * - Partialize to only persist specific state
 *
 * @example
 * ```tsx
 * const { sidebarOpen, toggleSidebar } = useAppStore()
 * const { addNotification } = useAppStore()
 *
 * addNotification({
 *   type: 'success',
 *   title: 'Success!',
 *   message: 'Operation completed successfully'
 * })
 * ```
 */
export const useAppStore = create<AppState>()(
  devtools(
    persist(
      (set) => ({
        // Sidebar
        sidebarOpen: true,
        toggleSidebar: () =>
          set((state) => ({ sidebarOpen: !state.sidebarOpen })),
        setSidebarOpen: (open) => set({ sidebarOpen: open }),

        // Notifications
        notifications: [],
        addNotification: (notification) =>
          set((state) => ({
            notifications: [
              {
                ...notification,
                id: crypto.randomUUID(),
                timestamp: new Date(),
              },
              ...state.notifications,
            ],
          })),
        removeNotification: (id) =>
          set((state) => ({
            notifications: state.notifications.filter((n) => n.id !== id),
          })),
        clearNotifications: () => set({ notifications: [] }),

        // Preferences
        preferences: {
          language: 'en',
          currency: 'BDT',
          dateFormat: 'DD/MM/YYYY',
        },
        updatePreferences: (preferences) =>
          set((state) => ({
            preferences: { ...state.preferences, ...preferences },
          })),
      }),
      {
        name: 'vextrus-app-storage',
        // Only persist sidebar state and preferences, not notifications
        partialize: (state) => ({
          sidebarOpen: state.sidebarOpen,
          preferences: state.preferences,
        }),
      }
    ),
    {
      name: 'vextrus-app',
    }
  )
)
