'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Plane, Calendar, Users, MapPin } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { format } from 'date-fns'

interface FlightSearchFormProps {
  onSearch: (searchParams: any) => void
  loading: boolean
}

interface FlightFormData {
  origin: string
  destination: string
  departureDate: string
  returnDate?: string
  passengers: number
  cabinClass: 'economy' | 'business' | 'first'
  directOnly: boolean
  maxStops: number
}

export function FlightSearchForm({ onSearch, loading }: FlightSearchFormProps) {
  const [isRoundTrip, setIsRoundTrip] = useState(true)
  const [selectedDate, setSelectedDate] = useState<{ departure: Date | null; return: Date | null }>({
    departure: null,
    return: null
  })

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue
  } = useForm<FlightFormData>({
    defaultValues: {
      passengers: 1,
      cabinClass: 'economy',
      directOnly: false,
      maxStops: 2
    }
  })

  const onSubmit = (data: FlightFormData) => {
    const searchParams = {
      ...data,
      departureDate: format(selectedDate.departure || new Date(), 'yyyy-MM-dd'),
      returnDate: isRoundTrip && selectedDate.return ? format(selectedDate.return, 'yyyy-MM-dd') : undefined
    }
    onSearch(searchParams)
  }

  const popularRoutes = [
    { origin: 'BJS', destination: 'SHA', name: '北京-上海' },
    { origin: 'BJS', destination: 'CAN', name: '北京-广州' },
    { origin: 'SHA', destination: 'CAN', name: '上海-广州' },
    { origin: 'BJS', destination: 'SZX', name: '北京-深圳' },
    { origin: 'SHA', destination:SZX, name: '上海-深圳' },
    { origin: 'CAN', destination: 'CTU', name: '广州-成都' }
  ]

  const airports = {
    'BJS': '北京',
    'SHA': '上海', 
    'CAN': '广州',
    'SZX': '深圳',
    'CTU': '成都',
    'XIY': '西安',
    'NKG': '南京',
    'HGH': '杭州'
  }

  return (
    <div className="space-y-6">
      {/* 往返/单程选择 */}
      <div className="flex space-x-4">
        <button
          type="button"
          onClick={() => setIsRoundTrip(true)}
          className={`px-4 py-2 rounded-md text-sm font-medium ${
            isRoundTrip 
              ? 'bg-blue-600 text-white' 
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          往返
        </button>
        <button
          type="button"
          onClick={() => setIsRoundTrip(false)}
          className={`px-4 py-2 rounded-md text-sm font-medium ${
            !isRoundTrip 
              ? 'bg-blue-600 text-white' 
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          单程
        </button>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            出发地
          </label>
          <div className="relative">
            <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              {...register('origin', { 
                required: '请输入出发地',
                pattern: {
                  value: /^[A-Z]{3}$/,
                  message: '请输入3位机场代码，如：BJS'
                }
              })}
              placeholder="机场代码，如：BJS"
              className="pl-10 uppercase"
              maxLength={3}
            />
          </div>
          {errors.origin && (
            <p className="mt-1 text-sm text-red-600">{errors.origin.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            目的地
          </label>
          <div className="relative">
            <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              {...register('destination', { 
                required: '请输入目的地',
                pattern: {
                  value: /^[A-Z]{3}$/,
                  message: '请输入3位机场代码，如：SHA'
                }
              })}
              placeholder="机场代码，如：SHA"
              className="pl-10 uppercase"
              maxLength={3}
            />
          </div>
          {errors.destination && (
            <p className="mt-1 text-sm text-red-600">{errors.destination.message}</p>
          )}
        </div>
      </div>

      {/* 热门航线 */}
      <div>
        <p className="text-sm text-gray-600 mb-2">热门航线：</p>
        <div className="flex flex-wrap gap-2">
          {popularRoutes.map((route) => (
            <Badge
              key={route.name}
              variant="outline"
              className="cursor-pointer hover:bg-blue-50 hover:text-blue-600"
              onClick={() => {
                setValue('origin', route.origin)
                setValue('destination', route.destination)
              }}
            >
              {route.name}
            </Badge>
          ))}
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            出发日期
          </label>
          <div className="relative">
            <Calendar className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              type="date"
              {...register('departureDate', { required: '请选择出发日期' })}
              className="pl-10"
              min={format(new Date(), 'yyyy-MM-dd')}
              onChange={(e) => {
                setValue('departureDate', e.target.value)
                setSelectedDate(prev => ({
                  ...prev,
                  departure: e.target.value ? new Date(e.target.value) : null
                }))
              }}
            />
          </div>
          {errors.departureDate && (
            <p className="mt-1 text-sm text-red-600">{errors.departureDate.message}</p>
          )}
        </div>

        {isRoundTrip && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              返程日期
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                type="date"
                {...register('returnDate')}
                className="pl-10"
                min={format(new Date(Date.now() + 24 * 60 * 60 * 1000), 'yyyy-MM-dd')}
                onChange={(e) => {
                  setValue('returnDate', e.target.value)
                  setSelectedDate(prev => ({
                    ...prev,
                    return: e.target.value ? new Date(e.target.value) : null
                  }))
                }}
              />
            </div>
          </div>
        )}
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            乘客人数
          </label>
          <div className="relative">
            <Users className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <select
              {...register('passengers', { required: '请选择乘客人数' })}
              className="w-full pl-10 h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <option value="1">1位乘客</option>
              <option value="2">2位乘客</option>
              <option value="3">3位乘客</option>
              <option value="4">4位乘客</option>
              <option value="5">5位乘客</option>
              <option value="6">6位乘客</option>
              <option value="7">7位乘客</option>
              <option value="8">8位乘客</option>
              <option value="9">9位乘客</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            舱位等级
          </label>
          <select
            {...register('cabinClass')}
            className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <option value="economy">经济舱</option>
            <option value="business">商务舱</option>
            <option value="first">头等舱</option>
          </select>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            直飞偏好
          </label>
          <div className="flex items-center space-x-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                {...register('directOnly')}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-700">仅显示直飞航班</span>
            </label>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            最大中转次数
          </label>
          <select
            {...register('maxStops')}
            className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <option value="0">直飞</option>
            <option value="1">最多1次中转</option>
            <option value="2">最多2次中转</option>
            <option value="3">最多3次中转</option>
          </select>
        </div>
      </div>

      {/* 机场代码参考 */}
      <div className="bg-gray-50 p-4 rounded-md">
        <h4 className="text-sm font-medium text-gray-700 mb-2">常用机场代码：</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs text-gray-600">
          {Object.entries(airports).map(([code, city]) => (
            <div key={code}>
              <span className="font-medium">{code}:</span> {city}
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-center">
        <Button
          type="submit"
          onClick={handleSubmit(onSubmit)}
          disabled={loading}
          className="w-full md:w-auto px-8 py-3"
        >
          {loading ? '搜索中...' : '搜索航班'}
        </Button>
      </div>
    </div>
  )
}