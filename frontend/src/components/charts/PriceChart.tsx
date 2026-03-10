'use client'

import { useMemo } from 'react'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js'
import { Line } from 'react-chartjs-2'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
)

interface PriceChartProps {
  data?: Array<{
    timestamp: string
    price: number
    platform: string
    platformName: string
  }>
  height?: number
  title?: string
}

export function PriceChart({ 
  data = [], 
  height = 300, 
  title = '价格趋势图' 
}: PriceChartProps) {
  const chartData = useMemo(() => {
    // 生成模拟数据如果没有提供数据
    const mockData = data.length === 0 ? generateMockData() : data
    
    // 按平台分组数据
    const platformGroups = mockData.reduce((groups, item) => {
      if (!groups[item.platform]) {
        groups[item.platform] = []
      }
      groups[item.platform].push(item)
      return groups
    }, {} as Record<string, typeof mockData>)

    // 获取所有时间点
    const allTimestamps = Array.from(new Set(mockData.map(item => 
      new Date(item.timestamp).toLocaleDateString('zh-CN')
    ))).sort()

    // 为每个平台创建数据集
    const datasets = Object.entries(platformGroups).map(([platform, items]) => {
      const platformColors = {
        meituan: '#FFD100',
        ctrip: '#0066CC', 
        fliggy: '#FF6A00'
      }

      // 按时间点组织数据
      const dataByTime = allTimestamps.map(timestamp => {
        const timeItem = items.find(item => 
          new Date(item.timestamp).toLocaleDateString('zh-CN') === timestamp
        )
        return timeItem ? timeItem.price : null
      })

      return {
        label: items[0]?.platformName || platform,
        data: dataByTime,
        borderColor: platformColors[platform as keyof typeof platformColors] || '#666666',
        backgroundColor: `${platformColors[platform as keyof typeof platformColors] || '#666666'}20`,
        fill: false,
        tension: 0.4,
        pointBackgroundColor: platformColors[platform as keyof typeof platformColors] || '#666666',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6
      }
    })

    return {
      labels: allTimestamps,
      datasets
    }
  }, [data])

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          usePointStyle: true,
          padding: 20,
          font: {
            size: 12
          }
        }
      },
      title: {
        display: true,
        text: title,
        font: {
          size: 16,
          weight: 'bold'
        },
        padding: {
          top: 10,
          bottom: 30
        }
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#fff',
        bodyColor: '#fff',
        borderColor: '#ddd',
        borderWidth: 1,
        cornerRadius: 8,
        displayColors: true,
        callbacks: {
          title: (context: any) => {
            return `日期: ${context[0].label}`
          },
          label: (context: any) => {
            const label = context.dataset.label || ''
            const value = context.parsed.y
            return `${label}: ¥${value?.toLocaleString() || 'N/A'}`
          }
        }
      }
    },
    scales: {
      x: {
        grid: {
          display: false
        },
        ticks: {
          font: {
            size: 11
          },
          maxRotation: 45,
          minRotation: 45
        }
      },
      y: {
        grid: {
          color: 'rgba(0, 0, 0, 0.1)'
        },
        ticks: {
          font: {
            size: 11
          },
          callback: (value: any) => `¥${value?.toLocaleString()}`
        },
        beginAtZero: false
      }
    },
    interaction: {
      intersect: false,
      mode: 'index' as const
    },
    elements: {
      point: {
        hoverRadius: 8
      }
    }
  }

  return (
    <div className="w-full" style={{ height }}>
      <Line data={chartData} options={options} />
    </div>
  )
}

// 生成模拟数据
function generateMockData() {
  const platforms = ['meituan', 'ctrip', 'fliggy']
  const platformNames = ['美团', '携程', '飞猪']
  const days = 7
  const basePrice = 500
  const data: any[] = []

  for (let i = 0; i < days; i++) {
    const date = new Date()
    date.setDate(date.getDate() - (days - 1 - i))
    
    platforms.forEach((platform, index) => {
      // 生成有趋势的价格数据
      const trend = Math.sin(i * 0.5) * 50
      const randomVariation = (Math.random() - 0.5) * 100
      const platformVariation = index * 20
      const price = Math.round(basePrice + trend + randomVariation + platformVariation)
      
      data.push({
        timestamp: date.toISOString(),
        price: Math.max(price, 200), // 确保价格不低于200
        platform,
        platformName: platformNames[index]
      })
    })
  }

  return data
}

interface ComparisonChartProps {
  hotelData?: Array<{
    name: string
    minPrice: number
    avgPrice: number
    maxPrice: number
  }>
  flightData?: Array<{
    timeSlot: string
    minPrice: number
    avgPrice: number
    maxPrice: number
  }>
}

