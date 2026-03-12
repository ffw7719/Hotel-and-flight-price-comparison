# 🏨 酒店机票比价AI Agent

一个智能的机票酒店比价平台，实时获取美团、携程、飞猪等平台的价格信息，为用户提供最优选择。

## ✨ 功能特性

- 🔍 **多平台比价**: 支持美团、携程、飞猪等主流平台
- 📊 **实时价格**: 实时获取最新价格信息
- 💰 **价格趋势**: 查看历史价格走势
- 🤖 **智能推荐**: 基于用户偏好智能推荐最优方案
- 📱 **响应式设计**: 支持桌面和移动端
- ⚡ **高性能**: 优化的数据抓取和缓存机制

---

## 🚀 一键部署（推荐）

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/ffw7719/Hotel-and-flight-price-comparison)

[![Deploy to Cloudflare Pages](https://deploy.workers.cloudflare.com/button)](https://dash.cloudflare.com/?to=/:account/pages/new?repo=https://github.com/ffw7719/Hotel-and-flight-price-comparison)

---

## 🚀 部署教程（小白专属）

### 方法一：Vercel 一键部署（推荐）

#### 准备工作
1. 注册 [Vercel](https://vercel.com) 账号（用 GitHub 登录）
2. 注册 [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) 账号（免费版够用）
3. 注册 [Redis Cloud](https://redis.com/cloud/) 账号（免费版够用）

#### 部署步骤（图文详解）

**第一步：Fork 本项目**
1. 打开 [GitHub 仓库](https://github.com/ffw7719/Hotel-and-flight-price-comparison)
2. 点击右上角 **Fork** 按钮
3. 选择你的 GitHub 账号

**第二步：部署到 Vercel**
1. 打开 [Vercel](https://vercel.com) 并登录
2. 点击 **Add New...** → **Project**
3. 在 **Import Git Repository** 中搜索 `Hotel-and-flight-price-comparison`
4. 点击 **Import**
5. 在 **Configure Project** 页面：
   - Framework Preselect: `Other`
   - Build Command: 留空
   - Output Directory: 留空
6. 点击 **Deploy**

**第三步：配置数据库（最重要！）**

1. **MongoDB Atlas 配置：**
   - 登录 [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
   - 创建免费集群（选择 Singapore 区域，中国访问快）
   - 创建数据库用户（用户名密码记住）
   - 在 Network Access 添加 `0.0.0.0/0` 允许所有IP
   - 点击 **Connect** → **Connect your application**
   - 复制连接字符串，格式如下：
   ```
   mongodb+srv://用户名:密码@cluster0.xxxxx.mongodb.net/price-comparison?retryWrites=true&w=majority
   ```

2. **Redis Cloud 配置：**
   - 登录 [Redis Cloud](https://redis.com/cloud/)
   - 创建免费订阅
   - 获取连接信息（主机、端口、密码）

**第四步：设置环境变量**
1. 回到 Vercel 项目页面
2. 点击 **Settings** → **Environment Variables**
3. 添加以下变量：
   ```
   MONGODB_URI = 你的MongoDB连接字符串
   REDIS_URL = redis://:密码@主机:端口
   JWT_SECRET = 任意随机字符串（如：abc123xyz）
   NODE_ENV = production
   ```

4. 点击 **Deployments**
5. 点击最新部署旁边的 **...** → **Redeploy**

**✅ 部署完成！**
- 访问 `https://你的项目名.vercel.app`

---

### 方法二：Cloudflare 部署

#### 准备工作
1. 注册 [Cloudflare](https://cloudflare.com) 账号
2. 注册 [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) 账号
3. 注册 [Redis Cloud](https://redis.com/cloud/) 账号

#### 部署步骤

**第一步：部署前端到 Cloudflare Pages**
1. 打开 [Cloudflare Dashboard](https://dash.cloudflare.com)
2. 点击 **Workers 和 Pages** → **创建应用程序** → **Pages** → **连接到 Git**
3. 选择你的 GitHub 仓库
4. 设置：
   - 生产分支：`main`
   - 构建命令：`npm run build`
   - 输出目录：`.next`
5. 点击 **保存并部署**

**第二步：部署后端到 Cloudflare Workers**
```bash
# 1. 安装 Wrangler CLI
npm install -g wrangler

# 2. 登录
wrangler login

# 3. 进入后端目录
cd backend

# 4. 创建 D1 数据库（可选，使用外部数据库可跳过）
wrangler d1 create price-comparison

# 5. 部署
wrangler deploy
```

**第三步：配置环境变量**
```bash
# 设置密钥
wrangler secret put MONGODB_URI
# 输入你的 MongoDB 连接字符串

wrangler secret put REDIS_URL
# 输入你的 Redis 连接字符串

wrangler secret put JWT_SECRET
# 输入你的 JWT 密钥
```

**✅ 部署完成！**
- 前端：`https://你的项目.pages.dev`
- 后端：`https://你的项目.workers.dev`

---

## 💾 资源使用估算

### Vercel（免费版）
| 资源 | 额度 |
|------|------|
| 带宽 | 100GB/月 |
| 构建时间 | 6,000分钟/月 |
| 函数执行 | 100小时/月 |

### Cloudflare（免费版）
| 资源 | 额度 |
|------|------|
| Workers 请求 | 100,000次/天 |
| Pages 带宽 | 无限制 |
| D1 数据库 | 5MB |
| KV 缓存 | 1GB |

---

## 🔧 本地开发

### 环境要求
- Node.js 18.x 或更高
- MongoDB（本地或 Atlas）
- Redis（本地或云端）

### 快速启动

```bash
# 1. 克隆项目
git clone https://github.com/ffw7719/Hotel-and-flight-price-comparison.git
cd hotel-flight-price-comparison

# 2. 安装后端依赖
cd backend
npm install

# 3. 安装前端依赖
cd ../frontend
npm install

# 4. 配置环境变量
cp ../backend/.env.example ../backend/.env
# 编辑 .env 文件，填入你的数据库连接信息

# 5. 启动后端
cd ../backend
npm run dev

# 6. 另开终端启动前端
cd ../frontend
npm run dev
```

访问 http://localhost:3001 查看前端页面

---

## 📱 项目预览

![项目截图](https://via.placeholder.com/800x400?text=Hotel+Flight+Price+Comparison)

---

## 📚 技术栈

### 后端
- **框架**: Node.js + Express
- **数据库**: MongoDB + Redis
- **爬虫**: Puppeteer + Cheerio
- **API**: RESTful + WebSocket

### 前端  
- **框架**: React + Next.js
- **样式**: Tailwind CSS
- **状态管理**: Redux Toolkit
- **图表**: Chart.js

---

## 📁 项目结构

```
hotel-flight-price-comparison/
├── backend/                 # 后端服务
│   ├── src/
│   │   ├── app.js          # 主应用入口
│   │   ├── models/         # 数据模型
│   │   ├── routes/         # API 路由
│   │   └── services/       # 业务服务
│   └── package.json
├── frontend/               # 前端应用
│   ├── src/
│   │   ├── app/           # Next.js 页面
│   │   ├── components/    # React 组件
│   │   └── lib/           # 工具函数
│   └── package.json
├── vercel.json            # Vercel 配置
├── _routes.json           # Cloudflare 配置
└── DEPLOY.md              # 详细部署文档
```

---

## 🤝 贡献指南

1. Fork 本项目
2. 创建特性分支：`git checkout -b feature/你的功能`
3. 提交更改：`git commit -m '添加新功能'`
4. 推送到分支：`git push origin feature/你的功能`
5. 创建 Pull Request

---

## 📄 许可证

MIT License - 查看 [LICENSE](LICENSE) 文件了解详情。

---

## ⚠️ 免责声明

本项目仅供学习和研究使用，请遵守相关平台的API使用条款和robots.txt协议。
