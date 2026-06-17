import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const useStore = create(
  persist(
    (set, get) => ({
      // Auth State
      user: null,
      token: null,
      isAuthenticated: false,

      // Route State
      routes: [],
      selectedRoute: null,
      currentTrip: null,
      routeHistory: [],

      // Dashboard State
      achievements: [],
      dashboardStats: null,
      analyticsData: null,

      // UI State
      sidebarCollapsed: false,
      theme: 'dark',

      // ============================================================
      // Auth Actions
      // ============================================================
      setUser: (user) => set({ user }),

      setToken: (token) => {
        set({ token, isAuthenticated: !!token })
        if (token) {
          localStorage.setItem('greenroute_token', token)
        } else {
          localStorage.removeItem('greenroute_token')
        }
      },

      setAuth: (user, token) => {
        set({ user, token, isAuthenticated: true })
        localStorage.setItem('greenroute_token', token)
      },

      logout: () => {
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          routes: [],
          selectedRoute: null,
          currentTrip: null,
          dashboardStats: null,
        })
        localStorage.removeItem('greenroute_token')
      },

      updateUserStats: (stats) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...stats } : null,
        })),

      // ============================================================
      // Route Actions
      // ============================================================
      setRoutes: (routes) => set({ routes }),

      setSelectedRoute: (route) => set({ selectedRoute: route }),

      setCurrentTrip: (trip) => set({ currentTrip: trip }),

      addToHistory: (trip) =>
        set((state) => ({
          routeHistory: [trip, ...state.routeHistory].slice(0, 50),
        })),

      setRouteHistory: (history) => set({ routeHistory: history }),

      // ============================================================
      // Achievement Actions
      // ============================================================
      setAchievements: (achievements) => set({ achievements }),

      unlockAchievement: (achievementId) =>
        set((state) => ({
          achievements: state.achievements.map((a) =>
            a.id === achievementId ? { ...a, unlocked: true } : a
          ),
        })),

      // ============================================================
      // Dashboard Actions
      // ============================================================
      setDashboardStats: (stats) => set({ dashboardStats: stats }),

      setAnalyticsData: (data) => set({ analyticsData: data }),

      // ============================================================
      // UI Actions
      // ============================================================
      toggleSidebar: () =>
        set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),

      setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
    }),
    {
      name: 'greenroute-store',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
        sidebarCollapsed: state.sidebarCollapsed,
      }),
    }
  )
)

export default useStore
