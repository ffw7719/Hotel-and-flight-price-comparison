const PriceHistory = require('../models/PriceHistory');
const SearchHistory = require('../models/SearchHistory');

class PriceService {
  constructor(scraperService, cacheService, logger) {
    this.scraperService = scraperService;
    this.cacheService = cacheService;
    this.logger = logger;
  }

  async searchHotels(searchParams) {
    const searchId = this.generateSearchId();
    const startTime = Date.now();

    try {
      // 记录搜索历史
      await this.recordSearchHistory(searchId, 'hotel', searchParams);

      // 从缓存获取数据
      const cachedData = await this.cacheService.get(`hotel-search-${JSON.stringify(searchParams)}`);
      if (cachedData) {
        this.logger.info('Returning cached hotel search results');
        return {
          searchId,
          cached: true,
          timestamp: new Date().toISOString(),
          responseTime: Date.now() - startTime,
          data: cachedData
        };
      }

      // 抓取各平台数据
      const platformResults = await this.scraperService.scrapeHotelPrices(searchParams);
      
      // 处理和比较价格
      const processedData = await this.processHotelResults(platformResults, searchParams);
      
      // 缓存结果
      await this.cacheService.set(`hotel-search-${JSON.stringify(searchParams)}`, processedData, 1800); // 30分钟缓存
      
      // 记录价格历史
      await this.recordPriceHistory('hotel', searchParams, processedData);

      const responseTime = Date.now() - startTime;
      this.logger.info(`Hotel search completed in ${responseTime}ms`);

      return {
        searchId,
        cached: false,
        timestamp: new Date().toISOString(),
        responseTime,
        data: processedData
      };

    } catch (error) {
      this.logger.error('Hotel search error:', error);
      throw error;
    }
  }

  async searchFlights(searchParams) {
    const searchId = this.generateSearchId();
    const startTime = Date.now();

    try {
      // 记录搜索历史
      await this.recordSearchHistory(searchId, 'flight', searchParams);

      // 从缓存获取数据
      const cachedData = await this.cacheService.get(`flight-search-${JSON.stringify(searchParams)}`);
      if (cachedData) {
        this.logger.info('Returning cached flight search results');
        return {
          searchId,
          cached: true,
          timestamp: new Date().toISOString(),
          responseTime: Date.now() - startTime,
          data: cachedData
        };
      }

      // 抓取各平台数据
      const platformResults = await this.scraperService.scrapeFlightPrices(searchParams);
      
      // 处理和比较价格
      const processedData = await this.processFlightResults(platformResults, searchParams);
      
      // 缓存结果
      await this.cacheService.set(`flight-search-${JSON.stringify(searchParams)}`, processedData, 1800); // 30分钟缓存
      
      // 记录价格历史
      await this.recordPriceHistory('flight', searchParams, processedData);

      const responseTime = Date.now() - startTime;
      this.logger.info(`Flight search completed in ${responseTime}ms`);

      return {
        searchId,
        cached: false,
        timestamp: new Date().toISOString(),
        responseTime,
        data: processedData
      };

    } catch (error) {
      this.logger.error('Flight search error:', error);
      throw error;
    }
  }

  async processHotelResults(platformResults, searchParams) {
    const allHotels = [];
    const platformStats = {};

    // 收集所有酒店数据
    for (const [platform, platformData] of Object.entries(platformResults)) {
      if (platformData.hotels && platformData.hotels.length > 0) {
        allHotels.push(...platformData.hotels.map(hotel => ({
          ...hotel,
          platform: platform,
          platformName: platformData.platformName
        })));
        
        platformStats[platform] = {
          name: platformData.platformName,
          totalHotels: platformData.hotels.length,
          minPrice: Math.min(...platformData.hotels.map(h => h.price)),
          maxPrice: Math.max(...platformData.hotels.map(h => h.price)),
          avgPrice: platformData.hotels.reduce((sum, h) => sum + h.price, 0) / platformData.hotels.length
        };
      }
    }

    // 按酒店名称分组
    const hotelGroups = this.groupHotelsByName(allHotels);
    
    // 为每个酒店组生成比价数据
    const comparisonResults = Object.entries(hotelGroups).map(([hotelName, hotels]) => {
      const prices = hotels.map(h => h.price);
      const minPrice = Math.min(...prices);
      const maxPrice = Math.max(...prices);
      const avgPrice = prices.reduce((sum, price) => sum + price, 0) / prices.length;
      
      // 找出最便宜的选项
      const cheapestOption = hotels.find(h => h.price === minPrice);
      
      return {
        name: hotelName,
        options: hotels,
        minPrice,
        maxPrice,
        avgPrice,
        priceRange: maxPrice - minPrice,
        savings: maxPrice - minPrice,
        cheapestOption,
        platformCount: hotels.length,
        recommendation: this.generateHotelRecommendation(hotels, searchParams)
      };
    });

    // 按最低价格排序
    comparisonResults.sort((a, b) => a.minPrice - b.minPrice);

    return {
      searchParams,
      totalResults: comparisonResults.length,
      platformStats,
      hotels: comparisonResults,
      summary: this.generateHotelSummary(comparisonResults, platformStats)
    };
  }

