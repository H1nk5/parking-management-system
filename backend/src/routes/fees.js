/**
 * 费用管理路由
 * 功能：费用记录管理、缴费状态更新
 */

const express = require('express');
const router = express.Router();
const { query, run, getOne } = require('../db');
const { authenticateToken, requireAdmin } = require('../auth');

/**
 * 获取费用列表
 * GET /api/fees
 */
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { type, status, page = 1, pageSize = 10 } = req.query;
    const offset = (page - 1) * pageSize;

    let sql = `
      SELECT f.*, u.real_name, u.phone, o.building, o.unit, o.room
      FROM fees f
      LEFT JOIN users u ON f.user_id = u.id
      LEFT JOIN owners o ON o.user_id = u.id
      WHERE 1=1
    `;
    const params = [];

    // 业主只能看到自己的费用
    if (req.user.role === 'user') {
      sql += ` AND f.user_id = ?`;
      params.push(req.user.id);
    }

    if (type) {
      sql += ` AND f.type = ?`;
      params.push(type);
    }

    if (status) {
      sql += ` AND f.status = ?`;
      params.push(status);
    }

    // 获取总数
    const countSql = sql.replace(/SELECT .* FROM/, 'SELECT COUNT(*) as total FROM');
    const countResult = await getOne(countSql, params);
    const total = countResult?.total || 0;

    // 分页查询
    sql += ` ORDER BY f.created_at DESC LIMIT ? OFFSET ?`;
    params.push(Number(pageSize), Number(offset));

    const fees = await query(sql, params);

    res.json({
      code: 200,
      data: {
        list: fees,
        total,
        page: Number(page),
        pageSize: Number(pageSize)
      }
    });
  } catch (err) {
    console.error('获取费用列表错误:', err);
    res.status(500).json({ code: 500, message: '服务器错误' });
  }
});

/**
 * 获取费用详情
 * GET /api/fees/:id
 */
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const fee = await getOne(`
      SELECT f.*, u.real_name, u.phone, o.building, o.unit, o.room
      FROM fees f
      LEFT JOIN users u ON f.user_id = u.id
      LEFT JOIN owners o ON o.user_id = u.id
      WHERE f.id = ?
    `, [id]);

    if (!fee) {
      return res.status(404).json({ code: 404, message: '费用记录不存在' });
    }

    // 业主只能查看自己的费用
    if (req.user.role === 'user' && fee.user_id !== req.user.id) {
      return res.status(403).json({ code: 403, message: '无权查看' });
    }

    res.json({ code: 200, data: fee });
  } catch (err) {
    console.error('获取费用详情错误:', err);
    res.status(500).json({ code: 500, message: '服务器错误' });
  }
});

/**
 * 添加费用记录（管理员）
 * POST /api/fees
 */
router.post('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { user_id, type, amount, due_date, remark } = req.body;

    if (!user_id || !type || !amount || !due_date) {
      return res.status(400).json({ code: 400, message: '必填字段不能为空' });
    }

    if (!['rent', 'management', 'repair'].includes(type)) {
      return res.status(400).json({ code: 400, message: '无效的费用类型' });
    }

    // 检查用户是否存在
    const user = await getOne('SELECT id FROM users WHERE id = ?', [user_id]);
    if (!user) {
      return res.status(400).json({ code: 400, message: '用户不存在' });
    }

    const result = await run(
      'INSERT INTO fees (user_id, type, amount, due_date, remark) VALUES (?, ?, ?, ?, ?)',
      [user_id, type, amount, due_date, remark || null]
    );

    res.json({
      code: 200,
      message: '添加成功',
      data: { id: result.lastID }
    });
  } catch (err) {
    console.error('添加费用错误:', err);
    res.status(500).json({ code: 500, message: '服务器错误' });
  }
});

/**
 * 更新费用状态（管理员或业主缴费）
 * PUT /api/fees/:id/pay
 */
