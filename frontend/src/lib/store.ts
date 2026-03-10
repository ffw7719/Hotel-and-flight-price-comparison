import { configureStore } from '@reduxjs/toolkit'
import searchReducer from './slices/searchSlice'
import pricesReducer from './slices/pricesSlice'
import platformsReducer from './slices/platformsSlice'
import userReducer from './slices/userSlice'
import uiReducer from './slices/uiSlice'

export const store = configureStore({
  reducer: {
    search: searchReducer,
    prices: pricesReducer,
    platforms: platformsReducer,
    user: userReducer,
    ui: uiReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
      },
    }),
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch