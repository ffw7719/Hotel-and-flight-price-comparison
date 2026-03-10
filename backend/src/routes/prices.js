const express = require('express');
const router = express.Router();

// 获取实时价格
router.get('/real-time', async (req, res) => {
  try {
    const { type, id, platform } = req.query;
    
    if (!type || !['hotel', 'flight'].includes(type)) {
      return res.status(400).json({
        success: false,
        error: 'Type is required and must be hotel or flight'
      });
    }

    if (!id) {
      return res.status(400).json({
        success: false,
        error: 'ID is required'
      });
    }

    // 从缓存获取实时价格
    const cacheKey = `real-time-${type}-${id}${platform ? `-${platform}` : ''}`;
    const cachedPrice = await req.cacheService.get(cacheKey);
    
    if (cachedPrice) {
      return res.json({
        success: true,
        data: {
          ...cachedPrice,
          cached: true
        }
      });
    }

    // 如果缓存中没有，尝试重新获取价格
    let realTimePrice;
    if (type === 'hotel') {
      realTimePrice = await req.priceService.getHotelRealTimePrice(id, platform);
    } else {
      realTimePrice = await req.priceService.getFlightRealTimePrice(id, platform);
    }

    // 缓存结果（5分钟）
    await req.cacheService.set(cacheKey, realTimePrice, 300);

    res.json({
      success: true,
      data: {
        ...realTimePrice,
        cached: false
      }
    });

  } catch (error) {
    req.logger.error('Get real-time price error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
});

// 获取价格历史
router.get('/history', async (req, res) => {
  try {
    const { type, id, days = 30 } = req.query;
    
    if (!type || !['hotel', 'flight'].includes(type)) {
      return res.status(400).json({
        success: false,
        error: 'Type is required and must be hotel or flight'
      });
    }

    if (!id) {
      return res.status(400).json({
        success: false,
        error: 'ID is required'
      });
    }

    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - (parseInt(days) * 24 * 60 * 60 * 1000));

    const PriceHistory = req.PriceHistory;
    const query = {
      type,
      timestamp: {
        $gte: startDate,
        $lte: endDate
      }
    };

    if (type === 'hotel') {
      query['results.hotels'] = { $elemMatch: { name: new RegExp(id, 'i') } };
    } else {
      query['results.flights'] = { $elemMatch: { airline: new RegExp(id, 'i') } };
    }

    const history = await PriceHistory.find(query)
      .sort({ timestamp: 1 })
      .select('timestamp results summary');

    const priceHistory = [];
    history.forEach(record => {
      const items = type === 'hotel' ? record.results.hotels : record.results.flights;
      
      items.forEach(item => {
        if ((type === 'hotel' && item.name.toLowerCase().includes(id.toLowerCase())) ||
            (type === 'flight' && item.airline.toLowerCase().includes(id.toLowerCase()))) {
          
          priceHistory.push({
            timestamp: record.timestamp,
            price: item.minPrice,
            platform: item.platform,
            platformName: item.platformName
          });
        }
      });
    });

    // 按时间排序
    priceHistory.sort((a, b) => a.timestamp - b.timestamp);

    res.json({
      success: true,
      data: {
        id,
        type,
        history: priceHistory,
        period: {
          start: startDate,
          end: endDate,
          days: parseInt(days)
        }
      }
    });

  } catch (error) {
    req.logger.error('Get price history error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
});

// 获取价格预警
router.get('/alerts', async (req, res) => {
  try {
    const { type, id, targetPrice, condition = 'below' } = req.query;
    
    if (!type || !['hotel', 'flight'].includes(type)) {
      return res.status(400).json({
        success: false,
        error: 'Type is required and must be hotel or flight'
      });
    }

    if (!id) {
      return res.status(400).json({
        success: false,
        error: 'ID is required'
      });
    }

    if (!targetPrice || isNaN(targetPrice)) {
      return res.status(400).json({
        success: false,
        error: 'Target price is required and must be a number'
      });
    }

    // 获取当前价格
    const cacheKey = `real-time-${type}-${id}`;
    const currentPriceData = await req.cacheService.get(cacheKey);
    
    if (!currentPriceData) {
      return res.status(404).json({
        success: false,
        error: 'Current price not available'
      });
    }

    const currentPrice = currentPriceData.minPrice || currentPriceData.price;
    const targetPriceNum = parseFloat(targetPrice);

    let alertTriggered = false;
    let message = '';

    if (condition === 'below' && currentPrice <= targetPriceNum) {
      alertTriggered = true;
      message = `价格已降至 ¥${currentPrice}，低于目标价格 ¥${targetPriceNum}`;
    } else if (condition === 'above' && currentPrice >= targetPriceNum) {
      alertTriggered = true;
      message = `价格已涨至 ¥${currentPrice}，高于目标价格 ¥${targetPriceNum}`;
    }

    res.json({
      success: true,
      data: {
        id,
        type,
        currentPrice,
        targetPrice: targetPriceNum,
        condition,
        alertTriggered,
        message,
        priceDifference: currentPrice - targetPriceNum,
        percentageDifference: ((currentPrice - targetPriceNum) / targetPriceNum * 100).toFixed(2)
      }
    });

  } catch (error) {
    req.logger.error('Get price alert error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
});

// 创建价格预警
router.post('/alerts', async (req, res) => {
  try {
    const { type, id, targetPrice, condition = 'below', email, phone } = req.body;
    
    if (!type || !['hotel', 'flight'].includes(type)) {
      return res.status(400).json({
        success: false,
        error: 'Type is required and must be hotel or flight'
      });
    }

    if (!id) {
      return res.status(400).json({
        success: false,
        error: 'ID is required'
      });
    }

    if (!targetPrice || isNaN(targetPrice)) {
      return res.status(400).json({
        success: false,
        error: 'Target price is required and must be a number'
      });
    }

    const PriceAlert = req.PriceAlert;
    const alert = new PriceAlert({
      type,
      id,
      targetPrice: parseFloat(targetPrice),
      condition,
      email,
      phone,
      createdAt: new Date(),
      active: true
    });

    await alert.save();

    res.json({
      success: true,
      data: alert
    });

  } catch (error) {
    req.logger.error('Create price alert error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
});

// 获取用户的价格预警
router.get('/alerts/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    const PriceAlert = req.PriceAlert;
    const alerts = await PriceAlert.find({ userId, active: true })
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: alerts
    });

  } catch (error) {
    req.logger.error('Get user alerts error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
});

// 删除价格预警
router.delete('/alerts/:alertId', async (req, res) => {
  try {
    const { alertId } = req.params;
    
    const PriceAlert = req.PriceAlert;
    const result = await PriceAlert.findByIdAndUpdate(
      alertId,
      { active: false },
      { new: true }
    );

    if (!result) {
      return res.status(404).json({
        success: false,
        error: 'Alert not found'
      });
    }

    res.json({
      success: true,
      data: result
    });

  } catch (error) {
    req.logger.error('Delete price alert error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
});

// 获取价格统计
router.get('/stats', async (req, res) => {
  try {
    const { type, period = '7d' } = req.query;
    
    const endDate = new Date();
    let startDate;
    
    switch (period) {
      case '1d':
        startDate = new Date(endDate.getTime() - 24 * 60 * 60 * 1000);
        break;
      case '7d':
        startDate = new Date(endDate.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(endDate.getTime() - 7 * 24 * 60 * 60 * 1000);
    }

    const PriceHistory = req.PriceHistory;
    const query = {
      type,
      timestamp: {
        $gte: startDate,
        $lte: endDate
      }
    };

    const history = await PriceHistory.find(query)
      .select('summary');

    const stats = {
      totalSearches: history.length,
      avgPrice: 0,
      minPrice: Infinity,
      maxPrice: 0,
      priceChanges: 0,
      bestPlatform: null,
      platformStats: {}
    };

    let totalPrice = 0;
    const platformPrices = {};

    history.forEach(record => {
      if (record.summary && record.summary.avgPrice) {
        totalPrice += record.summary.avgPrice;
        stats.minPrice = Math.min(stats.minPrice, record.summary.priceRange?.min || Infinity);
        stats.maxPrice = Math.max(stats.maxPrice, record.summary.priceRange?.max || 0);
      }
    });

    if (history.length > 0) {
      stats.avgPrice = Math.round(totalPrice / history.length);
    }

    res.json({
      success: true,
      data: {
        ...stats,
        period: {
          start: startDate,
          end: endDate,
          label: period
        }
      }
    });

  } catch (error) {
    req.logger.error('Get price stats error:', error);
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
    req.cacheService = priceService.cacheService;
    req.PriceHistory = require('../models/PriceHistory');
    req.PriceAlert = require('../models/PriceAlert');
    next();
  };
};

// 导出路由器
module.exports.router = router;