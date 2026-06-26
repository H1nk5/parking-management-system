/**
 * 仪表盘路由
 * 功能：首页统计数据
 */

const express = require('express');
const router = express.Router();
const { query, getOne } = require('../db');
const { authenticateToken } = require('../auth');

/**
 * 获取仪表盘统计数据
 * GET /api/dashboard/stats
 */
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    const isAdmin = req.user.role === 'admin';

    // 车位统计
    const parkingStats = {
      total: (await getOne('SELECT COUNT(*) as count FROM parking_spots'))?.count || 0,
      available: (await getOne('SELECT COUNT(*) as count FROM parking_spots WHERE status = ?', ['available']))?.count || 0,
      occupied: (await getOne('SELECT COUNT(*) as count FROM parking_spots WHERE status = ?', ['occupied']))?.count || 0,
      maintenance: (await getOne('SELECT COUNT(*) as count FROM parking_spots WHERE status = ?', ['maintenance']))?.count || 0,
    };

    // 报修统计
    let repairWhere = '';
    const repairParams = [];
    if (!isAdmin) {
      repairWhere = 'WHERE user_id = ?';
      repairParams.push(req.user.id);
    }

    const repairStats = {
      total: (await getOne(`SELECT COUNT(*) as count FROM repair_requests ${repairWhere}`, repairParams))?.count || 0,
      pending: (await getOne(`SELECT COUNT(*) as count FROM repair_requests ${repairWhere ? repairWhere + ' AND' : 'WHERE'} status = ?`, [...repairParams, 'pending']))?.count || 0,
      processing: (await getOne(`SELECT COUNT(*) as count FROM repair_requests ${repairWhere ? repairWhere + ' AND' : 'WHERE'} status = ?`, [...repairParams, 'processing']))?.count || 0,
      completed: (await getOne(`SELECT COUNT(*) as count FROM repair_requests ${repairWhere ? repairWhere + ' AND' : 'WHERE'} status = ?`, [...repairParams, 'completed']))?.count || 0,
    };

    // 费用统计
    let feeWhere = '';
    const feeParams = [];
    if (!isAdmin) {
      feeWhere = 'WHERE user_id = ?';
      feeParams.push(req.user.id);
    }

    const feeStats = {
      totalAmount: (await getOne(`SELECT COALESCE(SUM(amount), 0) as total FROM fees ${feeWhere}`, feeParams))?.total || 0,
      paidAmount: (await getOne(`SELECT COALESCE(SUM(amount), 0) as total FROM fees ${feeWhere ? feeWhere + ' AND' : 'WHERE'} status = ?`, [...feeParams, 'paid']))?.total || 0,
      unpaidAmount: (await getOne(`SELECT COALESCE(SUM(amount), 0) as total FROM fees ${feeWhere ? feeWhere + ' AND' : 'WHERE'} status = ?`, [...feeParams, 'unpaid']))?.total || 0,
    };

    // 业主统计（仅管理员）
    let ownerStats = null;
    if (isAdmin) {
      ownerStats = {
        total: (await getOne('SELECT COUNT(*) as count FROM owners'))?.count || 0,
      };
    }

    // 评价统计
    const reviewStats = {
      total: (await getOne('SELECT COUNT(*) as count FROM reviews'))?.count || 0,
      avgRating: Math.round(((await getOne('SELECT COALESCE(AVG(rating), 0) as avg FROM reviews'))?.avg || 0) * 10) / 10,
    };

    // 材料统计（仅管理员）
    let materialStats = null;
    if (isAdmin) {
      materialStats = {
        total: (await getOne('SELECT COUNT(*) as count FROM materials'))?.count || 0,
        lowStock: (await getOne('SELECT COUNT(*) as count FROM materials WHERE quantity < 10'))?.count || 0,
      };
    }

    res.json({
      code: 200,
      data: {
        parking: parkingStats,
        repair: repairStats,
        fee: feeStats,
        owner: ownerStats,
        review: reviewStats,
        material: materialStats
      }
    });
  } catch (err) {
    console.error('获取仪表盘统计错误:', err);
    res.status(500).json({ code: 500, message: '服务器错误' });
  }
});

/**
 * 获取最近报修记录
 * GET /api/dashboard/recent-repairs
 */
router.get('/recent-repairs', authenticateToken, async (req, res) => {
  try {
    let sql = `
      SELECT rr.*, u.real_name as submitter_name, ps.spot_number,
             r.status as repair_status, r.worker_name
      FROM repair_requests rr
      LEFT JOIN users u ON rr.user_id = u.id
      LEFT JOIN parking_spots ps ON rr.spot_id = ps.id
      LEFT JOIN repairs r ON r.request_id = rr.id
    `;
    const params = [];

    // 业主只能看到自己的
    if (req.user.role === 'user') {
      sql += ` WHERE rr.user_id = ?`;
      params.push(req.user.id);
    }

    sql += ` ORDER BY rr.created_at DESC LIMIT 5`;

    const repairs = await query(sql, params);

    res.json({
      code: 200,
      data: repairs
    });
  } catch (err) {
    console.error('获取最近报修错误:', err);
    res.status(500).json({ code: 500, message: '服务器错误' });
  }
});

module.exports = router;
