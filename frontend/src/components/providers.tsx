'use client'

import { Provider } from 'react-redux'
import { store } from '@/lib/store'
import { useEffect } from 'react'
import { io } from 'socket.io-client'

let socket: any

export function Providers({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // 初始化Socket.io连接
    socket = io(process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:3000', {
      transports: ['websocket', 'polling']
    })

    socket.on('connect', () => {
      console.log('Connected to server')
    })

    socket.on('disconnect', () => {
      console.log('Disconnected from server')
    })

    socket.on('price-update', (data: any) => {
      console.log('Price update received:', data)
      // 可以在这里触发Redux action来更新价格
    })

    return () => {
      if (socket) {
        socket.disconnect()
      }
    }
  }, [])

  return (
    <Provider store={store}>
      {children}
    </Provider>
  )
}