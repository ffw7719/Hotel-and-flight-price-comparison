# Hotel and Flight Price Comparison AI Agent

一个智能的机票酒店比价平台，实时获取美团、携程、飞猪等平台的价格信息，为用户提供最优选择。

## 功能特性

- 🔍 **多平台比价**: 支持美团、携程、飞猪等主流平台
- 📊 **实时价格**: 实时获取最新价格信息
- 💰 **最终价格**: 获取结算页面的真实价格（含税费、服务费等）
- 🤖 **AI推荐**: 基于用户偏好智能推荐最优方案
- 📱 **响应式设计**: 支持桌面和移动端
- ⚡ **高性能**: 优化的数据抓取和缓存机制

## 技术栈

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

### 部署
- **容器化**: Docker
- **云服务**: AWS/阿里云
- **CI/CD**: GitHub Actions

## 项目结构

```
hotel-flight-price-comparison/
├── backend/                 # 后端服务
│   ├── src/
│   │   ├── controllers/     # 控制器
│   │   ├── models/          # 数据模型
│   │   ├── routes/          # 路由
│   │   ├── services/        # 业务逻辑
│   │   ├── scrapers/        # 爬虫模块
│   │   ├── utils/           # 工具函数
│   │   └── app.js           # 应用入口
│   ├── config/              # 配置文件
│   └── tests/               # 测试
├── frontend/                # 前端应用
│   ├── src/
│   │   ├── components/      # 组件
│   │   ├── pages/           # 页面
│   │   ├── hooks/           # 自定义钩子
│   │   ├── store/           # 状态管理
│   │   ├── utils/           # 工具函数
│   │   └── styles/          # 样式
│   └── public/              # 静态资源
├── config/                  # 共享配置
├── data/                    # 数据文件
├── scripts/                 # 脚本工具
└── docker/                  # Docker配置
```

## 快速开始

### 环境要求
- Node.js >= 16
- MongoDB >= 4.4
- Redis >= 6.0
- Docker (可选)

### 安装依赖
```bash
# 安装后端依赖
cd backend && npm install

# 安装前端依赖
cd frontend && npm install
```

### 配置环境变量
```bash
# 复制环境变量模板
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env

# 编辑环境变量
vim backend/.env
vim frontend/.env
```

### 启动服务
```bash
# 启动后端服务
cd backend && npm run dev

# 启动前端服务
cd frontend && npm run dev
```

### 使用Docker
```bash
# 构建并启动所有服务
docker-compose up -d
```

## API文档

启动后端服务后，访问 `http://localhost:3000/api/docs` 查看完整API文档。

## 贡献指南

1. Fork 本项目
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 创建 Pull Request

## 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 免责声明

本项目仅供学习和研究使用，请遵守相关平台的API使用条款和robots.txt协议。