/**
 * 报修维修路由
 * 功能：报修申请和维修记录管理
 */

const express = require('express');
const router = express.Router();
const { query, run, getOne } = require('../db');
const { authenticateToken, requireAdmin, requireUser } = require('../auth');

// ==================== 报修相关接口 ====================

/**
 * 获取报修列表
 * GET /api/repairs/requests
 */
router.get('/requests', authenticateToken, async (req, res) => {
  try {
    const { status, type, page = 1, pageSize = 10 } = req.query;
    const offset = (page - 1) * pageSize;

    let sql = `
      SELECT rr.*, u.real_name as submitter_name, ps.spot_number,
             r.status as repair_status, r.worker_name, r.result as repair_result
      FROM repair_requests rr
      LEFT JOIN users u ON rr.user_id = u.id
      LEFT JOIN parking_spots ps ON rr.spot_id = ps.id
      LEFT JOIN repairs r ON r.request_id = rr.id
      WHERE 1=1
    `;
    const params = [];

    // 业主只能看到自己的报修
    if (req.user.role === 'user') {
      sql += ` AND rr.user_id = ?`;
      params.push(req.user.id);
    }

    if (status) {
      sql += ` AND rr.status = ?`;
      params.push(status);
    }

    if (type) {
      sql += ` AND rr.type = ?`;
      params.push(type);
    }

    // 获取总数
    const countSql = sql.replace(/SELECT .* FROM/, 'SELECT COUNT(*) as total FROM');
    const countResult = await getOne(countSql, params);
    const total = countResult?.total || 0;

    // 分页查询
    sql += ` ORDER BY rr.created_at DESC LIMIT ? OFFSET ?`;
    params.push(Number(pageSize), Number(offset));

    const requests = await query(sql, params);

    res.json({
      code: 200,
      data: {
        list: requests,
        total,
        page: Number(page),
        pageSize: Number(pageSize)
      }
    });
  } catch (err) {
    console.error('获取报修列表错误:', err);
    res.status(500).json({ code: 500, message: '服务器错误' });
  }
});

/**
 * 获取报修详情
 * GET /api/repairs/requests/:id
 */
