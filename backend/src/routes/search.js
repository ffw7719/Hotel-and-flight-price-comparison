const express = require('express');
const Joi = require('joi');

const router = express.Router();

// 验证酒店搜索参数
const hotelSearchSchema = Joi.object({
  city: Joi.string().required().min(1).max(100),
  checkIn: Joi.date().required().min('now'),
  checkOut: Joi.date().required().min(Joi.ref('checkIn')),
  guests: Joi.number().integer().min(1).max(10).default(2),
  rooms: Joi.number().integer().min(1).max(5).default(1),
  priceMin: Joi.number().min(0).optional(),
  priceMax: Joi.number().min(0).optional(),
  rating: Joi.number().min(0).max(5).optional(),
  amenities: Joi.array().items(Joi.string()).optional()
});

// 验证航班搜索参数
const flightSearchSchema = Joi.object({
  origin: Joi.string().required().min(3).max(3),
  destination: Joi.string().required().min(3).max(3),
  departureDate: Joi.date().required().min('now'),
  returnDate: Joi.date().min(Joi.ref('departureDate')).optional(),
  passengers: Joi.number().integer().min(1).max(9).default(1),
  cabinClass: Joi.string().valid('economy', 'business', 'first').default('economy'),
  directOnly: Joi.boolean().default(false),
  maxStops: Joi.number().min(0).max(3).default(2)
});

// 酒店搜索
router.post('/hotels', async (req, res) => {
  try {
    const { error, value } = hotelSearchSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        error: 'Validation failed',
        details: error.details
      });
    }

    const startTime = Date.now();
    const searchParams = {
      ...value,
      userAgent: req.headers['user-agent'] || 'Unknown',
      ip: req.ip || 'Unknown'
    };

    const results = await req.priceService.searchHotels(searchParams);
    
    res.json({
      success: true,
      data: results
    });

  } catch (error) {
    req.logger.error('Hotel search error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
});

// 航班搜索
router.post('/flights', async (req, res) => {
  try {
    const { error, value } = flightSearchSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        error: 'Validation failed',
        details: error.details
      });
    }

    const startTime = Date.now();
    const searchParams = {
      ...value,
      userAgent: req.headers['user-agent'] || 'Unknown',
      ip: req.ip || 'Unknown'
    };

    const results = await req.priceService.searchFlights(searchParams);
    
    res.json({
      success: true,
      data: results
    });

  } catch (error) {
    req.logger.error('Flight search error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
});

// 获取搜索历史
router.get('/history', async (req, res) => {
  try {
    const { type, limit = 10, offset = 0 } = req.query;
    
    const query = {};
    if (type && ['hotel', 'flight'].includes(type)) {
      query.type = type;
    }

    const SearchHistory = req.SearchHistory;
    const history = await SearchHistory.find(query)
      .sort({ timestamp: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(offset))
      .select('-__v');

    const total = await SearchHistory.countDocuments(query);

    res.json({
      success: true,
      data: {
        history,
        total,
        limit: parseInt(limit),
        offset: parseInt(offset)
      }
    });

  } catch (error) {
    req.logger.error('Get search history error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
});

// 获取特定搜索详情
router.get('/history/:searchId', async (req, res) => {
  try {
    const { searchId } = req.params;
    
    const SearchHistory = req.SearchHistory;
    const history = await SearchHistory.findOne({ searchId });
    
    if (!history) {
      return res.status(404).json({
        success: false,
        error: 'Search not found'
      });
    }

    res.json({
      success: true,
      data: history
    });

  } catch (error) {
    req.logger.error('Get search details error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
});

// 获取价格趋势
router.get('/trends', async (req, res) => {
  try {
    const { type, city, origin, destination, days = 7 } = req.query;
    
    if (!type || !['hotel', 'flight'].includes(type)) {
      return res.status(400).json({
        success: false,
        error: 'Type is required and must be hotel or flight'
      });
    }

    const PriceHistory = req.PriceHistory;
    const query = { type };
    
    if (type === 'hotel' && city) {
      query['searchParams.city'] = new RegExp(city, 'i');
    } else if (type === 'flight' && origin && destination) {
      query['searchParams.origin'] = origin.toUpperCase();
      query['searchParams.destination'] = destination.toUpperCase();
    }

    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - (parseInt(days) * 24 * 60 * 60 * 1000));

    query.timestamp = {
      $gte: startDate,
      $lte: endDate
    };

    const trends = await PriceHistory.find(query)
      .sort({ timestamp: 1 })
      .select('timestamp results summary');

    const processedTrends = trends.map(trend => ({
      timestamp: trend.timestamp,
      avgPrice: trend.summary.avgPrice || 0,
      minPrice: trend.summary.priceRange?.min || 0,
      maxPrice: trend.summary.priceRange?.max || 0,
      totalResults: trend.results.totalResults || 0
    }));

    res.json({
      success: true,
      data: {
        trends: processedTrends,
        period: {
          start: startDate,
          end: endDate,
          days: parseInt(days)
        }
      }
    });

  } catch (error) {
    req.logger.error('Get price trends error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
});

// 获取热门搜索
router.get('/popular', async (req, res) => {
  try {
    const { type, limit = 10 } = req.query;
    
    const SearchHistory = req.SearchHistory;
    const query = {};
    
    if (type && ['hotel', 'flight'].includes(type)) {
      query.type = type;
    }

    const pipeline = [
      { $match: query },
      {
        $group: {
          _id: {
            city: '$searchParams.city',
            origin: '$searchParams.origin',
            destination: '$searchParams.destination'
          },
          count: { $sum: 1 },
          avgResponseTime: { $avg: '$responseTime' },
          lastSearched: { $max: '$timestamp' }
        }
      },
      { $sort: { count: -1 } },
      { $limit: parseInt(limit) }
    ];

    const popularSearches = await SearchHistory.aggregate(pipeline);

    const formattedSearches = popularSearches.map(search => ({
      location: search._id.city || `${search._id.origin}-${search._id.destination}`,
      searchCount: search.count,
      avgResponseTime: Math.round(search.avgResponseTime),
      lastSearched: search.lastSearched
    }));

    res.json({
      success: true,
      data: formattedSearches
    });

  } catch (error) {
    req.logger.error('Get popular searches error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
});

// 删除搜索历史
router.delete('/history/:searchId', async (req, res) => {
  try {
    const { searchId } = req.params;
    
    const SearchHistory = req.SearchHistory;
    const result = await SearchHistory.deleteOne({ searchId });
    
    if (result.deletedCount === 0) {
      return res.status(404).json({
        success: false,
        error: 'Search not found'
      });
    }

    res.json({
      success: true,
      message: 'Search history deleted successfully'
    });

  } catch (error) {
    req.logger.error('Delete search history error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
});

module.exports = (priceService, logger) => {
  return (req, res, next) => {
    req.priceService = priceService;
    req.logger = logger;
    req.PriceHistory = require('../models/PriceHistory');
    req.SearchHistory = require('../models/SearchHistory');
    next();
  };
};

// 导出路由器
module.exports.router = router;