/**
 * 评价管理路由
 * 功能：业主对维修服务的评价管理
 */

const express = require('express');
const router = express.Router();
const { query, run, getOne } = require('../db');
const { authenticateToken, requireUser } = require('../auth');

/**
 * 获取评价列表
 * GET /api/reviews
 */
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { page = 1, pageSize = 10 } = req.query;
    const offset = (page - 1) * pageSize;

    let sql = `
      SELECT rv.*, u.real_name as reviewer_name, u.phone as reviewer_phone,
             rr.title as repair_title, rr.type as repair_type,
             rp.worker_name
      FROM reviews rv
      LEFT JOIN users u ON rv.user_id = u.id
      LEFT JOIN repairs rp ON rv.repair_id = rp.id
      LEFT JOIN repair_requests rr ON rp.request_id = rr.id
      WHERE 1=1
    `;
    const params = [];

    // 业主只能看到自己的评价
    if (req.user.role === 'user') {
      sql += ` AND rv.user_id = ?`;
      params.push(req.user.id);
    }

    // 获取总数
    const countSql = sql.replace(/SELECT .* FROM/, 'SELECT COUNT(*) as total FROM');
    const countResult = await getOne(countSql, params);
    const total = countResult?.total || 0;

    // 分页查询
    sql += ` ORDER BY rv.created_at DESC LIMIT ? OFFSET ?`;
    params.push(Number(pageSize), Number(offset));

    const reviews = await query(sql, params);

    res.json({
      code: 200,
      data: {
        list: reviews,
        total,
        page: Number(page),
        pageSize: Number(pageSize)
      }
    });
  } catch (err) {
    console.error('获取评价列表错误:', err);
    res.status(500).json({ code: 500, message: '服务器错误' });
  }
});

/**
 * 获取评价详情
 * GET /api/reviews/:id
 */
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const review = await getOne(`
      SELECT rv.*, u.real_name as reviewer_name, u.phone as reviewer_phone,
             rr.title as repair_title, rr.type as repair_type, rr.description as repair_desc,
             rp.worker_name, rp.result as repair_result, rp.cost as repair_cost
      FROM reviews rv
      LEFT JOIN users u ON rv.user_id = u.id
      LEFT JOIN repairs rp ON rv.repair_id = rp.id
      LEFT JOIN repair_requests rr ON rp.request_id = rr.id
      WHERE rv.id = ?
    `, [id]);

    if (!review) {
      return res.status(404).json({ code: 404, message: '评价不存在' });
    }

    res.json({ code: 200, data: review });
  } catch (err) {
    console.error('获取评价详情错误:', err);
    res.status(500).json({ code: 500, message: '服务器错误' });
  }
});

/**
 * 提交评价（业主）
 * POST /api/reviews
 */
router.post('/', authenticateToken, requireUser, async (req, res) => {
  try {
    const { repair_id, rating, comment } = req.body;

    if (!repair_id || !rating) {
      return res.status(400).json({ code: 400, message: '维修记录ID和评分不能为空' });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({ code: 400, message: '评分必须在1-5之间' });
    }

    // 检查维修记录是否存在且已完成
    const repair = await getOne(`
      SELECT r.*, rr.user_id
      FROM repairs r
      LEFT JOIN repair_requests rr ON r.request_id = rr.id
      WHERE r.id = ? AND r.status = 'completed'
    `, [repair_id]);

    if (!repair) {
      return res.status(400).json({ code: 400, message: '维修记录不存在或未完成' });
    }

    // 检查是否是该维修的报修人
    if (repair.user_id !== req.user.id) {
      return res.status(403).json({ code: 403, message: '只能评价自己提交的报修' });
    }

    // 检查是否已评价
    const existingReview = await getOne('SELECT id FROM reviews WHERE repair_id = ?', [repair_id]);
    if (existingReview) {
      return res.status(400).json({ code: 400, message: '该维修已评价' });
    }

    const result = await run(
      'INSERT INTO reviews (user_id, repair_id, rating, comment) VALUES (?, ?, ?, ?)',
      [req.user.id, repair_id, rating, comment || null]
    );

    res.json({
      code: 200,
      message: '评价成功',
      data: { id: result.lastID }
    });
  } catch (err) {
    console.error('提交评价错误:', err);
    res.status(500).json({ code: 500, message: '服务器错误' });
  }
});

