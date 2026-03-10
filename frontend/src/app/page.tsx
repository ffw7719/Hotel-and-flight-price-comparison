'use client'

import { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Search, Plane, Hotel, TrendingUp, Star, Clock } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { searchHotels, searchFlights } from '@/lib/store/slices/searchSlice'
import { getPlatforms } from '@/lib/store/slices/platformsSlice'
import { RootState, AppDispatch } from '@/lib/store'
import { HotelSearchForm } from '@/components/search/HotelSearchForm'
import { FlightSearchForm } from '@/components/search/FlightSearchForm'
import { SearchResults } from '@/components/search/SearchResults'
import { PriceChart } from '@/components/charts/PriceChart'
import { PlatformStatus } from '@/components/platforms/PlatformStatus'
import toast from 'react-hot-toast'

export default function Home() {
  const dispatch = useDispatch<AppDispatch>()
  const { hotelResults, flightResults, loading, error } = useSelector((state: RootState) => state.search)
  const { platforms } = useSelector((state: RootState) => state.platforms)
  const [activeTab, setActiveTab] = useState('hotels')

  useEffect(() => {
    dispatch(getPlatforms())
  }, [dispatch])

  useEffect(() => {
    if (error) {
      toast.error(error)
    }
  }, [error])

  const handleHotelSearch = async (searchParams: any) => {
    try {
      await dispatch(searchHotels(searchParams))
    } catch (error) {
      toast.error('搜索酒店失败')
    }
  }

  const handleFlightSearch = async (searchParams: any) => {
    try {
      await dispatch(searchFlights(searchParams))
    } catch (error) {
      toast.error('搜索航班失败')
    }
  }

  const popularDestinations = [
    { name: '北京', type: 'hotel', description: '首都北京，历史与现代的完美融合' },
    { name: '上海', type: 'hotel', description: '魔都上海，国际化大都市' },
    { name: '广州', type: 'hotel', description: '花城广州，美食之都' },
    { name: '深圳', type: 'hotel', description: '创新之城，科技前沿' },
    { name: '北京-上海', type: 'flight', description: '京沪航线，商务出行首选' },
    { name: '北京-广州', type: 'flight', description: '京广航线，南北大动脉' },
    { name: '上海-深圳', type: 'flight', description: '沪深航线，经济走廊' },
  ]

  const features = [
    {
      icon: Search,
      title: '多平台比价',
      description: '实时获取美团、携程、飞猪等平台的价格信息'
    },
    {
      icon: TrendingUp,
      title: '价格趋势',
      description: '查看历史价格变化，把握最佳购买时机'
    },
    {
      icon: Star,
      title: '智能推荐',
      description: '基于用户偏好，推荐最优选择'
    },
    {
      icon: Clock,
      title: '实时更新',
      description: '价格实时监控，不错过任何优惠'
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <Search className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900">智能比价助手</h1>
            </div>
            <div className="flex items-center space-x-4">
              <Badge variant="secondary">Beta</Badge>
              <Button variant="outline" size="sm">登录</Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              智能酒店机票比价平台
            </h2>
            <p className="text-xl text-gray-600 mb-8">
              实时获取美团、携程、飞猪等平台价格，为您找到最优选择
            </p>
            
            {/* Platform Status */}
            <div className="flex justify-center space-x-4 mb-8">
              {platforms.map((platform) => (
                <PlatformStatus key={platform.id} platform={platform} />
              ))}
            </div>
          </div>

          {/* Search Tabs */}
          <div className="max-w-4xl mx-auto">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="hotels" className="flex items-center space-x-2">
                  <Hotel className="w-4 h-4" />
                  <span>酒店搜索</span>
                </TabsTrigger>
                <TabsTrigger value="flights" className="flex items-center space-x-2">
                  <Plane className="w-4 h-4" />
                  <span>机票搜索</span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="hotels" className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle>搜索酒店</CardTitle>
                    <CardDescription>
                      输入城市和入住日期，为您找到最优惠的酒店价格
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <HotelSearchForm onSearch={handleHotelSearch} loading={loading} />
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="flights" className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle>搜索机票</CardTitle>
                    <CardDescription>
                      输入出发地和目的地，为您找到最优惠的机票价格
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <FlightSearchForm onSearch={handleFlightSearch} loading={loading} />
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </section>

      {/* Search Results */}
      {(hotelResults || flightResults) && (
        <section className="py-12 bg-white">
          <div className="container mx-auto px-4">
            <SearchResults 
              hotelResults={hotelResults} 
              flightResults={flightResults} 
              loading={loading}
            />
          </div>
        </section>
      )}

      {/* Features */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h3 className="text-3xl font-bold text-gray-900 mb-4">平台特色</h3>
            <p className="text-lg text-gray-600">为您提供最优质的比价服务</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="text-center">
                <CardHeader>
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                    <feature.icon className="w-6 h-6 text-blue-600" />
                  </div>
                  <CardTitle className="text-lg">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>{feature.description}</CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Popular Destinations */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h3 className="text-3xl font-bold text-gray-900 mb-4">热门目的地</h3>
            <p className="text-lg text-gray-600">发现最受欢迎的旅行目的地</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {popularDestinations.map((destination, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader>
                  <div className="flex items-center space-x-2">
                    {destination.type === 'hotel' ? (
                      <Hotel className="w-5 h-5 text-blue-600" />
                    ) : (
                      <Plane className="w-5 h-5 text-green-600" />
                    )}
                    <CardTitle className="text-lg">{destination.name}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription>{destination.description}</CardDescription>
                  <Button variant="outline" size="sm" className="mt-4 w-full">
                    立即搜索
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Price Chart */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h3 className="text-3xl font-bold text-gray-900 mb-4">价格趋势</h3>
            <p className="text-lg text-gray-600">了解价格变化，把握最佳预订时机</p>
          </div>

          <div className="max-w-4xl mx-auto">
            <Card>
              <CardHeader>
                <CardTitle>近期价格走势</CardTitle>
                <CardDescription>过去7天的价格变化趋势</CardDescription>
              </CardHeader>
              <CardContent>
                <PriceChart />
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <h4 className="text-lg font-semibold mb-4">关于我们</h4>
              <p className="text-gray-400">
                智能比价助手，为您提供最优质的酒店机票比价服务
              </p>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-4">功能特色</h4>
              <ul className="text-gray-400 space-y-2">
                <li>多平台比价</li>
                <li>实时价格</li>
                <li>价格预警</li>
                <li>智能推荐</li>
              </ul>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-4">支持平台</h4>
              <ul className="text-gray-400 space-y-2">
                <li>美团</li>
                <li>携程</li>
                <li>飞猪</li>
                <li>更多平台...</li>
              </ul>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-4">联系我们</h4>
              <ul className="text-gray-400 space-y-2">
                <li>客服热线：400-123-4567</li>
                <li>邮箱：support@example.com</li>
                <li>工作时间：9:00-18:00</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 智能比价助手. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}