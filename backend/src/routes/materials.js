/**
 * 材料管理路由
 * 功能：维修材料库存管理、材料使用记录
 */

const express = require('express');
const router = express.Router();
const { query, run, getOne } = require('../db');
const { authenticateToken, requireAdmin } = require('../auth');

/**
 * 获取材料列表
 * GET /api/materials
 */
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { keyword, page = 1, pageSize = 10 } = req.query;
    const offset = (page - 1) * pageSize;

    let sql = `SELECT * FROM materials WHERE 1=1`;
    const params = [];

    if (keyword) {
      sql += ` AND (name LIKE ? OR specification LIKE ?)`;
      const likeKeyword = `%${keyword}%`;
      params.push(likeKeyword, likeKeyword);
    }

    // 获取总数
    const countSql = sql.replace(/SELECT .* FROM/, 'SELECT COUNT(*) as total FROM');
    const countResult = await getOne(countSql, params);
    const total = countResult?.total || 0;

    // 分页查询
    sql += ` ORDER BY id DESC LIMIT ? OFFSET ?`;
    params.push(Number(pageSize), Number(offset));

    const materials = await query(sql, params);

    res.json({
      code: 200,
      data: {
        list: materials,
        total,
        page: Number(page),
        pageSize: Number(pageSize)
      }
    });
  } catch (err) {
    console.error('获取材料列表错误:', err);
    res.status(500).json({ code: 500, message: '服务器错误' });
  }
});

/**
 * 获取材料详情
 * GET /api/materials/:id
 */
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const material = await getOne('SELECT * FROM materials WHERE id = ?', [id]);
    if (!material) {
      return res.status(404).json({ code: 404, message: '材料不存在' });
    }

    res.json({ code: 200, data: material });
  } catch (err) {
    console.error('获取材料详情错误:', err);
    res.status(500).json({ code: 500, message: '服务器错误' });
  }
});

/**
 * 添加材料（管理员）
 * POST /api/materials
 */
router.post('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { name, specification, unit, quantity, unit_price } = req.body;

    if (!name || !unit || unit_price === undefined) {
      return res.status(400).json({ code: 400, message: '材料名称、单位和单价不能为空' });
    }

    const result = await run(
      'INSERT INTO materials (name, specification, unit, quantity, unit_price) VALUES (?, ?, ?, ?, ?)',
      [name, specification || null, unit, quantity || 0, unit_price]
    );

    res.json({
      code: 200,
      message: '添加成功',
      data: { id: result.lastID }
    });
  } catch (err) {
    console.error('添加材料错误:', err);
    res.status(500).json({ code: 500, message: '服务器错误' });
  }
});

/**
 * 更新材料信息（管理员）
 * PUT /api/materials/:id
 */
router.put('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, specification, unit, quantity, unit_price } = req.body;

    const material = await getOne('SELECT * FROM materials WHERE id = ?', [id]);
    if (!material) {
      return res.status(404).json({ code: 404, message: '材料不存在' });
    }

    await run(
      'UPDATE materials SET name = ?, specification = ?, unit = ?, quantity = ?, unit_price = ? WHERE id = ?',
      [
        name || material.name,
        specification ?? material.specification,
        unit || material.unit,
        quantity !== undefined ? quantity : material.quantity,
        unit_price !== undefined ? unit_price : material.unit_price,
        id
      ]
    );

    res.json({ code: 200, message: '更新成功' });
  } catch (err) {
    console.error('更新材料错误:', err);
    res.status(500).json({ code: 500, message: '服务器错误' });
  }
});

/**
 * 删除材料（管理员）
 * DELETE /api/materials/:id
 */
router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const material = await getOne('SELECT * FROM materials WHERE id = ?', [id]);
    if (!material) {
      return res.status(404).json({ code: 404, message: '材料不存在' });
    }

    // 检查是否有使用记录
    const usage = await getOne('SELECT id FROM material_usage WHERE material_id = ? LIMIT 1', [id]);
    if (usage) {
      return res.status(400).json({ code: 400, message: '该材料有使用记录，无法删除' });
    }

    await run('DELETE FROM materials WHERE id = ?', [id]);

    res.json({ code: 200, message: '删除成功' });
  } catch (err) {
    console.error('删除材料错误:', err);
    res.status(500).json({ code: 500, message: '服务器错误' });
  }
});

