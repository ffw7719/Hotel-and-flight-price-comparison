import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatPrice(price: number, currency: string = 'CNY'): string {
  return new Intl.NumberFormat('zh-CN', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(price)
}

export function formatDate(date: string | Date, format: 'short' | 'long' = 'short'): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  
  if (format === 'short') {
    return dateObj.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    })
  }
  
  return dateObj.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long'
  })
}

export function formatTime(time: string): string {
  return time
}

export function formatDuration(duration: string): string {
  return duration
}

export function calculateSavings(originalPrice: number, currentPrice: number): number {
  return Math.round(((originalPrice - currentPrice) / originalPrice) * 100)
}

export function getPlatformColor(platform: string): string {
  const colors = {
    meituan: '#FFD100',
    ctrip: '#0066CC',
    fliggy: '#FF6A00'
  }
  return colors[platform as keyof typeof colors] || '#666666'
}

export function getPlatformName(platform: string): string {
  const names = {
    meituan: '美团',
    ctrip: '携程',
    fliggy: '飞猪'
  }
  return names[platform as keyof typeof names] || platform
}

export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null

  return (...args: Parameters<T>) => {
    if (timeout) {
      clearTimeout(timeout)
    }
    timeout = setTimeout(() => func(...args), wait)
  }
}

export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func.apply(this, args)
      inThrottle = true
      setTimeout(() => inThrottle = false, limit)
    }
  }
}

export function generateSearchId(): string {
  return `search_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export function validatePhone(phone: string): boolean {
  const phoneRegex = /^1[3-9]\d{9}$/
  return phoneRegex.test(phone)
}

export function parseUrl(url: string): URL | null {
  try {
    return new URL(url)
  } catch {
    return null
  }
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) {
    return text
  }
  return text.slice(0, maxLength) + '...'
}

export function getRatingColor(rating: number): string {
  if (rating >= 4.5) return 'text-green-600'
  if (rating >= 4.0) return 'text-blue-600'
  if (rating >= 3.5) return 'text-yellow-600'
  return 'text-red-600'
}

export function getRatingText(rating: number): string {
  if (rating >= 4.5) return '极佳'
  if (rating >= 4.0) return '很好'
  if (rating >= 3.5) return '良好'
  if (rating >= 3.0) return '一般'
  return '较差'
}

export function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371 // 地球半径（公里）
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
  const distance = R * c
  return Math.round(distance * 100) / 100
}

export function sortResults<T>(
  results: T[],
  sortBy: 'price' | 'rating' | 'name' | 'distance',
  sortOrder: 'asc' | 'desc'
): T[] {
  const sorted = [...results].sort((a: any, b: any) => {
    let valueA: number | string
    let valueB: number | string

    switch (sortBy) {
      case 'price':
        valueA = a.minPrice || a.price || 0
        valueB = b.minPrice || b.price || 0
        break
      case 'rating':
        valueA = a.rating || 0
        valueB = b.rating || 0
        break
      case 'name':
        valueA = a.name || ''
        valueB = b.name || ''
        break
      case 'distance':
        valueA = a.distance || 0
        valueB = b.distance || 0
        break
      default:
        valueA = 0
        valueB = 0
    }

    if (typeof valueA === 'string' && typeof valueB === 'string') {
      return sortOrder === 'asc' 
        ? valueA.localeCompare(valueB)
        : valueB.localeCompare(valueA)
    }

    return sortOrder === 'asc' 
      ? (valueA as number) - (valueB as number)
      : (valueB as number) - (valueA as number)
  })

  return sorted
}

export function filterResults<T>(
  results: T[],
  filters: {
    platforms?: string[]
    priceRange?: [number, number]
    rating?: number
    amenities?: string[]
  }
): T[] {
  return results.filter((item: any) => {
    // 平台过滤
    if (filters.platforms && filters.platforms.length > 0) {
      if (!filters.platforms.includes(item.platform)) {
        return false
      }
    }

    // 价格范围过滤
    if (filters.priceRange) {
      const [min, max] = filters.priceRange
      const price = item.minPrice || item.price || 0
      if (price < min || price > max) {
        return false
      }
    }

    // 评分过滤
    if (filters.rating && filters.rating > 0) {
      if ((item.rating || 0) < filters.rating) {
        return false
      }
    }

    // 设施过滤
    if (filters.amenities && filters.amenities.length > 0) {
      if (!item.amenities || !filters.amenities.every((amenity: string) => 
        item.amenities.includes(amenity)
      )) {
        return false
      }
    }

    return true
  })
}