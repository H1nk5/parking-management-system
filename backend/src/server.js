/**
 * 小区车位管理系统 - 后端服务器
 * 功能：提供RESTful API接口
 */

require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require('path');
const { getCorsOrigins, getJwtSecret } = require('./config');

// 导入路由模块
const authRoutes = require('./routes/auth');
const ownerRoutes = require('./routes/owners');
const parkingRoutes = require('./routes/parking');
const repairRoutes = require('./routes/repairs');
const feeRoutes = require('./routes/fees');
const materialRoutes = require('./routes/materials');
const reviewRoutes = require('./routes/reviews');
const dashboardRoutes = require('./routes/dashboard');

function createApp() {
  // Fail before accepting traffic when production security settings are invalid.
  getJwtSecret();
  const app = express();

  // 中间件配置
  app.use(cors({ origin: getCorsOrigins() }));
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// 静态文件服务（用于前端构建产物）
  app.use(express.static(path.join(__dirname, '../../frontend/build')));

// API路由注册
  app.use('/api/auth', authRoutes);         // 认证相关
  app.use('/api/owners', ownerRoutes);       // 业主管理
  app.use('/api/parking', parkingRoutes);    // 车位管理
  app.use('/api/repairs', repairRoutes);     // 报修维修
  app.use('/api/fees', feeRoutes);           // 费用管理
  app.use('/api/materials', materialRoutes); // 材料管理
  app.use('/api/reviews', reviewRoutes);     // 评价管理
  app.use('/api/dashboard', dashboardRoutes); // 仪表盘

// 健康检查接口
  app.get('/api/health', (_req, res) => {
    res.json({
      code: 200,
      message: '服务运行正常',
      timestamp: new Date().toISOString()
    });
  });

// 前端路由回退（支持SPA路由）
  app.get('*', (_req, res) => {
    const indexPath = path.join(__dirname, '../../frontend/build/index.html');
    const fs = require('fs');
    if (fs.existsSync(indexPath)) {
      res.sendFile(indexPath);
    } else {
      res.status(404).json({ code: 404, message: '接口不存在' });
    }
  });

// 全局错误处理中间件
  app.use((err, _req, res, _next) => {
    console.error('服务器错误:', err);
    res.status(500).json({
      code: 500,
      message: '服务器内部错误',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  });

  return app;
}

// 启动服务器
function startServer() {
  const port = Number(process.env.PORT || 3001);
  return createApp().listen(port, () => {
    console.log('\n🚗 小区车位管理系统后端已启动');
    console.log(`📡 服务地址: http://localhost:${port}`);
    console.log(`📋 API文档: http://localhost:${port}/api/health`);
    console.log('\n按 Ctrl+C 停止服务\n');
  });
}

if (require.main === module) {
  startServer();
}

module.exports = { createApp, startServer };
