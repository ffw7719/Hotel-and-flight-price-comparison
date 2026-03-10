const puppeteer = require('puppeteer');
const axios = require('axios');
const cheerio = require('cheerio');
const { RateLimiterMemory } = require('rate-limiter-flexible');

class ScraperService {
  constructor(cacheService, logger) {
    this.cacheService = cacheService;
    this.logger = logger;
    this.browser = null;
    this.rateLimiter = new RateLimiterMemory({
      points: 10, // 每分钟最多10个请求
      duration: 60,
    });
    
    // 平台配置
    this.platforms = {
      meituan: {
        name: '美团',
        baseUrl: process.env.MEITUAN_BASE_URL || 'https://hotel.meituan.com',
        enabled: true
      },
      ctrip: {
        name: '携程',
        baseUrl: process.env.CTRIP_BASE_URL || 'https://www.ctrip.com',
        enabled: true
      },
      fliggy: {
        name: '飞猪',
        baseUrl: process.env.FLIGGY_BASE_URL || 'https://www.fliggy.com',
        enabled: true
      }
    };
  }

  async initBrowser() {
    if (!this.browser) {
      this.browser = await puppeteer.launch({
        headless: process.env.PUPPETEER_HEADLESS === 'true',
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--disable-gpu'
        ]
      });
    }
    return this.browser;
  }

  async closeBrowser() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }

  async scrapeHotelPrices(searchParams) {
    const { city, checkIn, checkOut, guests, rooms } = searchParams;
    const results = {};

    // 检查缓存
    const cacheKey = `hotel-prices-${city}-${checkIn}-${checkOut}-${guests}-${rooms}`;
    const cachedData = await this.cacheService.get(cacheKey);
    if (cachedData) {
      this.logger.info('Returning cached hotel prices');
      return cachedData;
    }

    try {
      // 并行抓取各个平台
      const platformPromises = Object.entries(this.platforms)
        .filter(([_, config]) => config.enabled)
        .map(([platform, config]) => 
          this.scrapePlatformHotels(platform, config, searchParams)
        );

      const platformResults = await Promise.allSettled(platformPromises);
      
      platformResults.forEach((result, index) => {
        const platform = Object.keys(this.platforms)[index];
        if (result.status === 'fulfilled') {
          results[platform] = result.value;
        } else {
          this.logger.error(`Failed to scrape ${platform}:`, result.reason);
          results[platform] = { error: result.reason.message };
        }
      });

      // 缓存结果
      await this.cacheService.set(cacheKey, results, 1800); // 30分钟缓存

      return results;
    } catch (error) {
      this.logger.error('Error scraping hotel prices:', error);
      throw error;
    }
  }

  async scrapeFlightPrices(searchParams) {
    const { origin, destination, departureDate, returnDate, passengers } = searchParams;
    const results = {};

    // 检查缓存
    const cacheKey = `flight-prices-${origin}-${destination}-${departureDate}-${returnDate}-${passengers}`;
    const cachedData = await this.cacheService.get(cacheKey);
    if (cachedData) {
      this.logger.info('Returning cached flight prices');
      return cachedData;
    }

    try {
      // 并行抓取各个平台
      const platformPromises = Object.entries(this.platforms)
        .filter(([_, config]) => config.enabled)
        .map(([platform, config]) => 
          this.scrapePlatformFlights(platform, config, searchParams)
        );

      const platformResults = await Promise.allSettled(platformPromises);
      
      platformResults.forEach((result, index) => {
        const platform = Object.keys(this.platforms)[index];
        if (result.status === 'fulfilled') {
          results[platform] = result.value;
        } else {
          this.logger.error(`Failed to scrape ${platform} flights:`, result.reason);
          results[platform] = { error: result.reason.message };
        }
      });

      // 缓存结果
      await this.cacheService.set(cacheKey, results, 1800); // 30分钟缓存

      return results;
    } catch (error) {
      this.logger.error('Error scraping flight prices:', error);
      throw error;
    }
  }

  async scrapePlatformHotels(platform, config, searchParams) {
    await this.rateLimiter.consume(platform);
    
    const browser = await this.initBrowser();
    const page = await browser.newPage();
    
    try {
      this.logger.info(`Scraping hotels from ${config.name}`);
      
      // 设置用户代理
      await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
      
      // 构建搜索URL
      const searchUrl = this.buildHotelSearchUrl(platform, config, searchParams);
      
      // 访问搜索页面
      await page.goto(searchUrl, { waitUntil: 'networkidle2', timeout: 30000 });
      
      // 等待页面加载
      await page.waitForSelector('.hotel-item, .hotel-card, [data-hotel-id]', { timeout: 10000 });
      
      // 滚动页面以加载更多内容
      await this.autoScroll(page);
      
      // 获取页面内容
      const content = await page.content();
      const $ = cheerio.load(content);
      
      // 解析酒店数据
      const hotels = this.parseHotelData($, platform);
      
      this.logger.info(`Found ${hotels.length} hotels on ${config.name}`);
      
      return {
        platform: platform,
        platformName: config.name,
        hotels: hotels,
        timestamp: new Date().toISOString()
      };
      
    } catch (error) {
      this.logger.error(`Error scraping ${config.name} hotels:`, error);
      throw error;
    } finally {
      await page.close();
    }
  }

  async scrapePlatformFlights(platform, config, searchParams) {
    await this.rateLimiter.consume(platform);
    
    const browser = await this.initBrowser();
    const page = await browser.newPage();
    
    try {
      this.logger.info(`Scraping flights from ${config.name}`);
      
      // 设置用户代理
      await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
      
      // 构建搜索URL
      const searchUrl = this.buildFlightSearchUrl(platform, config, searchParams);
      
      // 访问搜索页面
      await page.goto(searchUrl, { waitUntil: 'networkidle2', timeout: 30000 });
      
      // 等待页面加载
      await page.waitForSelector('.flight-item, .flight-card, [data-flight-id]', { timeout: 10000 });
      
      // 滚动页面以加载更多内容
      await this.autoScroll(page);
      
      // 获取页面内容
      const content = await page.content();
      const $ = cheerio.load(content);
      
      // 解析航班数据
      const flights = this.parseFlightData($, platform);
      
      this.logger.info(`Found ${flights.length} flights on ${config.name}`);
      
      return {
        platform: platform,
        platformName: config.name,
        flights: flights,
        timestamp: new Date().toISOString()
      };
      
    } catch (error) {
      this.logger.error(`Error scraping ${config.name} flights:`, error);
      throw error;
    } finally {
      await page.close();
    }
  }

  buildHotelSearchUrl(platform, config, searchParams) {
    const { city, checkIn, checkOut, guests, rooms } = searchParams;
    
    // 根据平台构建不同的URL
    switch (platform) {
      case 'meituan':
        return `${config.baseUrl}/city/${encodeURIComponent(city)}/?in=${checkIn}&out=${checkOut}&guests=${guests}&rooms=${rooms}`;
      case 'ctrip':
        return `${config.baseUrl}/hotels/?city=${encodeURIComponent(city)}&checkin=${checkIn}&checkout=${checkOut}&adults=${guests}&rooms=${rooms}`;
      case 'fliggy':
        return `${config.baseUrl}/hotel/search.htm?city=${encodeURIComponent(city)}&checkIn=${checkIn}&checkOut=${checkOut}&guests=${guests}&rooms=${rooms}`;
      default:
        throw new Error(`Unsupported platform: ${platform}`);
    }
  }

  buildFlightSearchUrl(platform, config, searchParams) {
    const { origin, destination, departureDate, returnDate, passengers } = searchParams;
    
    // 根据平台构建不同的URL
    switch (platform) {
      case 'meituan':
        return `${config.baseUrl}/flight/search/?origin=${origin}&destination=${destination}&departureDate=${departureDate}&returnDate=${returnDate}&passengers=${passengers}`;
      case 'ctrip':
        return `${config.baseUrl}/flights/?origin=${origin}&destination=${destination}&departureDate=${departureDate}&returnDate=${returnDate}&passengers=${passengers}`;
      case 'fliggy':
        return `${config.baseUrl}/flight/search.htm?origin=${origin}&destination=${destination}&departureDate=${departureDate}&returnDate=${returnDate}&passengers=${passengers}`;
      default:
        throw new Error(`Unsupported platform: ${platform}`);
    }
  }

  parseHotelData($, platform) {
    const hotels = [];
    
    // 根据平台选择不同的选择器
    let hotelSelector, nameSelector, priceSelector, ratingSelector;
    
    switch (platform) {
      case 'meituan':
        hotelSelector = '.hotel-item, .hotel-card';
        nameSelector = '.hotel-name, .name';
        priceSelector = '.price, .hotel-price';
        ratingSelector = '.rating, .score';
        break;
      case 'ctrip':
        hotelSelector = '.hotel-item, .hotel-card, [data-hotel-id]';
        nameSelector = '.hotel-name, .name, h3';
        priceSelector = '.price, .hotel-price, .money';
        ratingSelector = '.rating, .score, .star';
        break;
      case 'fliggy':
        hotelSelector = '.hotel-item, .hotel-card';
        nameSelector = '.hotel-name, .name, h4';
        priceSelector = '.price, .hotel-price, .amount';
        ratingSelector = '.rating, .score, .grade';
        break;
      default:
        hotelSelector = '.hotel-item, .hotel-card';
        nameSelector = '.hotel-name, .name';
        priceSelector = '.price, .hotel-price';
        ratingSelector = '.rating, .score';
    }
    
    $(hotelSelector).each((index, element) => {
      try {
        const $hotel = $(element);
        
        const name = $hotel.find(nameSelector).first().text().trim();
        const priceText = $hotel.find(priceSelector).first().text().trim();
        const ratingText = $hotel.find(ratingSelector).first().text().trim();
        
        if (name && priceText) {
          const price = this.parsePrice(priceText);
          const rating = this.parseRating(ratingText);
          
          hotels.push({
            id: `${platform}-${index}`,
            name: name,
            price: price,
            rating: rating,
            platform: platform,
            url: $hotel.find('a').first().attr('href') || '',
            image: $hotel.find('img').first().attr('src') || '',
            amenities: this.extractAmenities($hotel),
            location: this.extractLocation($hotel)
          });
        }
      } catch (error) {
        this.logger.warn(`Error parsing hotel ${index}:`, error.message);
      }
    });
    
    return hotels;
  }

  parseFlightData($, platform) {
    const flights = [];
    
    // 根据平台选择不同的选择器
    let flightSelector, airlineSelector, priceSelector, timeSelector;
    
    switch (platform) {
      case 'meituan':
        flightSelector = '.flight-item, .flight-card';
        airlineSelector = '.airline, .carrier';
        priceSelector = '.price, .flight-price';
        timeSelector = '.time, .departure-time, .arrival-time';
        break;
      case 'ctrip':
        flightSelector = '.flight-item, .flight-card, [data-flight-id]';
        airlineSelector = '.airline, .carrier, .company';
        priceSelector = '.price, .flight-price, .money';
        timeSelector = '.time, .departure-time, .arrival-time, .flight-time';
        break;
      case 'fliggy':
        flightSelector = '.flight-item, .flight-card';
        airlineSelector = '.airline, .carrier, .airline-name';
        priceSelector = '.price, .flight-price, .amount';
        timeSelector = '.time, .departure-time, .arrival-time';
        break;
      default:
        flightSelector = '.flight-item, .flight-card';
        airlineSelector = '.airline, .carrier';
        priceSelector = '.price, .flight-price';
        timeSelector = '.time, .departure-time, .arrival-time';
    }
    
    $(flightSelector).each((index, element) => {
      try {
        const $flight = $(element);
        
        const airline = $flight.find(airlineSelector).first().text().trim();
        const priceText = $flight.find(priceSelector).first().text().trim();
        const timeText = $flight.find(timeSelector).first().text().trim();
        
        if (airline && priceText) {
          const price = this.parsePrice(priceText);
          const times = this.parseFlightTimes(timeText);
          
          flights.push({
            id: `${platform}-${index}`,
            airline: airline,
            price: price,
            departureTime: times.departure,
            arrivalTime: times.arrival,
            duration: times.duration,
            platform: platform,
            url: $flight.find('a').first().attr('href') || '',
            stops: this.extractStops($flight),
            aircraft: this.extractAircraft($flight)
          });
        }
      } catch (error) {
        this.logger.warn(`Error parsing flight ${index}:`, error.message);
      }
    });
    
    return flights;
  }

  parsePrice(priceText) {
    // 提取价格数字
    const priceMatch = priceText.match(/(\d+(?:,\d+)*)/);
    return priceMatch ? parseInt(priceMatch[1].replace(',', '')) : 0;
  }

  parseRating(ratingText) {
    // 提取评分
    const ratingMatch = ratingText.match(/(\d+(?:\.\d+)?)/);
    return ratingMatch ? parseFloat(ratingMatch[1]) : 0;
  }

  parseFlightTimes(timeText) {
    // 解析航班时间
    const times = timeText.split(/[-–—]/);
    return {
      departure: times[0]?.trim() || '',
      arrival: times[1]?.trim() || '',
      duration: this.extractDuration(timeText)
    };
  }

  extractAmenities($hotel) {
    const amenities = [];
    $hotel.find('.amenity, .facility, .service').each((_, element) => {
      const text = $(element).text().trim();
      if (text) amenities.push(text);
    });
    return amenities;
  }

  extractLocation($hotel) {
    return $hotel.find('.location, .address, .district').first().text().trim();
  }

  extractStops($flight) {
    const stopsText = $flight.find('.stops, .stop-info').first().text().trim();
    if (stopsText.includes('直飞') || stopsText.includes('non-stop')) return 0;
    const stopsMatch = stopsText.match(/(\d+)/);
    return stopsMatch ? parseInt(stopsMatch[1]) : 0;
  }

  extractAircraft($flight) {
    return $flight.find('.aircraft, .plane-type').first().text().trim();
  }

  extractDuration(timeText) {
    const durationMatch = timeText.match(/(\d+)\s*小时\s*(\d+)\s*分钟/);
    if (durationMatch) {
      return `${durationMatch[1]}h ${durationMatch[2]}m`;
    }
    return '';
  }

  async autoScroll(page) {
    await page.evaluate(async () => {
      await new Promise((resolve, reject) => {
        let totalHeight = 0;
        let distance = 100;
        let timer = setInterval(() => {
          let scrollHeight = document.body.scrollHeight;
          window.scrollBy(0, distance);
          totalHeight += distance;
          
          if (totalHeight >= scrollHeight) {
            clearInterval(timer);
            resolve();
          }
        }, 100);
      });
    });
  }
}

module.exports = ScraperService;