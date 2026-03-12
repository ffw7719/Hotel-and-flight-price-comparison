# 酒店机票比价AI Agent - 部署指南

## 📦 部署平台要求

### Vercel 部署
- **Node.js 版本**: 18.x 或更高
- **需要**: Vercel 账号
- **存储空间**: 约 100MB (不含 node_modules)
- **推荐配置**: Pro 计划 (可选，免费版也可)

### Cloudflare 部署
- **Workers**: 处理后端 API
- **Pages**: 托管前端 Next.js
- **D1**: PostgreSQL 数据库 (免费额度: 5MB)
- **KV**: Redis 缓存 (免费额度: 1GB)
- **存储空间**: 
  - Workers: 1MB 内存
  - Pages: 20MB 静态文件
  - D1: 5MB 免费

---

## 🚀 Vercel 部署步骤

### 1. 准备
```bash
# 安装 Vercel CLI
npm i -g vercel

# 登录
vercel login
```

### 2. 部署
```bash
# 进入项目目录
cd hotel-flight-price-comparison

# 部署
vercel

# 生产部署
vercel --prod
```

### 3. 环境变量
在 Vercel Dashboard → Settings → Environment Variables 添加:
```
MONGODB_URI=your_mongodb_connection_string
REDIS_URL=your_redis_connection_string
JWT_SECRET=your_secret_key
```

---

## 🚀 Cloudflare 部署步骤

### 1. 前端 (Pages)
```bash
# 安装 Wrangler
npm i -g wrangler

# 登录
wrangler login

# 部署前端
cd frontend
wrangler pages deploy .next
```

### 2. 后端 (Workers)
```bash
# 创建 D1 数据库
wrangler d1 create price-comparison

# 创建 KV 命名空间
wrangler kv:namespace create PRICE_CACHE

# 部署
wrangler deploy
```

### 3. 环境变量
```bash
# 设置 secrets
wrangler secret put MONGODB_URI
wrangler secret put REDIS_URL
wrangler secret put JWT_SECRET
```

---

## 💾 资源使用估算

### Vercel
| 资源 | 免费版 | Pro版 |
|------|--------|-------|
| 带宽 | 100GB/月 | 1TB/月 |
| 构建时间 | 6,000 分钟/月 | 无限制 |
| 服务器函数 | 100小时/月 | 无限制 |
| 存储 | 100MB | 100MB |

### Cloudflare (免费版)
| 资源 | 额度 |
|------|------|
| Workers 请求 | 100,000次/天 |
| Workers 内存 | 128MB |
| Pages 带宽 | 无限制 |
| D1 存储 | 5MB |
| KV 存储 | 1GB |

---

## 🔧 推荐配置

### 开发/测试
- Vercel 免费版
- MongoDB Atlas 免费集群
- Redis Cloud 免费版

### 生产环境
- Vercel Pro ($20/月)
- MongoDB Atlas M10 ($57/月)
- Redis Cloud ($0/月 起)

---

## 📝 注意事项

1. **爬虫限制**: Vercel/Cloudflare 有请求超时限制，爬虫需优化
2. **数据库**: 建议使用托管服务 (Atlas, Cloudflare D1)
3. **缓存**: 使用 Redis 减少 API 调用
4. **域名**: 可绑定自定义域名