router.put('/:id/pay', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const fee = await getOne('SELECT * FROM fees WHERE id = ?', [id]);
    if (!fee) {
      return res.status(404).json({ code: 404, message: '费用记录不存在' });
    }

    // 业主只能缴纳自己的费用
    if (req.user.role === 'user' && fee.user_id !== req.user.id) {
      return res.status(403).json({ code: 403, message: '无权操作' });
    }

    if (fee.status === 'paid') {
      return res.status(400).json({ code: 400, message: '该费用已缴纳' });
    }

    const paidDate = new Date().toISOString().split('T')[0];
    await run('UPDATE fees SET status = ?, paid_date = ? WHERE id = ?', ['paid', paidDate, id]);

    res.json({ code: 200, message: '缴费成功' });
  } catch (err) {
    console.error('缴费错误:', err);
    res.status(500).json({ code: 500, message: '服务器错误' });
  }
});

/**
 * 更新费用信息（管理员）
 * PUT /api/fees/:id
 */
router.put('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { type, amount, due_date, remark, status } = req.body;

    const fee = await getOne('SELECT * FROM fees WHERE id = ?', [id]);
    if (!fee) {
      return res.status(404).json({ code: 404, message: '费用记录不存在' });
    }

    await run(
      'UPDATE fees SET type = ?, amount = ?, due_date = ?, remark = ?, status = ? WHERE id = ?',
      [
        type || fee.type,
        amount !== undefined ? amount : fee.amount,
        due_date || fee.due_date,
        remark ?? fee.remark,
        status || fee.status,
        id
      ]
    );

    res.json({ code: 200, message: '更新成功' });
  } catch (err) {
    console.error('更新费用错误:', err);
    res.status(500).json({ code: 500, message: '服务器错误' });
  }
});

/**
 * 删除费用记录（管理员）
 * DELETE /api/fees/:id
 */
router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const fee = await getOne('SELECT * FROM fees WHERE id = ?', [id]);
    if (!fee) {
      return res.status(404).json({ code: 404, message: '费用记录不存在' });
    }

    await run('DELETE FROM fees WHERE id = ?', [id]);

    res.json({ code: 200, message: '删除成功' });
  } catch (err) {
    console.error('删除费用错误:', err);
    res.status(500).json({ code: 500, message: '服务器错误' });
  }
});

/**
 * 获取费用统计信息
 * GET /api/fees/stats/summary
 */
router.get('/stats/summary', authenticateToken, async (req, res) => {
  try {
    let whereClause = '';
    const params = [];

    // 业主只统计自己的
    if (req.user.role === 'user') {
      whereClause = 'WHERE user_id = ?';
      params.push(req.user.id);
    }

    const totalAmount = await getOne(
      `SELECT COALESCE(SUM(amount), 0) as total FROM fees ${whereClause}`,
      params
    );
    const paidAmount = await getOne(
      `SELECT COALESCE(SUM(amount), 0) as total FROM fees ${whereClause ? whereClause + ' AND' : 'WHERE'} status = ?`,
      [...params, 'paid']
    );
    const unpaidAmount = await getOne(
      `SELECT COALESCE(SUM(amount), 0) as total FROM fees ${whereClause ? whereClause + ' AND' : 'WHERE'} status = ?`,
      [...params, 'unpaid']
    );
    const unpaidCount = await getOne(
      `SELECT COUNT(*) as count FROM fees ${whereClause ? whereClause + ' AND' : 'WHERE'} status = ?`,
      [...params, 'unpaid']
    );

    res.json({
      code: 200,
      data: {
        totalAmount: totalAmount?.total || 0,
        paidAmount: paidAmount?.total || 0,
        unpaidAmount: unpaidAmount?.total || 0,
        unpaidCount: unpaidCount?.count || 0
      }
    });
  } catch (err) {
    console.error('获取费用统计错误:', err);
    res.status(500).json({ code: 500, message: '服务器错误' });
  }
});

module.exports = router;
