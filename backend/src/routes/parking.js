/**
 * 车位管理路由
 * 功能：车位信息的增删改查
 */

const express = require('express');
const router = express.Router();
const { query, run, getOne } = require('../db');
const { authenticateToken, requireAdmin } = require('../auth');

/**
 * 获取所有车位列表
 * GET /api/parking
 */
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { status, location, keyword, page = 1, pageSize = 10 } = req.query;
    const offset = (page - 1) * pageSize;

    let sql = `
      SELECT ps.*, o.building, o.unit, o.room, o.car_plate,
             u.real_name as owner_name, u.phone as owner_phone
      FROM parking_spots ps
      LEFT JOIN owners o ON ps.owner_id = o.id
      LEFT JOIN users u ON o.user_id = u.id
      WHERE 1=1
    `;
    const params = [];

    if (status) {
      sql += ` AND ps.status = ?`;
      params.push(status);
    }

    if (location) {
      sql += ` AND ps.location LIKE ?`;
      params.push(`%${location}%`);
    }

    if (keyword) {
      sql += ` AND (ps.spot_number LIKE ? OR u.real_name LIKE ? OR o.car_plate LIKE ?)`;
      const likeKeyword = `%${keyword}%`;
      params.push(likeKeyword, likeKeyword, likeKeyword);
    }

    // 获取总数
    const countSql = sql.replace(/SELECT .* FROM/, 'SELECT COUNT(*) as total FROM');
    const countResult = await getOne(countSql, params);
    const total = countResult?.total || 0;

    // 分页查询
    sql += ` ORDER BY ps.spot_number ASC LIMIT ? OFFSET ?`;
    params.push(Number(pageSize), Number(offset));

    const spots = await query(sql, params);

    res.json({
      code: 200,
      data: {
        list: spots,
        total,
        page: Number(page),
        pageSize: Number(pageSize)
      }
    });
  } catch (err) {
    console.error('获取车位列表错误:', err);
    res.status(500).json({ code: 500, message: '服务器错误' });
  }
});

/**
 * 获取单个车位详情
 * GET /api/parking/:id
 */
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const spot = await getOne(`
      SELECT ps.*, o.building, o.unit, o.room, o.car_plate,
             u.real_name as owner_name, u.phone as owner_phone
      FROM parking_spots ps
      LEFT JOIN owners o ON ps.owner_id = o.id
      LEFT JOIN users u ON o.user_id = u.id
      WHERE ps.id = ?
    `, [id]);

    if (!spot) {
      return res.status(404).json({ code: 404, message: '车位不存在' });
    }

    res.json({ code: 200, data: spot });
  } catch (err) {
    console.error('获取车位详情错误:', err);
    res.status(500).json({ code: 500, message: '服务器错误' });
  }
});

/**
 * 添加车位（管理员）
 * POST /api/parking
 */
router.post('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { spot_number, location, status = 'available', owner_id, rent_start, rent_end } = req.body;

    if (!spot_number || !location) {
      return res.status(400).json({ code: 400, message: '车位编号和位置不能为空' });
    }

    // 检查车位编号是否已存在
    const existingSpot = await getOne('SELECT id FROM parking_spots WHERE spot_number = ?', [spot_number]);
    if (existingSpot) {
      return res.status(400).json({ code: 400, message: '车位编号已存在' });
    }

    const result = await run(
      'INSERT INTO parking_spots (spot_number, location, status, owner_id, rent_start, rent_end) VALUES (?, ?, ?, ?, ?, ?)',
      [spot_number, location, status, owner_id || null, rent_start || null, rent_end || null]
    );

    res.json({
      code: 200,
      message: '添加成功',
      data: { id: result.lastID }
    });
  } catch (err) {
    console.error('添加车位错误:', err);
    res.status(500).json({ code: 500, message: '服务器错误' });
  }
});

/**
 * 更新车位信息（管理员）
 * PUT /api/parking/:id
 */
router.put('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { spot_number, location, status, owner_id, rent_start, rent_end } = req.body;

    const spot = await getOne('SELECT * FROM parking_spots WHERE id = ?', [id]);
    if (!spot) {
      return res.status(404).json({ code: 404, message: '车位不存在' });
    }

    // 检查车位编号是否重复
    if (spot_number && spot_number !== spot.spot_number) {
      const existingSpot = await getOne('SELECT id FROM parking_spots WHERE spot_number = ? AND id != ?', [spot_number, id]);
      if (existingSpot) {
        return res.status(400).json({ code: 400, message: '车位编号已存在' });
      }
    }

    await run(
      'UPDATE parking_spots SET spot_number = ?, location = ?, status = ?, owner_id = ?, rent_start = ?, rent_end = ? WHERE id = ?',
      [
        spot_number || spot.spot_number,
        location || spot.location,
        status || spot.status,
        owner_id !== undefined ? (owner_id || null) : spot.owner_id,
        rent_start !== undefined ? (rent_start || null) : spot.rent_start,
        rent_end !== undefined ? (rent_end || null) : spot.rent_end,
        id
      ]
    );

    res.json({ code: 200, message: '更新成功' });
  } catch (err) {
    console.error('更新车位错误:', err);
    res.status(500).json({ code: 500, message: '服务器错误' });
  }
});

/**
 * 删除车位（管理员）
 * DELETE /api/parking/:id
 */
router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const spot = await getOne('SELECT * FROM parking_spots WHERE id = ?', [id]);
    if (!spot) {
      return res.status(404).json({ code: 404, message: '车位不存在' });
    }

    // 检查是否有未完成的报修
    const repairRequest = await getOne(
      'SELECT id FROM repair_requests WHERE spot_id = ? AND status IN (?, ?)',
      [id, 'pending', 'processing']
    );
    if (repairRequest) {
      return res.status(400).json({ code: 400, message: '该车位有未完成的报修，无法删除' });
    }

    await run('DELETE FROM parking_spots WHERE id = ?', [id]);

    res.json({ code: 200, message: '删除成功' });
  } catch (err) {
    console.error('删除车位错误:', err);
    res.status(500).json({ code: 500, message: '服务器错误' });
  }
});

/**
 * 获取车位统计信息
 * GET /api/parking/stats/summary
 */
router.get('/stats/summary', authenticateToken, async (req, res) => {
  try {
    const total = await getOne('SELECT COUNT(*) as count FROM parking_spots');
    const available = await getOne('SELECT COUNT(*) as count FROM parking_spots WHERE status = ?', ['available']);
    const occupied = await getOne('SELECT COUNT(*) as count FROM parking_spots WHERE status = ?', ['occupied']);
    const maintenance = await getOne('SELECT COUNT(*) as count FROM parking_spots WHERE status = ?', ['maintenance']);

    res.json({
      code: 200,
      data: {
        total: total?.count || 0,
        available: available?.count || 0,
        occupied: occupied?.count || 0,
        maintenance: maintenance?.count || 0
      }
    });
  } catch (err) {
    console.error('获取车位统计错误:', err);
    res.status(500).json({ code: 500, message: '服务器错误' });
  }
});

module.exports = router;
