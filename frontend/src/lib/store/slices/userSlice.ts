import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'
import axios from 'axios'

interface User {
  id: string
  username: string
  email: string
  phone?: string
  preferences: {
    currency: string
    language: string
    notifications: {
      email: boolean
      priceAlert: boolean
      marketing: boolean
    }
    searchHistory: {
      enabled: boolean
      maxItems: number
    }
    defaultPlatforms: string[]
  }
  profile: {
    firstName?: string
    lastName?: string
    avatar: string
    bio?: string
    location?: string
  }
  statistics: {
    totalSearches: number
    totalSavings: number
    favoritePlatforms: { [key: string]: number }
    lastSearchType?: 'hotel' | 'flight'
  }
  isActive: boolean
  isVerified: boolean
  role: string
  createdAt: string
  lastLogin?: string
}

interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  loading: boolean
  error: string | null
}

const initialState: AuthState = {
  user: null,
  token: null,
  isAuthenticated: false,
  loading: false,
  error: null,
}

// 异步actions
export const register = createAsyncThunk(
  'user/register',
  async (userData: {
    username: string
    email: string
    password: string
    phone?: string
    preferences?: any
  }, { rejectWithValue }) => {
    try {
      const response = await axios.post('/api/users/register', userData)
      return response.data.data
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || '注册失败')
    }
  }
)

export const login = createAsyncThunk(
  'user/login',
  async (credentials: { email: string; password: string }, { rejectWithValue }) => {
    try {
      const response = await axios.post('/api/users/login', credentials)
      return response.data.data
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || '登录失败')
    }
  }
)

export const getProfile = createAsyncThunk(
  'user/getProfile',
  async (_, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        throw new Error('No token found')
      }
      
      const response = await axios.get('/api/users/profile', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })
      return response.data.data
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || '获取用户信息失败')
    }
  }
)

export const updateProfile = createAsyncThunk(
  'user/updateProfile',
  async (profileData: Partial<User>, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token')
      const response = await axios.put('/api/users/profile', profileData, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })
      return response.data.data
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || '更新用户信息失败')
    }
  }
)

export const changePassword = createAsyncThunk(
  'user/changePassword',
  async (passwordData: { currentPassword: string; newPassword: string }, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token')
      const response = await axios.put('/api/users/password', passwordData, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })
      return response.data.data
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || '修改密码失败')
    }
  }
)

export const getUserSearchHistory = createAsyncThunk(
  'user/getUserSearchHistory',
  async (params: { limit?: number; offset?: number }, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token')
      const response = await axios.get('/api/users/search-history', {
        headers: {
          Authorization: `Bearer ${token}`
        },
        params
      })
      return response.data.data
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || '获取搜索历史失败')
    }
  }
)

export const getUserPriceAlerts = createAsyncThunk(
  'user/getUserPriceAlerts',
  async (_, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token')
      const response = await axios.get('/api/users/price-alerts', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })
      return response.data.data
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || '获取价格预警失败')
    }
  }
)

export const deleteAccount = createAsyncThunk(
  'user/deleteAccount',
  async (_, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token')
      const response = await axios.delete('/api/users/account', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })
      return response.data.data
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || '删除账户失败')
    }
  }
)

export const verifyToken = createAsyncThunk(
  'user/verifyToken',
  async (token: string, { rejectWithValue }) => {
    try {
      const response = await axios.post('/api/users/verify-token', { token })
      return response.data.data
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || '验证令牌失败')
    }
  }
)

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    logout: (state) => {
      state.user = null
      state.token = null
      state.isAuthenticated = false
      localStorage.removeItem('token')
    },
    clearError: (state) => {
      state.error = null
    },
    setToken: (state, action: PayloadAction<string>) => {
      state.token = action.payload
      localStorage.setItem('token', action.payload)
    },
    updateUserPreferences: (state, action: PayloadAction<Partial<User['preferences']>>) => {
      if (state.user) {
        state.user.preferences = {
          ...state.user.preferences,
          ...action.payload
        }
      }
    },
    updateUserProfile: (state, action: PayloadAction<Partial<User['profile']>>) => {
      if (state.user) {
        state.user.profile = {
          ...state.user.profile,
          ...action.payload
        }
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // 注册
      .addCase(register.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(register.fulfilled, (state, action) => {
        state.loading = false
        state.user = action.payload.user
        state.token = action.payload.token
        state.isAuthenticated = true
        localStorage.setItem('token', action.payload.token)
        state.error = null
      })
      .addCase(register.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string
      })
      // 登录
      .addCase(login.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(login.fulfilled, (state, action) => {
        state.loading = false
        state.user = action.payload.user
        state.token = action.payload.token
        state.isAuthenticated = true
        localStorage.setItem('token', action.payload.token)
        state.error = null
      })
      .addCase(login.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string
      })
      // 获取用户信息
      .addCase(getProfile.pending, (state) => {
        state.loading = true
      })
      .addCase(getProfile.fulfilled, (state, action) => {
        state.loading = false
        state.user = action.payload
        state.isAuthenticated = true
        state.error = null
      })
      .addCase(getProfile.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string
        state.isAuthenticated = false
        state.user = null
        state.token = null
        localStorage.removeItem('token')
      })
      // 更新用户信息
      .addCase(updateProfile.pending, (state) => {
        state.loading = true
      })
      .addCase(updateProfile.fulfilled, (state, action) => {
        state.loading = false
        state.user = action.payload
        state.error = null
      })
      .addCase(updateProfile.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string
      })
      // 修改密码
      .addCase(changePassword.pending, (state) => {
        state.loading = true
      })
      .addCase(changePassword.fulfilled, (state) => {
        state.loading = false
        state.error = null
      })
      .addCase(changePassword.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string
      })
      // 获取用户搜索历史
      .addCase(getUserSearchHistory.pending, (state) => {
        state.loading = true
      })
      .addCase(getUserSearchHistory.fulfilled, (state) => {
        state.loading = false
        state.error = null
      })
      .addCase(getUserSearchHistory.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string
      })
      // 获取用户价格预警
      .addCase(getUserPriceAlerts.pending, (state) => {
        state.loading = true
      })
      .addCase(getUserPriceAlerts.fulfilled, (state) => {
        state.loading = false
        state.error = null
      })
      .addCase(getUserPriceAlerts.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string
      })
      // 删除账户
      .addCase(deleteAccount.pending, (state) => {
        state.loading = true
      })
      .addCase(deleteAccount.fulfilled, (state) => {
        state.loading = false
        state.user = null
        state.token = null
        state.isAuthenticated = false
        localStorage.removeItem('token')
        state.error = null
      })
      .addCase(deleteAccount.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string
      })
      // 验证令牌
      .addCase(verifyToken.pending, (state) => {
        state.loading = true
      })
      .addCase(verifyToken.fulfilled, (state, action) => {
        state.loading = false
        state.user = action.payload.user
        state.token = action.payload.token
        state.isAuthenticated = true
        localStorage.setItem('token', action.payload.token)
        state.error = null
      })
      .addCase(verifyToken.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string
        state.isAuthenticated = false
        state.user = null
        state.token = null
        localStorage.removeItem('token')
      })
  },
})

export const {
  logout,
  clearError,
  setToken,
  updateUserPreferences,
  updateUserProfile
} = userSlice.actions

export default userSlice.reducer