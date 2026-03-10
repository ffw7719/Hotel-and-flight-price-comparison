import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'
import axios from 'axios'

interface SearchParams {
  city?: string
  checkIn?: string
  checkOut?: string
  guests?: number
  rooms?: number
  origin?: string
  destination?: string
  departureDate?: string
  returnDate?: string
  passengers?: number
  cabinClass?: string
  directOnly?: boolean
  maxStops?: number
}

interface SearchResult {
  searchId: string
  cached: boolean
  timestamp: string
  responseTime: number
  data: any
}

interface SearchState {
  hotelResults: SearchResult | null
  flightResults: SearchResult | null
  loading: boolean
  error: string | null
  searchHistory: any[]
  popularSearches: any[]
  currentSearch: SearchParams | null
}

const initialState: SearchState = {
  hotelResults: null,
  flightResults: null,
  loading: false,
  error: null,
  searchHistory: [],
  popularSearches: [],
  currentSearch: null,
}

// 异步actions
export const searchHotels = createAsyncThunk(
  'search/searchHotels',
  async (searchParams: SearchParams, { rejectWithValue }) => {
    try {
      const response = await axios.post('/api/search/hotels', searchParams)
      return response.data.data
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || '搜索酒店失败')
    }
  }
)

export const searchFlights = createAsyncThunk(
  'search/searchFlights',
  async (searchParams: SearchParams, { rejectWithValue }) => {
    try {
      const response = await axios.post('/api/search/flights', searchParams)
      return response.data.data
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || '搜索航班失败')
    }
  }
)

export const getSearchHistory = createAsyncThunk(
  'search/getSearchHistory',
  async (params: { type?: string; limit?: number; offset?: number }, { rejectWithValue }) => {
    try {
      const response = await axios.get('/api/search/history', { params })
      return response.data.data
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || '获取搜索历史失败')
    }
  }
)

export const getPopularSearches = createAsyncThunk(
  'search/getPopularSearches',
  async (params: { type?: string; limit?: number }, { rejectWithValue }) => {
    try {
      const response = await axios.get('/api/search/popular', { params })
      return response.data.data
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || '获取热门搜索失败')
    }
  }
)

export const deleteSearchHistory = createAsyncThunk(
  'search/deleteSearchHistory',
  async (searchId: string, { rejectWithValue }) => {
    try {
      await axios.delete(`/api/search/history/${searchId}`)
      return searchId
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || '删除搜索历史失败')
    }
  }
)

const searchSlice = createSlice({
  name: 'search',
  initialState,
  reducers: {
    clearResults: (state) => {
      state.hotelResults = null
      state.flightResults = null
      state.error = null
    },
    clearError: (state) => {
      state.error = null
    },
    setCurrentSearch: (state, action: PayloadAction<SearchParams>) => {
      state.currentSearch = action.payload
    },
    addToHistory: (state, action: PayloadAction<any>) => {
      state.searchHistory.unshift(action.payload)
      if (state.searchHistory.length > 50) {
        state.searchHistory = state.searchHistory.slice(0, 50)
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // 搜索酒店
      .addCase(searchHotels.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(searchHotels.fulfilled, (state, action) => {
        state.loading = false
        state.hotelResults = action.payload
        state.error = null
      })
      .addCase(searchHotels.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string
      })
      // 搜索航班
      .addCase(searchFlights.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(searchFlights.fulfilled, (state, action) => {
        state.loading = false
        state.flightResults = action.payload
        state.error = null
      })
      .addCase(searchFlights.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string
      })
      // 获取搜索历史
      .addCase(getSearchHistory.pending, (state) => {
        state.loading = true
      })
      .addCase(getSearchHistory.fulfilled, (state, action) => {
        state.loading = false
        state.searchHistory = action.payload.history
      })
      .addCase(getSearchHistory.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string
      })
      // 获取热门搜索
      .addCase(getPopularSearches.pending, (state) => {
        state.loading = true
      })
      .addCase(getPopularSearches.fulfilled, (state, action) => {
        state.loading = false
        state.popularSearches = action.payload
      })
      .addCase(getPopularSearches.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string
      })
      // 删除搜索历史
      .addCase(deleteSearchHistory.fulfilled, (state, action) => {
        state.searchHistory = state.searchHistory.filter(
          (item) => item.searchId !== action.payload
        )
      })
  },
})

export const { clearResults, clearError, setCurrentSearch, addToHistory } = searchSlice.actions

export default searchSlice.reducer