/**
 * 更新评价（业主）
 * PUT /api/reviews/:id
 */
router.put('/:id', authenticateToken, requireUser, async (req, res) => {
  try {
    const { id } = req.params;
    const { rating, comment } = req.body;

    const review = await getOne('SELECT * FROM reviews WHERE id = ?', [id]);
    if (!review) {
      return res.status(404).json({ code: 404, message: '评价不存在' });
    }

    // 只能修改自己的评价
    if (review.user_id !== req.user.id) {
      return res.status(403).json({ code: 403, message: '只能修改自己的评价' });
    }

    if (rating && (rating < 1 || rating > 5)) {
      return res.status(400).json({ code: 400, message: '评分必须在1-5之间' });
    }

    await run(
      'UPDATE reviews SET rating = ?, comment = ? WHERE id = ?',
      [rating || review.rating, comment ?? review.comment, id]
    );

    res.json({ code: 200, message: '更新成功' });
  } catch (err) {
    console.error('更新评价错误:', err);
    res.status(500).json({ code: 500, message: '服务器错误' });
  }
});

/**
 * 删除评价（业主或管理员）
 * DELETE /api/reviews/:id
 */
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const review = await getOne('SELECT * FROM reviews WHERE id = ?', [id]);
    if (!review) {
      return res.status(404).json({ code: 404, message: '评价不存在' });
    }

    // 业主只能删除自己的评价
    if (req.user.role === 'user' && review.user_id !== req.user.id) {
      return res.status(403).json({ code: 403, message: '只能删除自己的评价' });
    }

    await run('DELETE FROM reviews WHERE id = ?', [id]);

    res.json({ code: 200, message: '删除成功' });
  } catch (err) {
    console.error('删除评价错误:', err);
    res.status(500).json({ code: 500, message: '服务器错误' });
  }
});

/**
 * 获取待评价的维修记录（业主）
 * GET /api/reviews/pending
 */
router.get('/pending/list', authenticateToken, requireUser, async (req, res) => {
  try {
    const sql = `
      SELECT r.*, rr.title as request_title, rr.type as request_type,
             rr.description as request_desc, r.worker_name
      FROM repairs r
      LEFT JOIN repair_requests rr ON r.request_id = rr.id
      LEFT JOIN reviews rv ON rv.repair_id = r.id
      WHERE rr.user_id = ? AND r.status = 'completed' AND rv.id IS NULL
      ORDER BY r.end_time DESC
    `;

    const pendingReviews = await query(sql, [req.user.id]);

    res.json({
      code: 200,
      data: pendingReviews
    });
  } catch (err) {
    console.error('获取待评价列表错误:', err);
    res.status(500).json({ code: 500, message: '服务器错误' });
  }
});

/**
 * 获取评价统计信息
 * GET /api/reviews/stats/summary
 */
router.get('/stats/summary', authenticateToken, async (req, res) => {
  try {
    const totalReviews = await getOne('SELECT COUNT(*) as count FROM reviews');
    const avgRating = await getOne('SELECT COALESCE(AVG(rating), 0) as avg FROM reviews');
    const ratingDistribution = await query(
      'SELECT rating, COUNT(*) as count FROM reviews GROUP BY rating ORDER BY rating DESC'
    );

    // 填充缺失的评分等级
    const distribution = [5, 4, 3, 2, 1].map(rating => {
      const found = ratingDistribution.find(r => r.rating === rating);
      return { rating, count: found?.count || 0 };
    });

    res.json({
      code: 200,
      data: {
        totalReviews: totalReviews?.count || 0,
        avgRating: Math.round((avgRating?.avg || 0) * 10) / 10,
        distribution
      }
    });
  } catch (err) {
    console.error('获取评价统计错误:', err);
    res.status(500).json({ code: 500, message: '服务器错误' });
  }
});

module.exports = router;
