/**
 * 认证路由
 * 功能：用户登录、注册、获取用户信息
 */

const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { query, run, getOne } = require('../db');
const { generateToken, authenticateToken } = require('../auth');

/**
 * 用户登录
 * POST /api/auth/login
 */
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ code: 400, message: '用户名和密码不能为空' });
    }

    // 查询用户
    const user = await getOne('SELECT * FROM users WHERE username = ?', [username]);

    if (!user) {
      return res.status(401).json({ code: 401, message: '用户名或密码错误' });
    }

    // 验证密码
    const isValidPassword = bcrypt.compareSync(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ code: 401, message: '用户名或密码错误' });
    }

    // 生成Token
    const token = generateToken({
      id: user.id,
      username: user.username,
      role: user.role,
      real_name: user.real_name
    });

    res.json({
      code: 200,
      message: '登录成功',
      data: {
        token,
        user: {
          id: user.id,
          username: user.username,
          real_name: user.real_name,
          role: user.role,
          phone: user.phone,
          email: user.email
        }
      }
    });
  } catch (err) {
    console.error('登录错误:', err);
    res.status(500).json({ code: 500, message: '服务器错误' });
  }
});

/**
 * 用户注册
 * POST /api/auth/register
 */
router.post('/register', async (req, res) => {
  try {
    const { username, password, real_name, phone, email } = req.body;

    // 参数验证
    if (!username || !password || !real_name) {
      return res.status(400).json({ code: 400, message: '用户名、密码和姓名不能为空' });
    }

    // 检查用户名是否已存在
    const existingUser = await getOne('SELECT id FROM users WHERE username = ?', [username]);
    if (existingUser) {
      return res.status(400).json({ code: 400, message: '用户名已存在' });
    }

    // 密码加密
    const hashedPassword = bcrypt.hashSync(password, 10);

    // 插入用户记录
    const result = await run(
      'INSERT INTO users (username, password, real_name, phone, email, role) VALUES (?, ?, ?, ?, ?, ?)',
      [username, hashedPassword, real_name, phone || null, email || null, 'user']
    );

    res.json({
      code: 200,
      message: '注册成功',
      data: { id: result.lastID }
    });
  } catch (err) {
    console.error('注册错误:', err);
    res.status(500).json({ code: 500, message: '服务器错误' });
  }
});

/**
 * 获取当前用户信息
 * GET /api/auth/me
 */
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const user = await getOne(
      'SELECT id, username, real_name, phone, email, role, created_at FROM users WHERE id = ?',
      [req.user.id]
    );

    if (!user) {
      return res.status(404).json({ code: 404, message: '用户不存在' });
    }

    // 如果是业主，获取关联的业主信息
    let ownerInfo = null;
    if (user.role === 'user') {
      ownerInfo = await getOne('SELECT * FROM owners WHERE user_id = ?', [user.id]);
    }

    res.json({
      code: 200,
      data: { ...user, owner_info: ownerInfo }
    });
  } catch (err) {
    console.error('获取用户信息错误:', err);
    res.status(500).json({ code: 500, message: '服务器错误' });
  }
});

module.exports = router;
