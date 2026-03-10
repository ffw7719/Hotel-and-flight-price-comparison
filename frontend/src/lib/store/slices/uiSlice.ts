import { createSlice, PayloadAction } from '@reduxjs/toolkit'

interface UIState {
  theme: 'light' | 'dark'
  sidebarOpen: boolean
  mobileMenuOpen: boolean
  loading: boolean
  notifications: Array<{
    id: string
    type: 'success' | 'error' | 'warning' | 'info'
    message: string
    timestamp: string
    read: boolean
  }>
  modal: {
    isOpen: boolean
    type: string
    data?: any
  }
  searchFilters: {
    platforms: string[]
    priceRange: [number, number]
    rating: number
    amenities: string[]
  }
  viewMode: 'grid' | 'list'
  sortBy: 'price' | 'rating' | 'name' | 'distance'
  sortOrder: 'asc' | 'desc'
}

const initialState: UIState = {
  theme: 'light',
  sidebarOpen: false,
  mobileMenuOpen: false,
  loading: false,
  notifications: [],
  modal: {
    isOpen: false,
    type: '',
    data: null
  },
  searchFilters: {
    platforms: ['meituan', 'ctrip', 'fliggy'],
    priceRange: [0, 10000],
    rating: 0,
    amenities: []
  },
  viewMode: 'grid',
  sortBy: 'price',
  sortOrder: 'asc'
}

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    toggleTheme: (state) => {
      state.theme = state.theme === 'light' ? 'dark' : 'light'
    },
    setTheme: (state, action: PayloadAction<'light' | 'dark'>) => {
      state.theme = action.payload
    },
    toggleSidebar: (state) => {
      state.sidebarOpen = !state.sidebarOpen
    },
    setSidebarOpen: (state, action: PayloadAction<boolean>) => {
      state.sidebarOpen = action.payload
    },
    toggleMobileMenu: (state) => {
      state.mobileMenuOpen = !state.mobileMenuOpen
    },
    setMobileMenuOpen: (state, action: PayloadAction<boolean>) => {
      state.mobileMenuOpen = action.payload
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload
    },
    addNotification: (state, action: PayloadAction<Omit<UIState['notifications'][0], 'id' | 'timestamp' | 'read'>>) => {
      const notification = {
        ...action.payload,
        id: Date.now().toString(),
        timestamp: new Date().toISOString(),
        read: false
      }
      state.notifications.unshift(notification)
      
      // 限制通知数量
      if (state.notifications.length > 50) {
        state.notifications = state.notifications.slice(0, 50)
      }
    },
    markNotificationRead: (state, action: PayloadAction<string>) => {
      const notification = state.notifications.find(n => n.id === action.payload)
      if (notification) {
        notification.read = true
      }
    },
    markAllNotificationsRead: (state) => {
      state.notifications.forEach(notification => {
        notification.read = true
      })
    },
    removeNotification: (state, action: PayloadAction<string>) => {
      state.notifications = state.notifications.filter(n => n.id !== action.payload)
    },
    clearNotifications: (state) => {
      state.notifications = []
    },
    openModal: (state, action: PayloadAction<{ type: string; data?: any }>) => {
      state.modal = {
        isOpen: true,
        type: action.payload.type,
        data: action.payload.data
      }
    },
    closeModal: (state) => {
      state.modal = {
        isOpen: false,
        type: '',
        data: null
      }
    },
    updateSearchFilters: (state, action: PayloadAction<Partial<UIState['searchFilters']>>) => {
      state.searchFilters = {
        ...state.searchFilters,
        ...action.payload
      }
    },
    resetSearchFilters: (state) => {
      state.searchFilters = initialState.searchFilters
    },
    setViewMode: (state, action: PayloadAction<'grid' | 'list'>) => {
      state.viewMode = action.payload
    },
    setSortBy: (state, action: PayloadAction<'price' | 'rating' | 'name' | 'distance'>) => {
      state.sortBy = action.payload
    },
    setSortOrder: (state, action: PayloadAction<'asc' | 'desc'>) => {
      state.sortOrder = action.payload
    },
    togglePlatformFilter: (state, action: PayloadAction<string>) => {
      const platform = action.payload
      const index = state.searchFilters.platforms.indexOf(platform)
      if (index > -1) {
        state.searchFilters.platforms.splice(index, 1)
      } else {
        state.searchFilters.platforms.push(platform)
      }
    },
    setPriceRange: (state, action: PayloadAction<[number, number]>) => {
      state.searchFilters.priceRange = action.payload
    },
    setRatingFilter: (state, action: PayloadAction<number>) => {
      state.searchFilters.rating = action.payload
    },
    toggleAmenityFilter: (state, action: PayloadAction<string>) => {
      const amenity = action.payload
      const index = state.searchFilters.amenities.indexOf(amenity)
      if (index > -1) {
        state.searchFilters.amenities.splice(index, 1)
      } else {
        state.searchFilters.amenities.push(amenity)
      }
    },
  },
})

export const {
  toggleTheme,
  setTheme,
  toggleSidebar,
  setSidebarOpen,
  toggleMobileMenu,
  setMobileMenuOpen,
  setLoading,
  addNotification,
  markNotificationRead,
  markAllNotificationsRead,
  removeNotification,
  clearNotifications,
  openModal,
  closeModal,
  updateSearchFilters,
  resetSearchFilters,
  setViewMode,
  setSortBy,
  setSortOrder,
  togglePlatformFilter,
  setPriceRange,
  setRatingFilter,
  toggleAmenityFilter
} = uiSlice.actions

export default uiSlice.reducer