router.get('/requests/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const request = await getOne(`
      SELECT rr.*, u.real_name as submitter_name, u.phone as submitter_phone,
             ps.spot_number, ps.location as spot_location,
             r.id as repair_id, r.worker_name, r.start_time, r.end_time,
             r.result as repair_result, r.cost as repair_cost, r.status as repair_status
      FROM repair_requests rr
      LEFT JOIN users u ON rr.user_id = u.id
      LEFT JOIN parking_spots ps ON rr.spot_id = ps.id
      LEFT JOIN repairs r ON r.request_id = rr.id
      WHERE rr.id = ?
    `, [id]);

    if (!request) {
      return res.status(404).json({ code: 404, message: '报修记录不存在' });
    }

    // 业主只能查看自己的报修
    if (req.user.role === 'user' && request.user_id !== req.user.id) {
      return res.status(403).json({ code: 403, message: '无权查看' });
    }

    res.json({ code: 200, data: request });
  } catch (err) {
    console.error('获取报修详情错误:', err);
    res.status(500).json({ code: 500, message: '服务器错误' });
  }
});

/**
 * 提交报修申请（业主）
 * POST /api/repairs/requests
 */
router.post('/requests', authenticateToken, requireUser, async (req, res) => {
  try {
    const { spot_id, title, description, type = 'parking' } = req.body;

    if (!title || !description) {
      return res.status(400).json({ code: 400, message: '标题和描述不能为空' });
    }

    // 如果指定了车位，验证车位是否存在
    if (spot_id) {
      const spot = await getOne('SELECT id FROM parking_spots WHERE id = ?', [spot_id]);
      if (!spot) {
        return res.status(400).json({ code: 400, message: '车位不存在' });
      }
    }

    const result = await run(
      'INSERT INTO repair_requests (user_id, spot_id, title, description, type) VALUES (?, ?, ?, ?, ?)',
      [req.user.id, spot_id || null, title, description, type]
    );

    res.json({
      code: 200,
      message: '报修提交成功',
      data: { id: result.lastID }
    });
  } catch (err) {
    console.error('提交报修错误:', err);
    res.status(500).json({ code: 500, message: '服务器错误' });
  }
});

/**
 * 更新报修状态（管理员）
 * PUT /api/repairs/requests/:id/status
 */
router.put('/requests/:id/status', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['pending', 'processing', 'completed', 'rejected'].includes(status)) {
      return res.status(400).json({ code: 400, message: '无效的状态值' });
    }

    const request = await getOne('SELECT * FROM repair_requests WHERE id = ?', [id]);
    if (!request) {
      return res.status(404).json({ code: 404, message: '报修记录不存在' });
    }

    await run('UPDATE repair_requests SET status = ? WHERE id = ?', [status, id]);

    res.json({ code: 200, message: '状态更新成功' });
  } catch (err) {
    console.error('更新报修状态错误:', err);
    res.status(500).json({ code: 500, message: '服务器错误' });
  }
});

// ==================== 维修相关接口 ====================

/**
 * 获取维修记录列表
 * GET /api/repairs/records
 */
router.get('/records', authenticateToken, async (req, res) => {
  try {
    const { status, page = 1, pageSize = 10 } = req.query;
    const offset = (page - 1) * pageSize;

    let sql = `
      SELECT r.*, rr.title as request_title, rr.type as request_type,
             u.real_name as submitter_name, ps.spot_number
      FROM repairs r
      LEFT JOIN repair_requests rr ON r.request_id = rr.id
      LEFT JOIN users u ON rr.user_id = u.id
      LEFT JOIN parking_spots ps ON rr.spot_id = ps.id
      WHERE 1=1
    `;
    const params = [];

    if (status) {
      sql += ` AND r.status = ?`;
      params.push(status);
    }

    // 业主只能看到与自己相关的维修
    if (req.user.role === 'user') {
      sql += ` AND rr.user_id = ?`;
      params.push(req.user.id);
    }

    // 获取总数
    const countSql = sql.replace(/SELECT .* FROM/, 'SELECT COUNT(*) as total FROM');
    const countResult = await getOne(countSql, params);
    const total = countResult?.total || 0;

    // 分页查询
    sql += ` ORDER BY r.created_at DESC LIMIT ? OFFSET ?`;
    params.push(Number(pageSize), Number(offset));

    const records = await query(sql, params);

    res.json({
      code: 200,
      data: {
        list: records,
        total,
        page: Number(page),
        pageSize: Number(pageSize)
      }
    });
  } catch (err) {
    console.error('获取维修记录错误:', err);
    res.status(500).json({ code: 500, message: '服务器错误' });
  }
});

/**
 * 创建维修记录（管理员）
 * POST /api/repairs/records
 */
router.post('/records', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { request_id, worker_name, start_time, cost = 0 } = req.body;

    if (!request_id || !worker_name) {
      return res.status(400).json({ code: 400, message: '报修单号和维修人员不能为空' });
    }

    // 检查报修单是否存在
    const request = await getOne('SELECT * FROM repair_requests WHERE id = ?', [request_id]);
    if (!request) {
      return res.status(400).json({ code: 400, message: '报修单不存在' });
    }

    // 检查是否已有维修记录
    const existingRepair = await getOne('SELECT id FROM repairs WHERE request_id = ?', [request_id]);
    if (existingRepair) {
      return res.status(400).json({ code: 400, message: '该报修单已有维修记录' });
    }

    // 创建维修记录
    const result = await run(
      'INSERT INTO repairs (request_id, worker_name, start_time, cost, status) VALUES (?, ?, ?, ?, ?)',
      [request_id, worker_name, start_time || new Date().toISOString(), cost, 'in_progress']
    );

    // 更新报修状态为处理中
    await run('UPDATE repair_requests SET status = ? WHERE id = ?', ['processing', request_id]);

    res.json({
      code: 200,
      message: '维修记录创建成功',
      data: { id: result.lastID }
    });
  } catch (err) {
    console.error('创建维修记录错误:', err);
    res.status(500).json({ code: 500, message: '服务器错误' });
  }
});

/**
 * 更新维修记录（管理员）
 * PUT /api/repairs/records/:id
 */
router.put('/records/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { worker_name, start_time, end_time, result, cost, status } = req.body;

    const repair = await getOne('SELECT * FROM repairs WHERE id = ?', [id]);
    if (!repair) {
      return res.status(404).json({ code: 404, message: '维修记录不存在' });
    }

    await run(
      `UPDATE repairs SET
        worker_name = ?, start_time = ?, end_time = ?, result = ?, cost = ?, status = ?
       WHERE id = ?`,
      [
        worker_name || repair.worker_name,
        start_time || repair.start_time,
        end_time || repair.end_time,
        result || repair.result,
        cost !== undefined ? cost : repair.cost,
        status || repair.status,
        id
      ]
    );

    // 如果维修完成，更新报修状态
    if (status === 'completed') {
      await run('UPDATE repair_requests SET status = ? WHERE id = ?', ['completed', repair.request_id]);
    }

    res.json({ code: 200, message: '更新成功' });
  } catch (err) {
    console.error('更新维修记录错误:', err);
    res.status(500).json({ code: 500, message: '服务器错误' });
  }
});

/**
 * 获取报修统计信息
 * GET /api/repairs/stats/summary
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

    const total = await getOne(`SELECT COUNT(*) as count FROM repair_requests ${whereClause}`, params);
    const pending = await getOne(
      `SELECT COUNT(*) as count FROM repair_requests ${whereClause ? whereClause + ' AND' : 'WHERE'} status = ?`,
      [...params, 'pending']
    );
    const processing = await getOne(
      `SELECT COUNT(*) as count FROM repair_requests ${whereClause ? whereClause + ' AND' : 'WHERE'} status = ?`,
      [...params, 'processing']
    );
    const completed = await getOne(
      `SELECT COUNT(*) as count FROM repair_requests ${whereClause ? whereClause + ' AND' : 'WHERE'} status = ?`,
      [...params, 'completed']
    );

    res.json({
      code: 200,
      data: {
        total: total?.count || 0,
        pending: pending?.count || 0,
        processing: processing?.count || 0,
        completed: completed?.count || 0
      }
    });
  } catch (err) {
    console.error('获取报修统计错误:', err);
    res.status(500).json({ code: 500, message: '服务器错误' });
  }
});

module.exports = router;
