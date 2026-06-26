/**
 * 业主管理路由
 * 功能：业主信息的增删改查
 */

const express = require('express');
const router = express.Router();
const { query, run, getOne } = require('../db');
const { authenticateToken, requireAdmin } = require('../auth');

/**
 * 获取所有业主列表（管理员）
 * GET /api/owners
 */
router.get('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { keyword, page = 1, pageSize = 10 } = req.query;
    const offset = (page - 1) * pageSize;

    let sql = `
      SELECT o.*, u.username, u.real_name, u.phone, u.email,
             ps.spot_number, ps.location as spot_location
      FROM owners o
      LEFT JOIN users u ON o.user_id = u.id
      LEFT JOIN parking_spots ps ON ps.owner_id = o.id
      WHERE 1=1
    `;
    const params = [];

    if (keyword) {
      sql += ` AND (u.real_name LIKE ? OR o.building LIKE ? OR o.room LIKE ? OR o.car_plate LIKE ?)`;
      const likeKeyword = `%${keyword}%`;
      params.push(likeKeyword, likeKeyword, likeKeyword, likeKeyword);
    }

    // 获取总数
    const countSql = sql.replace(/SELECT .* FROM/, 'SELECT COUNT(*) as total FROM');
    const countResult = await getOne(countSql, params);
    const total = countResult?.total || 0;

    // 分页查询
    sql += ` ORDER BY o.id DESC LIMIT ? OFFSET ?`;
    params.push(Number(pageSize), Number(offset));

    const owners = await query(sql, params);

    res.json({
      code: 200,
      data: {
        list: owners,
        total,
        page: Number(page),
        pageSize: Number(pageSize)
      }
    });
  } catch (err) {
    console.error('获取业主列表错误:', err);
    res.status(500).json({ code: 500, message: '服务器错误' });
  }
});

/**
 * 获取单个业主详情
 * GET /api/owners/:id
 */
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const owner = await getOne(`
      SELECT o.*, u.username, u.real_name, u.phone, u.email,
             ps.spot_number, ps.location as spot_location, ps.status as spot_status,
             ps.rent_start, ps.rent_end
      FROM owners o
      LEFT JOIN users u ON o.user_id = u.id
      LEFT JOIN parking_spots ps ON ps.owner_id = o.id
      WHERE o.id = ?
    `, [id]);

    if (!owner) {
      return res.status(404).json({ code: 404, message: '业主不存在' });
    }

    res.json({ code: 200, data: owner });
  } catch (err) {
    console.error('获取业主详情错误:', err);
    res.status(500).json({ code: 500, message: '服务器错误' });
  }
});

/**
 * 添加业主（管理员）
 * POST /api/owners
 */
router.post('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { user_id, building, unit, room, car_plate } = req.body;

    if (!user_id || !building || !unit || !room) {
      return res.status(400).json({ code: 400, message: '必填字段不能为空' });
    }

    // 检查用户是否存在且为业主角色
    const user = await getOne('SELECT * FROM users WHERE id = ? AND role = ?', [user_id, 'user']);
    if (!user) {
      return res.status(400).json({ code: 400, message: '用户不存在或不是业主角色' });
    }

    // 检查是否已有业主信息
    const existingOwner = await getOne('SELECT id FROM owners WHERE user_id = ?', [user_id]);
    if (existingOwner) {
      return res.status(400).json({ code: 400, message: '该用户已有业主信息' });
    }

    const result = await run(
      'INSERT INTO owners (user_id, building, unit, room, car_plate) VALUES (?, ?, ?, ?, ?)',
      [user_id, building, unit, room, car_plate || null]
    );

    res.json({
      code: 200,
      message: '添加成功',
      data: { id: result.lastID }
    });
  } catch (err) {
    console.error('添加业主错误:', err);
    res.status(500).json({ code: 500, message: '服务器错误' });
  }
});

/**
 * 更新业主信息（管理员）
 * PUT /api/owners/:id
 */
router.put('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { building, unit, room, car_plate } = req.body;

    const owner = await getOne('SELECT * FROM owners WHERE id = ?', [id]);
    if (!owner) {
      return res.status(404).json({ code: 404, message: '业主不存在' });
    }

    await run(
      'UPDATE owners SET building = ?, unit = ?, room = ?, car_plate = ? WHERE id = ?',
      [building || owner.building, unit || owner.unit, room || owner.room, car_plate ?? owner.car_plate, id]
    );

    res.json({ code: 200, message: '更新成功' });
  } catch (err) {
    console.error('更新业主错误:', err);
    res.status(500).json({ code: 500, message: '服务器错误' });
  }
});

/**
 * 删除业主（管理员）
 * DELETE /api/owners/:id
 */
router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const owner = await getOne('SELECT * FROM owners WHERE id = ?', [id]);
    if (!owner) {
      return res.status(404).json({ code: 404, message: '业主不存在' });
    }

    // 检查是否有关联的车位
    const spot = await getOne('SELECT id FROM parking_spots WHERE owner_id = ?', [id]);
    if (spot) {
      return res.status(400).json({ code: 400, message: '该业主有关联的车位，请先解绑' });
    }

    await run('DELETE FROM owners WHERE id = ?', [id]);

    res.json({ code: 200, message: '删除成功' });
  } catch (err) {
    console.error('删除业主错误:', err);
    res.status(500).json({ code: 500, message: '服务器错误' });
  }
});

module.exports = router;
