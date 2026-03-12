const express = require('express');
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');
const mongoose = require('mongoose');
const redis = require('redis');
const cron = require('node-cron');
const winston = require('winston');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

// 导入路由
const searchRoutes = require('./routes/search');
const priceRoutes = require('./routes/prices');
const platformRoutes = require('./routes/platforms');
const userRoutes = require('./routes/users');

// 导入服务
const PriceService = require('./services/PriceService');
const ScraperService = require('./services/ScraperService');
const CacheService = require('./services/CacheService');

// 配置日志
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
    new winston.transports.Console()
  ]
});

const app = express();
const server = http.createServer(app);

// CORS 配置
const corsOptions = {
  origin: process.env.FRONTEND_URL || '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

// 速率限制器
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分钟
  max: 100, // 每个IP最多100个请求
  message: { error: 'Too many requests, please try again later.' }
});

// 中间件
app.use(cors(corsOptions));
app.use(limiter);
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, parameterLimit: 50000 }));

// 安全头
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  next();
});

// WebSocket 配置
const io = socketIo(server, {
  cors: corsOptions,
  pingTimeout: 60000,
  pingInterval: 25000
});

// 数据库连接
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/price-comparison', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      maxPoolSize: 10
    });
    logger.info('Connected to MongoDB');
  } catch (err) {
    logger.error('MongoDB connection error:', err);
  }
};
connectDB();

// Redis连接
const redisClient = redis.createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379'
});
redisClient.on('error', (err) => logger.error('Redis Client Error', err));
redisClient.on('connect', () => logger.info('Connected to Redis'));

const connectRedis = async () => {
  try {
    await redisClient.connect();
  } catch (err) {
    logger.error('Redis connection error:', err);
  }
};
connectRedis();

// 初始化服务
const cacheService = new CacheService(redisClient);
const scraperService = new ScraperService(cacheService, logger);
const priceService = new PriceService(scraperService, cacheService, logger);

// 路由
app.use('/api/search', searchRoutes(priceService, logger));
app.use('/api/prices', priceRoutes(priceService, logger));
app.use('/api/platforms', platformRoutes(logger));
app.use('/api/users', userRoutes(logger));

// WebSocket连接处理
io.on('connection', (socket) => {
  logger.info(`Client connected: ${socket.id}`);
  
  socket.on('join-search', (searchId) => {
    socket.join(`search-${searchId}`);
    logger.info(`Client ${socket.id} joined search room: ${searchId}`);
  });

  socket.on('leave-search', (searchId) => {
    socket.leave(`search-${searchId}`);
    logger.info(`Client ${socket.id} left search room: ${searchId}`);
  });

  socket.on('disconnect', () => {
    logger.info(`Client disconnected: ${socket.id}`);
  });
});

// 定时任务：更新价格数据（每5分钟）
cron.schedule('*/5 * * * *', async () => {
  try {
    logger.info('Running scheduled price update');
    await priceService.updatePrices();
    io.emit('price-update', { timestamp: new Date().toISOString() });
  } catch (error) {
    logger.error('Scheduled price update failed:', error);
  }
});

// 健康检查
app.get('/health', (req, res) => {
  const mongoStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
  const redisStatus = redisClient.isOpen ? 'connected' : 'disconnected';
  
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    services: {
      mongodb: mongoStatus,
      redis: redisStatus
    }
  });
});

// 错误处理中间件
app.use((err, req, res, next) => {
  logger.error(err.stack);
  res.status(500).json({ 
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// 404处理
app.use((req, res) => {
  res.status(404).json({ error: 'Not Found' });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
});

// 优雅关闭
const gracefulShutdown = async () => {
  logger.info('Shutting down gracefully...');
  
  server.close(() => {
    logger.info('HTTP server closed');
  });

  try {
    await mongoose.connection.close();
    logger.info('MongoDB connection closed');
  } catch (err) {
    logger.error('Error closing MongoDB:', err);
  }

  try {
    await redisClient.quit();
    logger.info('Redis connection closed');
  } catch (err) {
    logger.error('Error closing Redis:', err);
  }

  process.exit(0);
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

module.exports = { app, io };