  async processFlightResults(platformResults, searchParams) {
    const allFlights = [];
    const platformStats = {};

    // 收集所有航班数据
    for (const [platform, platformData] of Object.entries(platformResults)) {
      if (platformData.flights && platformData.flights.length > 0) {
        allFlights.push(...platformData.flights.map(flight => ({
          ...flight,
          platform: platform,
          platformName: platformData.platformName
        })));
        
        platformStats[platform] = {
          name: platformData.platformName,
          totalFlights: platformData.flights.length,
          minPrice: Math.min(...platformData.flights.map(f => f.price)),
          maxPrice: Math.max(...platformData.flights.map(f => f.price)),
          avgPrice: platformData.flights.reduce((sum, f) => sum + f.price, 0) / platformData.flights.length
        };
      }
    }

    // 按航班时间分组（相近时间的航班）
    const flightGroups = this.groupFlightsByTime(allFlights);
    
    // 为每个航班组生成比价数据
    const comparisonResults = Object.entries(flightGroups).map(([timeSlot, flights]) => {
      const prices = flights.map(f => f.price);
      const minPrice = Math.min(...prices);
      const maxPrice = Math.max(...prices);
      const avgPrice = prices.reduce((sum, price) => sum + price, 0) / prices.length;
      
      // 找出最便宜的选项
      const cheapestOption = flights.find(f => f.price === minPrice);
      
      return {
        timeSlot,
        options: flights,
        minPrice,
        maxPrice,
        avgPrice,
        priceRange: maxPrice - minPrice,
        savings: maxPrice - minPrice,
        cheapestOption,
        platformCount: flights.length,
        recommendation: this.generateFlightRecommendation(flights, searchParams)
      };
    });

    // 按最低价格排序
    comparisonResults.sort((a, b) => a.minPrice - b.minPrice);

    return {
      searchParams,
      totalResults: comparisonResults.length,
      platformStats,
      flights: comparisonResults,
      summary: this.generateFlightSummary(comparisonResults, platformStats)
    };
  }

  groupHotelsByName(hotels) {
    const groups = {};
    
    hotels.forEach(hotel => {
      // 标准化酒店名称（去除特殊字符和空格）
      const normalizedName = hotel.name.replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, '').toLowerCase();
      
      if (!groups[normalizedName]) {
        groups[normalizedName] = [];
      }
      groups[normalizedName].push(hotel);
    });
    
