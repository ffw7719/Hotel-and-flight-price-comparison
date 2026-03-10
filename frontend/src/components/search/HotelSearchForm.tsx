'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Calendar, MapPin, Users, Bed } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { format } from 'date-fns'
import { zhCN } from 'date-fns/locale'

interface HotelSearchFormProps {
  onSearch: (searchParams: any) => void
  loading: boolean
}

interface HotelFormData {
  city: string
  checkIn: string
  checkOut: string
  guests: number
  rooms: number
  priceMin?: number
  priceMax?: number
  rating?: number
}

export function HotelSearchForm({ onSearch, loading }: HotelSearchFormProps) {
  const [selectedDate, setSelectedDate] = useState<{ checkIn: Date | null; checkOut: Date | null }>({
    checkIn: null,
    checkOut: null
  })

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue
  } = useForm<HotelFormData>({
    defaultValues: {
      guests: 2,
      rooms: 1
    }
  })

  const onSubmit = (data: HotelFormData) => {
    const searchParams = {
      ...data,
      checkIn: format(selectedDate.checkIn || new Date(), 'yyyy-MM-dd'),
      checkOut: format(selectedDate.checkOut || new Date(Date.now() + 24 * 60 * 60 * 1000), 'yyyy-MM-dd')
    }
    onSearch(searchParams)
  }

  const popularCities = [
    '北京', '上海', '广州', '深圳', '杭州', '成都', '西安', '南京'
  ]

  return (
    <div className="space-y-6">
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            目的地城市
          </label>
          <div className="relative">
            <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              {...register('city', { required: '请输入城市名称' })}
              placeholder="请输入城市名称，如：北京"
              className="pl-10"
            />
          </div>
          {errors.city && (
            <p className="mt-1 text-sm text-red-600">{errors.city.message}</p>
          )}
          
          {/* 热门城市 */}
          <div className="mt-3">
            <p className="text-sm text-gray-600 mb-2">热门城市：</p>
            <div className="flex flex-wrap gap-2">
              {popularCities.map((city) => (
                <Badge
                  key={city}
                  variant="outline"
                  className="cursor-pointer hover:bg-blue-50 hover:text-blue-600"
                  onClick={() => setValue('city', city)}
                >
                  {city}
                </Badge>
              ))}
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            入住和退房日期
          </label>
          <div className="grid grid-cols-2 gap-2">
            <div className="relative">
              <Calendar className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                type="date"
                {...register('checkIn', { required: '请选择入住日期' })}
                className="pl-10"
                min={format(new Date(), 'yyyy-MM-dd')}
                onChange={(e) => {
                  setValue('checkIn', e.target.value)
                  setSelectedDate(prev => ({
                    ...prev,
                    checkIn: e.target.value ? new Date(e.target.value) : null
                  }))
                }}
              />
            </div>
            <div className="relative">
              <Calendar className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                type="date"
                {...register('checkOut', { required: '请选择退房日期' })}
                className="pl-10"
                min={format(new Date(Date.now() + 24 * 60 * 60 * 1000), 'yyyy-MM-dd')}
                onChange={(e) => {
                  setValue('checkOut', e.target.value)
                  setSelectedDate(prev => ({
                    ...prev,
                    checkOut: e.target.value ? new Date(e.target.value) : null
                  }))
                }}
              />
            </div>
          </div>
          {errors.checkIn && (
            <p className="mt-1 text-sm text-red-600">{errors.checkIn.message}</p>
          )}
          {errors.checkOut && (
            <p className="mt-1 text-sm text-red-600">{errors.checkOut.message}</p>
          )}
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            客人数量
          </label>
          <div className="relative">
            <Users className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <select
              {...register('guests', { required: '请选择客人数量' })}
              className="w-full pl-10 h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <option value="1">1位客人</option>
              <option value="2">2位客人</option>
              <option value="3">3位客人</option>
              <option value="4">4位客人</option>
              <option value="5">5位客人</option>
              <option value="6">6位客人</option>
              <option value="7">7位客人</option>
              <option value="8">8位客人</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            房间数量
          </label>
          <div className="relative">
            <Bed className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <select
              {...register('rooms', { required: '请选择房间数量' })}
              className="w-full pl-10 h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <option value="1">1间房</option>
              <option value="2">2间房</option>
              <option value="3">3间房</option>
              <option value="4">4间房</option>
              <option value="5">5间房</option>
            </select>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            价格范围（可选）
          </label>
          <div className="grid grid-cols-2 gap-2">
            <Input
              type="number"
              {...register('priceMin')}
              placeholder="最低价格"
              min="0"
            />
            <Input
              type="number"
              {...register('priceMax')}
              placeholder="最高价格"
              min="0"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            最低评分（可选）
          </label>
          <select
            {...register('rating')}
            className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <option value="">不限</option>
            <option value="3">3分以上</option>
            <option value="3.5">3.5分以上</option>
            <option value="4">4分以上</option>
            <option value="4.5">4.5分以上</option>
          </select>
        </div>
      </div>

      <div className="flex justify-center">
        <Button
          type="submit"
          onClick={handleSubmit(onSubmit)}
          disabled={loading}
          className="w-full md:w-auto px-8 py-3"
        >
          {loading ? '搜索中...' : '搜索酒店'}
        </Button>
      </div>
    </div>
  )
}