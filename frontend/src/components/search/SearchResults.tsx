'use client'

import { useState } from 'react'
import { 
  Hotel, 
  Plane, 
  Star, 
  MapPin, 
  Clock, 
  DollarSign, 
  TrendingDown,
  Filter,
  Grid,
  List
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { formatPrice, getPlatformColor, getPlatformName, getRatingColor, getRatingText } from '@/lib/utils'

interface SearchResultsProps {
  hotelResults?: any
  flightResults?: any
  loading: boolean
}

export function SearchResults({ hotelResults, flightResults, loading }: SearchResultsProps) {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [sortBy, setSortBy] = useState<'price' | 'rating' | 'name'>('price')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">正在搜索中，请稍候...</p>
        </div>
      </div>
    )
  }

  if (!hotelResults && !flightResults) {
    return null
  }

  return (
    <div className="space-y-6">
      {/* 搜索结果统计 */}
      <div className="grid md:grid-cols-2 gap-4">
        {hotelResults && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Hotel className="h-5 w-5 text-blue-600" />
                <span>酒店搜索结果</span>
              </CardTitle>
              <CardDescription>
                找到 {hotelResults.data?.hotels?.length || 0} 家酒店
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">平均价格：</span>
                  <span className="font-medium ml-1">
                    {formatPrice(hotelResults.data?.summary?.avgPrice || 0)}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">节省金额：</span>
                  <span className="font-medium text-green-600 ml-1">
                    {formatPrice(hotelResults.data?.summary?.totalSavings || 0)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {flightResults && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Plane className="h-5 w-5 text-green-600" />
                <span>航班搜索结果</span>
              </CardTitle>
              <CardDescription>
                找到 {flightResults.data?.flights?.length || 0} 个航班
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">平均价格：</span>
                  <span className="font-medium ml-1">
                    {formatPrice(flightResults.data?.summary?.avgPrice || 0)}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">节省金额：</span>
                  <span className="font-medium text-green-600 ml-1">
                    {formatPrice(flightResults.data?.summary?.totalSavings || 0)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* 搜索结果详情 */}
      <Tabs defaultValue={hotelResults ? 'hotels' : 'flights'}>
        <TabsList className="grid w-full grid-cols-2">
          {hotelResults && (
            <TabsTrigger value="hotels">酒店结果</TabsTrigger>
          )}
          {flightResults && (
            <TabsTrigger value="flights">航班结果</TabsTrigger>
          )}
        </TabsList>

        {hotelResults && (
          <TabsContent value="hotels" className="mt-6">
            <HotelResults 
              results={hotelResults.data} 
              viewMode={viewMode}
              sortBy={sortBy}
              sortOrder={sortOrder}
              onViewModeChange={setViewMode}
              onSortChange={setSortBy}
              onSortOrderChange={setSortOrder}
            />
          </TabsContent>
        )}

        {flightResults && (
          <TabsContent value="flights" className="mt-6">
            <FlightResults 
              results={flightResults.data}
              viewMode={viewMode}
              sortBy={sortBy}
              sortOrder={sortOrder}
              onViewModeChange={setViewMode}
              onSortChange={setSortBy}
              onSortOrderChange={setSortOrder}
            />
          </TabsContent>
        )}
      </Tabs>
    </div>
  )
}

interface HotelResultsProps {
  results: any
  viewMode: 'grid' | 'list'
  sortBy: 'price' | 'rating' | 'name'
  sortOrder: 'asc' | 'desc'
  onViewModeChange: (mode: 'grid' | 'list') => void
  onSortChange: (sort: 'price' | 'rating' | 'name') => void
  onSortOrderChange: (order: 'asc' | 'desc') => void
}

function HotelResults({ 
  results, 
  viewMode, 
  sortBy, 
  sortOrder, 
  onViewModeChange, 
  onSortChange, 
  onSortOrderChange 
}: HotelResultsProps) {
  const sortedHotels = [...(results.hotels || [])].sort((a, b) => {
    switch (sortBy) {
      case 'price':
        return sortOrder === 'asc' ? a.minPrice - b.minPrice : b.minPrice - a.minPrice
      case 'rating':
        return sortOrder === 'asc' ? (a.cheapestOption?.rating || 0) - (b.cheapestOption?.rating || 0) : (b.cheapestOption?.rating || 0) - (a.cheapestOption?.rating || 0)
      case 'name':
        return sortOrder === 'asc' ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name)
      default:
        return 0
    }
  })

  return (
    <div className="space-y-4">
      {/* 排序和视图控制 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Filter className="h-4 w-4 text-gray-400" />
            <select
              value={sortBy}
              onChange={(e) => onSortChange(e.target.value as any)}
              className="h-8 rounded-md border border-gray-300 px-2 text-sm"
            >
              <option value="price">按价格排序</option>
              <option value="rating">按评分排序</option>
              <option value="name">按名称排序</option>
            </select>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onSortOrderChange(sortOrder === 'asc' ? 'desc' : 'asc')}
          >
            {sortOrder === 'asc' ? '升序' : '降序'}
          </Button>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant={viewMode === 'grid' ? 'default' : 'outline'}
            size="sm"
            onClick={() => onViewModeChange('grid')}
          >
            <Grid className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === 'list' ? 'default' : 'outline'}
            size="sm"
            onClick={() => onViewModeChange('list')}
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* 酒店列表 */}
      <div className={viewMode === 'grid' ? 'grid md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-4'}>
        {sortedHotels.map((hotel: any) => (
          <HotelCard key={hotel.name} hotel={hotel} viewMode={viewMode} />
        ))}
      </div>
    </div>
  )
}

interface HotelCardProps {
  hotel: any
  viewMode: 'grid' | 'list'
}

function HotelCard({ hotel, viewMode }: HotelCardProps) {
  const cheapestOption = hotel.cheapestOption
  const savings = hotel.savings > 0

  return (
    <Card className={`hover:shadow-lg transition-shadow ${viewMode === 'list' ? 'flex' : ''}`}>
      <div className={viewMode === 'list' ? 'flex-1' : ''}>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-lg">{hotel.name}</CardTitle>
              {cheapestOption?.rating && (
                <div className="flex items-center space-x-1 mt-1">
                  <Star className="h-4 w-4 fill-current text-yellow-400" />
                  <span className={`text-sm font-medium ${getRatingColor(cheapestOption.rating)}`}>
                    {cheapestOption.rating}
                  </span>
                  <span className="text-sm text-gray-500">
                    ({getRatingText(cheapestOption.rating)})
                  </span>
                </div>
              )}
            </div>
            {savings && (
              <Badge variant="destructive" className="flex items-center space-x-1">
                <TrendingDown className="h-3 w-3" />
                <span>省{formatPrice(hotel.savings)}</span>
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {/* 价格信息 */}
            <div className="flex items-center justify-between">
              <div>
                <span className="text-2xl font-bold text-blue-600">
                  {formatPrice(hotel.minPrice)}
                </span>
                <span className="text-sm text-gray-500 ml-1">
                  起
                </span>
              </div>
              <div className="text-right text-sm text-gray-500">
                <div>最高: {formatPrice(hotel.maxPrice)}</div>
                <div>平均: {formatPrice(hotel.avgPrice)}</div>
              </div>
            </div>

            {/* 最便宜选项 */}
            {cheapestOption && (
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                <div className="flex items-center space-x-2">
                  <Badge 
                    className="text-white"
                    style={{ backgroundColor: getPlatformColor(cheapestOption.platform) }}
                  >
                    {getPlatformName(cheapestOption.platform)}
                  </Badge>
                  <span className="text-sm text-gray-600">最优惠</span>
                </div>
                <div className="text-right">
                  <div className="font-medium">{formatPrice(cheapestOption.price)}</div>
                  <div className="text-xs text-gray-500">
                    {cheapestOption.platformName}
                  </div>
                </div>
              </div>
            )}

            {/* 位置信息 */}
            {cheapestOption?.location && (
              <div className="flex items-center space-x-1 text-sm text-gray-600">
                <MapPin className="h-4 w-4" />
                <span>{cheapestOption.location}</span>
              </div>
            )}

            {/* 推荐信息 */}
            {hotel.recommendation && (
              <div className="text-sm text-blue-600 bg-blue-50 p-2 rounded-md">
                {hotel.recommendation}
              </div>
            )}

            {/* 操作按钮 */}
            <div className="flex space-x-2">
              <Button size="sm" className="flex-1">
                查看详情
              </Button>
              <Button variant="outline" size="sm">
                <DollarSign className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </div>
    </Card>
  )
}

interface FlightResultsProps {
  results: any
  viewMode: 'grid' | 'list'
  sortBy: 'price' | 'rating' | 'name'
  sortOrder: 'asc' | 'desc'
  onViewModeChange: (mode: 'grid' | 'list') => void
  onSortChange: (sort: 'price' | 'rating' | 'name') => void
  onSortOrderChange: (order: 'asc' | 'desc') => void
}

function FlightResults({ 
  results, 
  viewMode, 
  sortBy, 
  sortOrder, 
  onViewModeChange, 
  onSortChange, 
  onSortOrderChange 
}: FlightResultsProps) {
  const sortedFlights = [...(results.flights || [])].sort((a, b) => {
    switch (sortBy) {
      case 'price':
        return sortOrder === 'asc' ? a.minPrice - b.minPrice : b.minPrice - a.minPrice
      case 'rating':
        return sortOrder === 'asc' ? (a.cheapestOption?.rating || 0) - (b.cheapestOption?.rating || 0) : (b.cheapestOption?.rating || 0) - (a.cheapestOption?.rating || 0)
      case 'name':
        return sortOrder === 'asc' ? a.timeSlot.localeCompare(b.timeSlot) : b.timeSlot.localeCompare(a.timeSlot)
      default:
        return 0
    }
  })

  return (
    <div className="space-y-4">
      {/* 排序和视图控制 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Filter className="h-4 w-4 text-gray-400" />
            <select
              value={sortBy}
              onChange={(e) => onSortChange(e.target.value as any)}
              className="h-8 rounded-md border border-gray-300 px-2 text-sm"
            >
              <option value="price">按价格排序</option>
              <option value="name">按时间排序</option>
            </select>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onSortOrderChange(sortOrder === 'asc' ? 'desc' : 'asc')}
          >
            {sortOrder === 'asc' ? '升序' : '降序'}
          </Button>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant={viewMode === 'grid' ? 'default' : 'outline'}
            size="sm"
            onClick={() => onViewModeChange('grid')}
          >
            <Grid className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === 'list' ? 'default' : 'outline'}
            size="sm"
            onClick={() => onViewModeChange('list')}
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* 航班列表 */}
      <div className={viewMode === 'grid' ? 'grid md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-4'}>
        {sortedFlights.map((flight: any) => (
          <FlightCard key={flight.timeSlot} flight={flight} viewMode={viewMode} />
        ))}
      </div>
    </div>
  )
}

interface FlightCardProps {
  flight: any
  viewMode: 'grid' | 'list'
}

function FlightCard({ flight, viewMode }: FlightCardProps) {
  const cheapestOption = flight.cheapestOption
  const savings = flight.savings > 0

  return (
    <Card className={`hover:shadow-lg transition-shadow ${viewMode === 'list' ? 'flex' : ''}`}>
      <div className={viewMode === 'list' ? 'flex-1' : ''}>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-lg">{flight.timeSlot}</CardTitle>
              <div className="flex items-center space-x-1 mt-1">
                <Plane className="h-4 w-4 text-gray-400" />
                <span className="text-sm text-gray-600">
                  {cheapestOption?.airline}
                </span>
                {cheapestOption?.stops === 0 && (
                  <Badge variant="outline" className="text-green-600">
                    直飞
                  </Badge>
                )}
              </div>
            </div>
            {savings && (
              <Badge variant="destructive" className="flex items-center space-x-1">
                <TrendingDown className="h-3 w-3" />
                <span>省{formatPrice(flight.savings)}</span>
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {/* 价格信息 */}
            <div className="flex items-center justify-between">
              <div>
                <span className="text-2xl font-bold text-green-600">
                  {formatPrice(flight.minPrice)}
                </span>
                <span className="text-sm text-gray-500 ml-1">
                  起
                </span>
              </div>
              <div className="text-right text-sm text-gray-500">
                <div>最高: {formatPrice(flight.maxPrice)}</div>
                <div>平均: {formatPrice(flight.avgPrice)}</div>
              </div>
            </div>

            {/* 最便宜选项 */}
            {cheapestOption && (
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                <div className="flex items-center space-x-2">
                  <Badge 
                    className="text-white"
                    style={{ backgroundColor: getPlatformColor(cheapestOption.platform) }}
                  >
                    {getPlatformName(cheapestOption.platform)}
                  </Badge>
                  <span className="text-sm text-gray-600">最优惠</span>
                </div>
                <div className="text-right">
                  <div className="font-medium">{formatPrice(cheapestOption.price)}</div>
                  <div className="text-xs text-gray-500">
                    {cheapestOption.departureTime} - {cheapestOption.arrivalTime}
                  </div>
                </div>
              </div>
            )}

            {/* 航班信息 */}
            <div className="flex items-center justify-between text-sm text-gray-600">
              <div className="flex items-center space-x-1">
                <Clock className="h-4 w-4" />
                <span>{flight.timeSlot}</span>
              </div>
              <div>
                {flight.platformCount} 个平台
              </div>
            </div>

            {/* 推荐信息 */}
            {flight.recommendation && (
              <div className="text-sm text-green-600 bg-green-50 p-2 rounded-md">
                {flight.recommendation}
              </div>
            )}

            {/* 操作按钮 */}
            <div className="flex space-x-2">
              <Button size="sm" className="flex-1">
                查看详情
              </Button>
              <Button variant="outline" size="sm">
                <DollarSign className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </div>
    </Card>
  )
}