    return groups;
  }

  groupFlightsByTime(flights) {
    const groups = {};
    
    flights.forEach(flight => {
      // 按小时分组
      const hourSlot = flight.departureTime.replace(/:\d+$/, '');
      const key = `${flight.airline}-${hourSlot}`;
      
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(flight);
    });
    
    return groups;
  }

  generateHotelRecommendation(hotels, searchParams) {
    const cheapest = hotels.reduce((min, hotel) => hotel.price < min.price ? hotel : min);
    const highestRated = hotels.reduce((max, hotel) => hotel.rating > max.rating ? hotel : max);
    
    let recommendation = '';
    
    if (cheapest.price < hotels.reduce((sum, h) => sum + h.price, 0) / hotels.length * 0.8) {
      recommendation = `价格优惠：${cheapest.platformName}提供最低价格 ¥${cheapest.price}`;
    }
    
    if (highestRated.rating > 4.5 && highestRated.price <= hotels.reduce((sum, h) => sum + h.price, 0) / hotels.length * 1.2) {
      recommendation += (recommendation ? '，' : '') + `推荐选择：${highestRated.platformName}的${highestRated.name}评分最高（${highestRated.rating}分）且价格合理`;
    }
    
    return recommendation || '各平台价格相近，建议根据个人偏好选择';
  }

  generateFlightRecommendation(flights, searchParams) {
    const cheapest = flights.reduce((min, flight) => flight.price < min.price ? flight : min);
    const directFlight = flights.find(f => f.stops === 0);
    
    let recommendation = '';
    
    if (cheapest.price < flights.reduce((sum, f) => sum + f.price, 0) / flights.length * 0.8) {
      recommendation = `价格优惠：${cheapest.platformName}提供最低价格 ¥${cheapest.price}`;
    }
    
    if (directFlight && directFlight.price <= flights.reduce((sum, f) => sum + f.price, 0) / flights.length * 1.3) {
      recommendation += (recommendation ? '，' : '') + `推荐选择：${directFlight.platformName}的直飞航班`;
    }
    
    return recommendation || '各平台价格相近，建议根据航班时间和偏好选择';
  }

  generateHotelSummary(hotels, platformStats) {
    const totalHotels = hotels.reduce((sum, h) => sum + h.platformCount, 0);
    const avgPrice = hotels.reduce((sum, h) => sum + h.avgPrice, 0) / hotels.length;
    const totalSavings = hotels.reduce((sum, h) => sum + h.savings, 0);
    
    return {
      totalHotels,
      avgPrice: Math.round(avgPrice),
      totalSavings,
      bestPlatform: this.findBestPlatform(platformStats),
      priceRange: {
        min: Math.min(...hotels.map(h => h.minPrice)),
        max: Math.max(...hotels.map(h => h.maxPrice))
      }
    };
  }

  generateFlightSummary(flights, platformStats) {
    const totalFlights = flights.reduce((sum, f) => sum + f.platformCount, 0);
    const avgPrice = flights.reduce((sum, f) => sum + f.avgPrice, 0) / flights.length;
    const totalSavings = flights.reduce((sum, f) => sum + f.savings, 0);
    
    return {
      totalFlights,
      avgPrice: Math.round(avgPrice),
      totalSavings,
      bestPlatform: this.findBestPlatform(platformStats),
      priceRange: {
        min: Math.min(...flights.map(f => f.minPrice)),
        max: Math.max(...flights.map(f => f.maxPrice))
      }
    };
  }

  findBestPlatform(platformStats) {
    const platforms = Object.entries(platformStats);
    if (platforms.length === 0) return null;
    
    // 找出平均价格最低的平台
    return platforms.reduce((best, [platform, stats]) => {
      if (!best || stats.avgPrice < best.stats.avgPrice) {
        return { platform, stats };
      }
      return best;
    }, null);
  }

  async recordSearchHistory(searchId, type, searchParams) {
    try {
      const searchHistory = new SearchHistory({
        searchId,
        type,
        searchParams,
        timestamp: new Date(),
        userAgent: searchParams.userAgent || 'Unknown'
      });
      
      await searchHistory.save();
    } catch (error) {
      this.logger.error('Failed to record search history:', error);
    }
  }

  async recordPriceHistory(type, searchParams, results) {
    try {
      const priceHistory = new PriceHistory({
        type,
        searchParams,
        results,
        timestamp: new Date()
      });
      
      await priceHistory.save();
    } catch (error) {
      this.logger.error('Failed to record price history:', error);
    }
  }

  async updatePrices() {
    try {
      this.logger.info('Starting scheduled price update');
      
      // 获取最近的搜索记录
      const recentSearches = await SearchHistory.find()
        .sort({ timestamp: -1 })
        .limit(10);
      
      for (const search of recentSearches) {
        try {
          if (search.type === 'hotel') {
            await this.searchHotels(search.searchParams);
          } else if (search.type === 'flight') {
            await this.searchFlights(search.searchParams);
          }
          
          // 添加延迟避免过于频繁的请求
          await new Promise(resolve => setTimeout(resolve, 2000));
        } catch (error) {
          this.logger.error(`Error updating search ${search.searchId}:`, error);
        }
      }
      
      this.logger.info('Scheduled price update completed');
    } catch (error) {
      this.logger.error('Error in scheduled price update:', error);
    }
  }

  generateSearchId() {
    return `search_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

module.exports = PriceService;