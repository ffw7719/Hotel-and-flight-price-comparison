import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'
import axios from 'axios'

interface PriceAlert {
  id: string
  type: 'hotel' | 'flight'
  itemId: string
  targetPrice: number
  condition: 'below' | 'above'
  email?: string
  phone?: string
  active: boolean
  triggered: boolean
  createdAt: string
}

interface PriceHistory {
  timestamp: string
  price: number
  platform: string
  platformName: string
}

interface PriceStats {
  totalSearches: number
  avgPrice: number
  minPrice: number
  maxPrice: number
  priceChanges: number
  bestPlatform: string | null
  platformStats: any
}

interface PricesState {
  realTimePrices: { [key: string]: any }
  priceHistory: { [key: string]: PriceHistory[] }
  priceAlerts: PriceAlert[]
  priceStats: PriceStats | null
  loading: boolean
  error: string | null
}

const initialState: PricesState = {
  realTimePrices: {},
  priceHistory: {},
  priceAlerts: [],
  priceStats: null,
  loading: false,
  error: null,
}

// 异步actions
export const getRealTimePrice = createAsyncThunk(
  'prices/getRealTimePrice',
  async (params: { type: string; id: string; platform?: string }, { rejectWithValue }) => {
    try {
      const response = await axios.get('/api/prices/real-time', { params })
      return {
        key: `${params.type}-${params.id}${params.platform ? `-${params.platform}` : ''}`,
        data: response.data.data
      }
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || '获取实时价格失败')
    }
  }
)

export const getPriceHistory = createAsyncThunk(
  'prices/getPriceHistory',
  async (params: { type: string; id: string; days?: number }, { rejectWithValue }) => {
    try {
      const response = await axios.get('/api/prices/history', { params })
      return {
        key: `${params.type}-${params.id}`,
        data: response.data.data
      }
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || '获取价格历史失败')
    }
  }
)

export const getPriceAlert = createAsyncThunk(
  'prices/getPriceAlert',
  async (params: { type: string; id: string; targetPrice: number; condition?: string }, { rejectWithValue }) => {
    try {
      const response = await axios.get('/api/prices/alerts', { params })
      return response.data.data
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || '获取价格预警失败')
    }
  }
)

export const createPriceAlert = createAsyncThunk(
  'prices/createPriceAlert',
  async (alertData: Omit<PriceAlert, 'id' | 'active' | 'triggered' | 'createdAt'>, { rejectWithValue }) => {
    try {
      const response = await axios.post('/api/prices/alerts', alertData)
      return response.data.data
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || '创建价格预警失败')
    }
  }
)

export const getUserPriceAlerts = createAsyncThunk(
  'prices/getUserPriceAlerts',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get('/api/prices/alerts/user/current')
      return response.data.data
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || '获取用户价格预警失败')
    }
  }
)

export const deletePriceAlert = createAsyncThunk(
  'prices/deletePriceAlert',
  async (alertId: string, { rejectWithValue }) => {
    try {
      const response = await axios.delete(`/api/prices/alerts/${alertId}`)
      return { alertId, data: response.data.data }
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || '删除价格预警失败')
    }
  }
)

export const getPriceStats = createAsyncThunk(
  'prices/getPriceStats',
  async (params: { type: string; period?: string }, { rejectWithValue }) => {
    try {
      const response = await axios.get('/api/prices/stats', { params })
      return response.data.data
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || '获取价格统计失败')
    }
  }
)

const pricesSlice = createSlice({
  name: 'prices',
  initialState,
  reducers: {
    clearRealTimePrices: (state) => {
      state.realTimePrices = {}
    },
    clearPriceHistory: (state, action: PayloadAction<string>) => {
      const key = action.payload
      delete state.priceHistory[key]
    },
    clearError: (state) => {
      state.error = null
    },
    updateRealTimePrice: (state, action: PayloadAction<{ key: string; data: any }>) => {
      state.realTimePrices[action.payload.key] = action.payload.data
    },
    removePriceAlert: (state, action: PayloadAction<string>) => {
      state.priceAlerts = state.priceAlerts.filter(alert => alert.id !== action.payload)
    },
  },
  extraReducers: (builder) => {
    builder
      // 获取实时价格
      .addCase(getRealTimePrice.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(getRealTimePrice.fulfilled, (state, action) => {
        state.loading = false
        state.realTimePrices[action.payload.key] = action.payload.data
        state.error = null
      })
      .addCase(getRealTimePrice.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string
      })
      // 获取价格历史
      .addCase(getPriceHistory.pending, (state) => {
        state.loading = true
      })
      .addCase(getPriceHistory.fulfilled, (state, action) => {
        state.loading = false
        state.priceHistory[action.payload.key] = action.payload.data.history
        state.error = null
      })
      .addCase(getPriceHistory.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string
      })
      // 获取价格预警
      .addCase(getPriceAlert.pending, (state) => {
        state.loading = true
      })
      .addCase(getPriceAlert.fulfilled, (state) => {
        state.loading = false
        state.error = null
      })
      .addCase(getPriceAlert.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string
      })
      // 创建价格预警
      .addCase(createPriceAlert.pending, (state) => {
        state.loading = true
      })
      .addCase(createPriceAlert.fulfilled, (state, action) => {
        state.loading = false
        state.priceAlerts.unshift(action.payload)
        state.error = null
      })
      .addCase(createPriceAlert.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string
      })
      // 获取用户价格预警
      .addCase(getUserPriceAlerts.pending, (state) => {
        state.loading = true
      })
      .addCase(getUserPriceAlerts.fulfilled, (state, action) => {
        state.loading = false
        state.priceAlerts = action.payload
        state.error = null
      })
      .addCase(getUserPriceAlerts.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string
      })
      // 删除价格预警
      .addCase(deletePriceAlert.pending, (state) => {
        state.loading = true
      })
      .addCase(deletePriceAlert.fulfilled, (state, action) => {
        state.loading = false
        state.priceAlerts = state.priceAlerts.filter(alert => alert.id !== action.payload.alertId)
        state.error = null
      })
      .addCase(deletePriceAlert.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string
      })
      // 获取价格统计
      .addCase(getPriceStats.pending, (state) => {
        state.loading = true
      })
      .addCase(getPriceStats.fulfilled, (state, action) => {
        state.loading = false
        state.priceStats = action.payload
        state.error = null
      })
      .addCase(getPriceStats.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string
      })
  },
})

export const {
  clearRealTimePrices,
  clearPriceHistory,
  clearError,
  updateRealTimePrice,
  removePriceAlert
} = pricesSlice.actions

export default pricesSlice.reducer