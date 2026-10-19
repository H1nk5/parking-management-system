/**
 * 认证中间件
 * 功能：JWT token验证和权限控制
 */

const jwt = require('jsonwebtoken');
const { getJwtSecret } = require('./config');

/**
 * 生成JWT Token
 * @param {Object} payload 用户信息
 * @returns {string} JWT Token
 */
function generateToken(payload) {
  return jwt.sign(payload, getJwtSecret(), { expiresIn: '24h' });
}

/**
 * 验证JWT Token中间件
 */
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ code: 401, message: '未提供认证令牌' });
  }

  try {
    const decoded = jwt.verify(token, getJwtSecret());
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(403).json({ code: 403, message: '令牌无效或已过期' });
  }
}

/**
 * 管理员权限验证中间件
 */
function requireAdmin(req, res, next) {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ code: 403, message: '需要管理员权限' });
  }
  next();
}

/**
 * 业主权限验证中间件
 */
function requireUser(req, res, next) {
  if (req.user.role !== 'user') {
    return res.status(403).json({ code: 403, message: '需要业主权限' });
  }
  next();
}

module.exports = {
  generateToken,
  authenticateToken,
  requireAdmin,
  requireUser
};