export function ComparisonChart({ hotelData = [], flightData = [] }: ComparisonChartProps) {
  const chartData = useMemo(() => {
    const data = [...hotelData.map(h => ({
      name: h.name,
      minPrice: h.minPrice,
      avgPrice: h.avgPrice,
      maxPrice: h.maxPrice,
      type: 'hotel'
    })), ...flightData.map(f => ({
      name: f.timeSlot,
      minPrice: f.minPrice,
      avgPrice: f.avgPrice,
      maxPrice: f.maxPrice,
      type: 'flight'
    }))]

    return {
      labels: data.map(item => item.name),
      datasets: [
        {
          label: '最低价格',
          data: data.map(item => item.minPrice),
          backgroundColor: 'rgba(34, 197, 94, 0.8)',
          borderColor: 'rgb(34, 197, 94)',
          borderWidth: 1
        },
        {
          label: '平均价格',
          data: data.map(item => item.avgPrice),
          backgroundColor: 'rgba(59, 130, 246, 0.8)',
          borderColor: 'rgb(59, 130, 246)',
          borderWidth: 1
        },
        {
          label: '最高价格',
          data: data.map(item => item.maxPrice),
          backgroundColor: 'rgba(239, 68, 68, 0.8)',
          borderColor: 'rgb(239, 68, 68)',
          borderWidth: 1
        }
      ]
    }
  }, [hotelData, flightData])

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          usePointStyle: true,
          padding: 20
        }
      },
      title: {
        display: true,
        text: '价格对比图',
        font: {
          size: 16,
          weight: 'bold'
        }
      },
      tooltip: {
        callbacks: {
          label: (context: any) => {
            const label = context.dataset.label || ''
            const value = context.parsed.y
            return `${label}: ¥${value?.toLocaleString()}`
          }
        }
      }
    },
    scales: {
      x: {
        grid: {
          display: false
        }
      },
      y: {
        grid: {
          color: 'rgba(0, 0, 0, 0.1)'
        },
        ticks: {
          callback: (value: any) => `¥${value?.toLocaleString()}`
        },
        beginAtZero: true
      }
    }
  }

  return (
    <div className="w-full h-96">
      {/* 这里需要导入Bar组件，但由于我们只安装了react-chartjs-2的基础包，暂时用Line代替 */}
      <div className="text-center text-gray-500 py-8">
        价格对比图表（需要安装 react-chartjs-2 的 Bar 组件）
      </div>
    </div>
  )
}

interface PlatformStatsChartProps {
  stats: Array<{
    platform: string
    platformName: string
    totalHotels?: number
    totalFlights?: number
    avgPrice: number
    successRate: number
  }>
}

export function PlatformStatsChart({ stats }: PlatformStatsChartProps) {
  const chartData = useMemo(() => {
    return {
      labels: stats.map(stat => stat.platformName),
      datasets: [
        {
          label: '平均价格',
          data: stats.map(stat => stat.avgPrice),
          backgroundColor: [
            '#FFD100',
            '#0066CC', 
            '#FF6A00'
          ],
          borderColor: [
            '#FFD100',
            '#0066CC',
            '#FF6A00'
          ],
          borderWidth: 1
        },
        {
          label: '成功率 (%)',
          data: stats.map(stat => stat.successRate),
          backgroundColor: [
            'rgba(255, 209, 0, 0.5)',
            'rgba(0, 102, 204, 0.5)',
            'rgba(255, 106, 0, 0.5)'
          ],
          borderColor: [
            '#FFD100',
            '#0066CC',
            '#FF6A00'
          ],
          borderWidth: 1,
          yAxisID: 'y1'
        }
      ]
    }
  }, [stats])

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const
      },
      title: {
        display: true,
        text: '平台统计对比'
      }
    },
    scales: {
      y: {
        type: 'linear' as const,
        display: true,
        position: 'left' as const,
        title: {
          display: true,
          text: '平均价格 (¥)'
        },
        ticks: {
          callback: (value: any) => `¥${value?.toLocaleString()}`
        }
      },
      y1: {
        type: 'linear' as const,
        display: true,
        position: 'right' as const,
        title: {
          display: true,
          text: '成功率 (%)'
        },
        grid: {
          drawOnChartArea: false
        },
        min: 0,
        max: 100
      }
    }
  }

  return (
    <div className="w-full h-80">
      <div className="text-center text-gray-500 py-8">
        平台统计图表（需要安装 react-chartjs-2 的 Bar 组件）
      </div>
    </div>
  )
}