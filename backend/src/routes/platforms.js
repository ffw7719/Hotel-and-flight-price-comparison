const express = require('express');
const router = express.Router();

// 获取所有平台信息
router.get('/', async (req, res) => {
  try {
    const platforms = [
      {
        id: 'meituan',
        name: '美团',
        baseUrl: process.env.MEITUAN_BASE_URL || 'https://hotel.meituan.com',
        enabled: true,
        features: ['hotels', 'flights'],
        description: '美团酒店和机票预订平台',
        logo: '/assets/platforms/meituan.png',
        color: '#FFD100'
      },
      {
        id: 'ctrip',
        name: '携程',
        baseUrl: process.env.CTRIP_BASE_URL || 'https://www.ctrip.com',
        enabled: true,
        features: ['hotels', 'flights'],
        description: '携程旅行网，提供酒店、机票等预订服务',
        logo: '/assets/platforms/ctrip.png',
        color: '#0066CC'
      },
      {
        id: 'fliggy',
        name: '飞猪',
        baseUrl: process.env.FLIGGY_BASE_URL || 'https://www.fliggy.com',
        enabled: true,
        features: ['hotels', 'flights'],
        description: '飞猪旅行，阿里巴巴旗下旅行平台',
        logo: '/assets/platforms/fliggy.png',
        color: '#FF6A00'
      }
    ];

    res.json({
      success: true,
      data: platforms
    });

  } catch (error) {
    req.logger.error('Get platforms error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
});

// 获取特定平台信息
router.get('/:platformId', async (req, res) => {
  try {
    const { platformId } = req.params;
    
    const platforms = {
      meituan: {
        id: 'meituan',
        name: '美团',
        baseUrl: process.env.MEITUAN_BASE_URL || 'https://hotel.meituan.com',
        enabled: true,
        features: ['hotels', 'flights'],
        description: '美团酒店和机票预订平台',
        logo: '/assets/platforms/meituan.png',
        color: '#FFD100',
        stats: {
          totalHotels: 0,
          totalFlights: 0,
          avgResponseTime: 0,
          successRate: 0
        }
      },
      ctrip: {
        id: 'ctrip',
        name: '携程',
        baseUrl: process.env.CTRIP_BASE_URL || 'https://www.ctrip.com',
        enabled: true,
        features: ['hotels', 'flights'],
        description: '携程旅行网，提供酒店、机票等预订服务',
        logo: '/assets/platforms/ctrip.png',
        color: '#0066CC',
        stats: {
          totalHotels: 0,
          totalFlights: 0,
          avgResponseTime: 0,
          successRate: 0
        }
      },
      fliggy: {
        id: 'fliggy',
        name: '飞猪',
        baseUrl: process.env.FLIGGY_BASE_URL || 'https://www.fliggy.com',
        enabled: true,
        features: ['hotels', 'flights'],
        description: '飞猪旅行，阿里巴巴旗下旅行平台',
        logo: '/assets/platforms/fliggy.png',
        color: '#FF6A00',
        stats: {
          totalHotels: 0,
          totalFlights: 0,
          avgResponseTime: 0,
          successRate: 0
        }
      }
    };

    const platform = platforms[platformId];
    
    if (!platform) {
      return res.status(404).json({
        success: false,
        error: 'Platform not found'
      });
    }

    // 获取平台统计信息
    try {
      const SearchHistory = req.SearchHistory;
      const recentSearches = await SearchHistory.find({
        timestamp: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
      }).select('results responseTime');

      let totalSearches = 0;
      let totalResponseTime = 0;
      let successfulSearches = 0;

      recentSearches.forEach(search => {
        if (search.results && search.results.platformStats && search.results.platformStats[platformId]) {
          totalSearches++;
          totalResponseTime += search.responseTime;
          successfulSearches++;
        }
      });

      platform.stats = {
        totalHotels: Math.floor(Math.random() * 10000) + 1000, // 模拟数据
        totalFlights: Math.floor(Math.random() * 5000) + 500, // 模拟数据
        avgResponseTime: totalSearches > 0 ? Math.round(totalResponseTime / totalSearches) : 0,
        successRate: totalSearches > 0 ? Math.round((successfulSearches / totalSearches) * 100) : 0
      };
    } catch (statsError) {
      req.logger.warn('Failed to get platform stats:', statsError.message);
    }

    res.json({
      success: true,
      data: platform
    });

  } catch (error) {
    req.logger.error('Get platform error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
});

// 获取平台状态
router.get('/:platformId/status', async (req, res) => {
  try {
    const { platformId } = req.params;
    
    const platforms = ['meituan', 'ctrip', 'fliggy'];
    
    if (!platforms.includes(platformId)) {
      return res.status(404).json({
        success: false,
        error: 'Platform not found'
      });
    }

    // 检查平台状态
    const status = {
      platform: platformId,
      online: true,
      responseTime: Math.floor(Math.random() * 1000) + 200, // 模拟响应时间
      lastChecked: new Date(),
      features: {
        hotels: true,
        flights: true,
        realTime: true,
        booking: false
      },
      issues: []
    };

    // 模拟状态检查
    if (Math.random() < 0.1) { // 10% 概率有问题
      status.online = false;
      status.issues.push('平台暂时无法访问');
    }

    res.json({
      success: true,
      data: status
    });

  } catch (error) {
    req.logger.error('Get platform status error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
});

// 更新平台配置
router.put('/:platformId/config', async (req, res) => {
  try {
    const { platformId } = req.params;
    const { enabled, baseUrl, features } = req.body;
    
    const platforms = ['meituan', 'ctrip', 'fliggy'];
    
    if (!platforms.includes(platformId)) {
      return res.status(404).json({
        success: false,
        error: 'Platform not found'
      });
    }

    // 在实际应用中，这里应该更新数据库中的平台配置
    // 现在只是返回成功响应
    const config = {
      platform: platformId,
      enabled: enabled !== undefined ? enabled : true,
      baseUrl: baseUrl || process.env[`${platformId.toUpperCase()}_BASE_URL`],
      features: features || ['hotels', 'flights'],
      updatedAt: new Date()
    };

    res.json({
      success: true,
      data: config
    });

  } catch (error) {
    req.logger.error('Update platform config error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
});

// 获取平台统计数据
router.get('/:platformId/stats', async (req, res) => {
  try {
    const { platformId } = req.params;
    const { period = '7d' } = req.query;
    
    const platforms = ['meituan', 'ctrip', 'fliggy'];
    
    if (!platforms.includes(platformId)) {
      return res.status(404).json({
        success: false,
        error: 'Platform not found'
      });
    }

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

    // 生成模拟统计数据
    const stats = {
      platform: platformId,
      period: {
        start: startDate,
        end: endDate,
        label: period
      },
      searches: Math.floor(Math.random() * 1000) + 100,
      hotels: Math.floor(Math.random() * 5000) + 1000,
      flights: Math.floor(Math.random() * 2000) + 500,
      avgResponseTime: Math.floor(Math.random() * 500) + 200,
      successRate: Math.floor(Math.random() * 20) + 80,
      errors: Math.floor(Math.random() * 10),
      dailyStats: []
    };

    // 生成每日统计数据
    for (let i = 0; i < 7; i++) {
      const date = new Date(endDate.getTime() - i * 24 * 60 * 60 * 1000);
      stats.dailyStats.unshift({
        date: date.toISOString().split('T')[0],
        searches: Math.floor(Math.random() * 150) + 50,
        successRate: Math.floor(Math.random() * 20) + 80,
        avgResponseTime: Math.floor(Math.random() * 300) + 200
      });
    }

    res.json({
      success: true,
      data: stats
    });

  } catch (error) {
    req.logger.error('Get platform stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
});

// 测试平台连接
router.post('/:platformId/test', async (req, res) => {
  try {
    const { platformId } = req.params;
    
    const platforms = ['meituan', 'ctrip', 'fliggy'];
    
    if (!platforms.includes(platformId)) {
      return res.status(404).json({
        success: false,
        error: 'Platform not found'
      });
    }

    // 模拟连接测试
    const testResult = {
      platform: platformId,
      timestamp: new Date(),
      status: 'success',
      responseTime: Math.floor(Math.random() * 1000) + 200,
      tests: {
        connectivity: true,
        apiAccess: true,
        dataRetrieval: Math.random() > 0.1, // 90% 成功率
        authentication: true
      },
      message: '平台连接测试通过'
    };

    if (!testResult.tests.dataRetrieval) {
      testResult.status = 'partial';
      testResult.message = '平台连接正常，但数据获取可能存在问题';
    }

    res.json({
      success: true,
      data: testResult
    });

  } catch (error) {
    req.logger.error('Test platform connection error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
});

module.exports = (logger) => {
  return (req, res, next) => {
    req.logger = logger;
    req.SearchHistory = require('../models/SearchHistory');
    next();
  };
};

// 导出路由器
module.exports.router = router;