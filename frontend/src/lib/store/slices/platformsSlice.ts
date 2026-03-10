import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'
import axios from 'axios'

interface Platform {
  id: string
  name: string
  baseUrl: string
  enabled: boolean
  features: string[]
  description: string
  logo: string
  color: string
  stats?: {
    totalHotels: number
    totalFlights: number
    avgResponseTime: number
    successRate: number
  }
}

interface PlatformStatus {
  platform: string
  online: boolean
  responseTime: number
  lastChecked: string
  features: {
    hotels: boolean
    flights: boolean
    realTime: boolean
    booking: boolean
  }
  issues: string[]
}

interface PlatformStats {
  platform: string
  period: {
    start: string
    end: string
    label: string
  }
  searches: number
  hotels: number
  flights: number
  avgResponseTime: number
  successRate: number
  errors: number
  dailyStats: Array<{
    date: string
    searches: number
    successRate: number
    avgResponseTime: number
  }>
}

interface PlatformsState {
  platforms: Platform[]
  platformStatuses: { [key: string]: PlatformStatus }
  platformStats: { [key: string]: PlatformStats }
  loading: boolean
  error: string | null
  selectedPlatforms: string[]
}

const initialState: PlatformsState = {
  platforms: [],
  platformStatuses: {},
  platformStats: {},
  loading: false,
  error: null,
  selectedPlatforms: ['meituan', 'ctrip', 'fliggy'],
}

// 异步actions
export const getPlatforms = createAsyncThunk(
  'platforms/getPlatforms',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get('/api/platforms')
      return response.data.data
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || '获取平台列表失败')
    }
  }
)

export const getPlatform = createAsyncThunk(
  'platforms/getPlatform',
  async (platformId: string, { rejectWithValue }) => {
    try {
      const response = await axios.get(`/api/platforms/${platformId}`)
      return response.data.data
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || '获取平台信息失败')
    }
  }
)

export const getPlatformStatus = createAsyncThunk(
  'platforms/getPlatformStatus',
  async (platformId: string, { rejectWithValue }) => {
    try {
      const response = await axios.get(`/api/platforms/${platformId}/status`)
      return {
        platformId,
        data: response.data.data
      }
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || '获取平台状态失败')
    }
  }
)

export const updatePlatformConfig = createAsyncThunk(
  'platforms/updatePlatformConfig',
  async ({ platformId, config }: { platformId: string; config: any }, { rejectWithValue }) => {
    try {
      const response = await axios.put(`/api/platforms/${platformId}/config`, config)
      return {
        platformId,
        data: response.data.data
      }
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || '更新平台配置失败')
    }
  }
)

export const getPlatformStats = createAsyncThunk(
  'platforms/getPlatformStats',
  async ({ platformId, period }: { platformId: string; period?: string }, { rejectWithValue }) => {
    try {
      const response = await axios.get(`/api/platforms/${platformId}/stats`, {
        params: { period }
      })
      return {
        platformId,
        data: response.data.data
      }
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || '获取平台统计失败')
    }
  }
)

export const testPlatformConnection = createAsyncThunk(
  'platforms/testPlatformConnection',
  async (platformId: string, { rejectWithValue }) => {
    try {
      const response = await axios.post(`/api/platforms/${platformId}/test`)
      return {
        platformId,
        data: response.data.data
      }
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || '测试平台连接失败')
    }
  }
)

const platformsSlice = createSlice({
  name: 'platforms',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null
    },
    setSelectedPlatforms: (state, action: PayloadAction<string[]>) => {
      state.selectedPlatforms = action.payload
    },
    togglePlatform: (state, action: PayloadAction<string>) => {
      const platformId = action.payload
      const index = state.selectedPlatforms.indexOf(platformId)
      if (index > -1) {
        state.selectedPlatforms.splice(index, 1)
      } else {
        state.selectedPlatforms.push(platformId)
      }
    },
    clearPlatformStatuses: (state) => {
      state.platformStatuses = {}
    },
    clearPlatformStats: (state) => {
      state.platformStats = {}
    },
  },
  extraReducers: (builder) => {
    builder
      // 获取平台列表
      .addCase(getPlatforms.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(getPlatforms.fulfilled, (state, action) => {
        state.loading = false
        state.platforms = action.payload
        state.error = null
      })
      .addCase(getPlatforms.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string
      })
      // 获取平台信息
      .addCase(getPlatform.pending, (state) => {
        state.loading = true
      })
      .addCase(getPlatform.fulfilled, (state, action) => {
        state.loading = false
        const index = state.platforms.findIndex(p => p.id === action.payload.id)
        if (index > -1) {
          state.platforms[index] = action.payload
        } else {
          state.platforms.push(action.payload)
        }
        state.error = null
      })
      .addCase(getPlatform.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string
      })
      // 获取平台状态
      .addCase(getPlatformStatus.pending, (state) => {
        state.loading = true
      })
      .addCase(getPlatformStatus.fulfilled, (state, action) => {
        state.loading = false
        state.platformStatuses[action.payload.platformId] = action.payload.data
        state.error = null
      })
      .addCase(getPlatformStatus.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string
      })
      // 更新平台配置
      .addCase(updatePlatformConfig.pending, (state) => {
        state.loading = true
      })
      .addCase(updatePlatformConfig.fulfilled, (state, action) => {
        state.loading = false
        const index = state.platforms.findIndex(p => p.id === action.payload.platformId)
        if (index > -1) {
          state.platforms[index] = {
            ...state.platforms[index],
            ...action.payload.data
          }
        }
        state.error = null
      })
      .addCase(updatePlatformConfig.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string
      })
      // 获取平台统计
      .addCase(getPlatformStats.pending, (state) => {
        state.loading = true
      })
      .addCase(getPlatformStats.fulfilled, (state, action) => {
        state.loading = false
        state.platformStats[action.payload.platformId] = action.payload.data
        state.error = null
      })
      .addCase(getPlatformStats.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string
      })
      // 测试平台连接
      .addCase(testPlatformConnection.pending, (state) => {
        state.loading = true
      })
      .addCase(testPlatformConnection.fulfilled, (state, action) => {
        state.loading = false
        state.platformStatuses[action.payload.platformId] = {
          ...state.platformStatuses[action.payload.platformId],
          ...action.payload.data
        }
        state.error = null
      })
      .addCase(testPlatformConnection.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string
      })
  },
})

export const {
  clearError,
  setSelectedPlatforms,
  togglePlatform,
  clearPlatformStatuses,
  clearPlatformStats
} = platformsSlice.actions

export default platformsSlice.reducer