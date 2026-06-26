# 小区车位管理系统

一个基于 Web 的小区车位管理系统，用于管理车位信息、报修维修、费用缴纳等物业服务。

## 技术栈

- **前端**：React + Tailwind CSS + Vite
- **后端**：Node.js + Express
- **数据库**：SQLite（sql.js）

## 功能特性

### 管理员（物业）功能
- 📊 仪表盘：查看系统概览和统计数据
- 👥 业主管理：管理业主信息
- 🅿️ 车位管理：车位信息的增删改查
- 🔧 报修管理：处理业主报修申请
- 💰 费用管理：管理各类费用
- 📦 材料管理：维修材料库存管理
- ⭐ 评价管理：查看业主评价

### 业主功能
- 📊 首页：查看个人概览
- 🅿️ 我的车位：查看车位信息
- 🔧 我的报修：查看报修记录
- 📝 提交报修：提交新的报修申请
- 💰 我的费用：查看和缴纳费用
- ⭐ 我的评价：评价维修服务

## 环境要求

- **Node.js**：v16.0.0 或更高版本
- **npm**：v7.0.0 或更高版本

## 快速启动

### 1. 安装后端依赖

```bash
cd backend
npm install
```

### 2. 初始化数据库

```bash
npm run init-db
```

此命令将创建 SQLite 数据库文件并插入测试数据。

### 3. 启动后端服务

```bash
npm start
```

后端将在 http://localhost:3001 启动。

### 4. 安装前端依赖

打开新的终端窗口：

```bash
cd frontend
npm install
```

### 5. 启动前端开发服务器

```bash
npm run dev
```

前端将在 http://localhost:5173 启动。

### 6. 访问系统

打开浏览器访问 http://localhost:5173

## 测试账号

| 角色 | 用户名 | 密码 |
|------|--------|------|
| 管理员 | admin | admin123 |
| 业主 | user1 | 123456 |
| 业主 | user2 | 123456 |
| 业主 | user3 | 123456 |
| 业主 | user4 | 123456 |
| 业主 | user5 | 123456 |

## 项目结构

```
parking-management-system/
├── backend/                    # 后端项目
│   ├── src/
│   │   ├── init-db.js         # 数据库初始化脚本
│   │   ├── server.js          # Express 服务器入口
│   │   ├── db.js              # 数据库连接模块
│   │   ├── auth.js            # 认证中间件
│   │   └── routes/            # API 路由
│   │       ├── auth.js        # 认证相关接口
│   │       ├── owners.js      # 业主管理接口
│   │       ├── parking.js     # 车位管理接口
│   │       ├── repairs.js     # 报修维修接口
│   │       ├── fees.js        # 费用管理接口
│   │       ├── materials.js   # 材料管理接口
│   │       ├── reviews.js     # 评价管理接口
│   │       └── dashboard.js   # 仪表盘接口
│   ├── parking.db             # SQLite 数据库文件（运行后生成）
│   └── package.json
│
├── frontend/                   # 前端项目
│   ├── src/
│   │   ├── main.jsx           # 应用入口
│   │   ├── App.jsx            # 路由配置
│   │   ├── index.css          # 全局样式
│   │   ├── context/           # 上下文
│   │   │   └── AuthContext.jsx
│   │   ├── services/          # API 服务
│   │   │   └── api.js
│   │   ├── layouts/           # 布局组件
│   │   │   └── MainLayout.jsx
│   │   └── pages/             # 页面组件
│   │       ├── Login.jsx
│   │       ├── Dashboard.jsx
│   │       ├── Owners.jsx
│   │       ├── Parking.jsx
│   │       ├── Repairs.jsx
│   │       ├── Fees.jsx
│   │       ├── Materials.jsx
│   │       ├── Reviews.jsx
│   │       ├── MyParking.jsx
│   │       ├── MyRepairs.jsx
│   │       ├── SubmitRepair.jsx
│   │       ├── MyFees.jsx
│   │       └── MyReviews.jsx
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   └── package.json
│
└── README.md                   # 项目说明文档
```

## 数据库设计

系统包含以下 9 张数据表：

1. **users** - 用户表（管理员和业主）
2. **owners** - 业主信息表
3. **parking_spots** - 车位表
4. **repair_requests** - 报修申请表
5. **repairs** - 维修记录表
6. **fees** - 费用表
7. **materials** - 材料库存表
8. **material_usage** - 材料使用记录表
9. **reviews** - 评价表

## API 接口

### 认证相关
- `POST /api/auth/login` - 用户登录
- `POST /api/auth/register` - 用户注册
- `GET /api/auth/me` - 获取当前用户信息

### 业主管理
- `GET /api/owners` - 获取业主列表
- `POST /api/owners` - 添加业主
- `PUT /api/owners/:id` - 更新业主
- `DELETE /api/owners/:id` - 删除业主

### 车位管理
- `GET /api/parking` - 获取车位列表
- `POST /api/parking` - 添加车位
- `PUT /api/parking/:id` - 更新车位
- `DELETE /api/parking/:id` - 删除车位

### 报修维修
- `GET /api/repairs/requests` - 获取报修列表
- `POST /api/repairs/requests` - 提交报修
- `PUT /api/repairs/requests/:id/status` - 更新报修状态
- `GET /api/repairs/records` - 获取维修记录
- `POST /api/repairs/records` - 创建维修记录

### 费用管理
- `GET /api/fees` - 获取费用列表
- `POST /api/fees` - 添加费用
- `PUT /api/fees/:id/pay` - 缴费

### 材料管理
- `GET /api/materials` - 获取材料列表
- `POST /api/materials` - 添加材料
- `POST /api/materials/usage` - 记录材料使用

### 评价管理
- `GET /api/reviews` - 获取评价列表
- `POST /api/reviews` - 提交评价
- `GET /api/reviews/pending/list` - 获取待评价列表

### 仪表盘
- `GET /api/dashboard/stats` - 获取统计数据
- `GET /api/dashboard/recent-repairs` - 获取最近报修

## 打包部署

### 构建前端

```bash
cd frontend
npm run build
```

构建产物将生成在 `frontend/build` 目录。

### 生产环境部署

1. 构建前端项目
2. 将 `backend` 目录和 `frontend/build` 目录部署到服务器
3. 安装后端依赖并初始化数据库
4. 启动后端服务

```bash
cd backend
npm install
npm run init-db
NODE_ENV=production node src/server.js
```

## 常见问题

### 1. 数据库文件在哪里？

运行 `npm run init-db` 后，数据库文件会生成在 `backend/parking.db`。

### 2. 如何重新初始化数据库？

删除 `backend/parking.db` 文件，然后重新运行：

```bash
cd backend
npm run init-db
```

### 3. 端口被占用怎么办？

修改 `backend/src/server.js` 中的 `PORT` 变量，或设置环境变量：

```bash
PORT=3002 npm start
```

## 许可证

本项目仅供学习使用。