/**
 * 记录材料使用（管理员）
 * POST /api/materials/usage
 */
router.post('/usage', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { material_id, repair_id, quantity } = req.body;

    if (!material_id || !repair_id || !quantity) {
      return res.status(400).json({ code: 400, message: '必填字段不能为空' });
    }

    // 检查材料是否存在且库存充足
    const material = await getOne('SELECT * FROM materials WHERE id = ?', [material_id]);
    if (!material) {
      return res.status(400).json({ code: 400, message: '材料不存在' });
    }
    if (material.quantity < quantity) {
      return res.status(400).json({ code: 400, message: '库存不足' });
    }

    // 检查维修记录是否存在
    const repair = await getOne('SELECT id FROM repairs WHERE id = ?', [repair_id]);
    if (!repair) {
      return res.status(400).json({ code: 400, message: '维修记录不存在' });
    }

    // 记录使用
    const result = await run(
      'INSERT INTO material_usage (material_id, repair_id, quantity) VALUES (?, ?, ?)',
      [material_id, repair_id, quantity]
    );

    // 扣减库存
    await run(
      'UPDATE materials SET quantity = quantity - ? WHERE id = ?',
      [quantity, material_id]
    );

    res.json({
      code: 200,
      message: '记录成功',
      data: { id: result.lastID }
    });
  } catch (err) {
    console.error('记录材料使用错误:', err);
    res.status(500).json({ code: 500, message: '服务器错误' });
  }
});

/**
 * 获取材料使用记录
 * GET /api/materials/usage/list
 */
router.get('/usage/list', authenticateToken, async (req, res) => {
  try {
    const { material_id, repair_id, page = 1, pageSize = 10 } = req.query;
    const offset = (page - 1) * pageSize;

    let sql = `
      SELECT mu.*, m.name as material_name, m.specification, m.unit,
             rr.title as repair_title
      FROM material_usage mu
      LEFT JOIN materials m ON mu.material_id = m.id
      LEFT JOIN repairs r ON mu.repair_id = r.id
      LEFT JOIN repair_requests rr ON r.request_id = rr.id
      WHERE 1=1
    `;
    const params = [];

    if (material_id) {
      sql += ` AND mu.material_id = ?`;
      params.push(material_id);
    }

    if (repair_id) {
      sql += ` AND mu.repair_id = ?`;
      params.push(repair_id);
    }

    // 获取总数
    const countSql = sql.replace(/SELECT .* FROM/, 'SELECT COUNT(*) as total FROM');
    const countResult = await getOne(countSql, params);
    const total = countResult?.total || 0;

    // 分页查询
    sql += ` ORDER BY mu.created_at DESC LIMIT ? OFFSET ?`;
    params.push(Number(pageSize), Number(offset));

    const usages = await query(sql, params);

    res.json({
      code: 200,
      data: {
        list: usages,
        total,
        page: Number(page),
        pageSize: Number(pageSize)
      }
    });
  } catch (err) {
    console.error('获取材料使用记录错误:', err);
    res.status(500).json({ code: 500, message: '服务器错误' });
  }
});

/**
 * 补充材料库存（管理员）
 * PUT /api/materials/:id/restock
 */
router.put('/:id/restock', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { quantity } = req.body;

    if (!quantity || quantity <= 0) {
      return res.status(400).json({ code: 400, message: '补充数量必须大于0' });
    }

    const material = await getOne('SELECT * FROM materials WHERE id = ?', [id]);
    if (!material) {
      return res.status(404).json({ code: 404, message: '材料不存在' });
    }

    await run('UPDATE materials SET quantity = quantity + ? WHERE id = ?', [quantity, id]);

    res.json({ code: 200, message: '补货成功' });
  } catch (err) {
    console.error('补充库存错误:', err);
    res.status(500).json({ code: 500, message: '服务器错误' });
  }
});

module.exports = router;
