const express = require('express');
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');
const mongoose = require('mongoose');
const redis = require('redis');
const cron = require('node-cron');
const winston = require('winston');
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
  level: 'info',
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
const io = socketIo(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:3001",
    methods: ["GET", "POST"]
  }
});

// 中间件
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true }));

// 数据库连接
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/price-comparison', {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  logger.info('Connected to MongoDB');
}).catch(err => {
  logger.error('MongoDB connection error:', err);
});

// Redis连接
const redisClient = redis.createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379'
});
redisClient.on('error', (err) => logger.error('Redis Client Error', err));
redisClient.connect().then(() => {
  logger.info('Connected to Redis');
});

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
  logger.info('New client connected');
  
  socket.on('join-search', (searchId) => {
    socket.join(`search-${searchId}`);
    logger.info(`Client joined search room: ${searchId}`);
  });

  socket.on('disconnect', () => {
    logger.info('Client disconnected');
  });
});

// 定时任务：更新价格数据
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
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
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
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  server.close(() => {
    logger.info('Process terminated');
    mongoose.connection.close();
    redisClient.quit();
  });
});

module.exports = app;