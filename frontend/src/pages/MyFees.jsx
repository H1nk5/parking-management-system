/**
 * 我的费用页面（业主）
 * 功能：查看和缴纳费用
 */

import { useState, useEffect } from 'react';
import { feeAPI } from '../services/api';

// 费用类型映射
const typeMap = {
  rent: '车位租金',
  management: '物业管理费',
  repair: '维修费用',
};

export default function MyFees() {
  const [fees, setFees] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  // 加载费用列表
  const loadFees = async () => {
    setLoading(true);
    try {
      const res = await feeAPI.getList({
        status: statusFilter,
        page,
        pageSize: 10,
      });
      setFees(res.data.list);
      setTotal(res.data.total);
    } catch (error) {
      console.error('加载费用列表失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // 加载统计
  const loadStats = async () => {
    try {
      const res = await feeAPI.getStats();
      setStats(res.data);
    } catch (error) {
      console.error('加载统计失败:', error);
    }
  };

  useEffect(() => {
    loadFees();
  }, [page, statusFilter]);

  useEffect(() => {
    loadStats();
  }, []);

  // 缴费
  const handlePay = async (id) => {
    if (!confirm('确定要缴纳该费用吗？')) return;
    try {
      await feeAPI.pay(id);
      loadFees();
      loadStats();
      alert('缴费成功！');
    } catch (error) {
      alert(error.message || '缴费失败');
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">我的费用</h1>

      {/* 统计卡片 */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <p className="text-sm text-gray-500">费用总额</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">¥{stats.totalAmount}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <p className="text-sm text-gray-500">已缴纳</p>
            <p className="text-2xl font-bold text-emerald-600 mt-1">¥{stats.paidAmount}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <p className="text-sm text-gray-500">待缴纳</p>
            <p className="text-2xl font-bold text-red-600 mt-1">¥{stats.unpaidAmount}</p>
          </div>
        </div>
      )}

      {/* 筛选栏 */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <div className="flex gap-4">
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="input w-auto"
          >
            <option value="">全部状态</option>
            <option value="paid">已缴纳</option>
            <option value="unpaid">未缴纳</option>
          </select>
        </div>
      </div>

      {/* 费用列表 */}
      <div className="space-y-4">
        {loading ? (
          <div className="bg-white rounded-xl p-8 text-center text-gray-500">
            加载中...
          </div>
        ) : fees.length > 0 ? (
          fees.map((fee) => (
            <div
              key={fee.id}
              className={`bg-white rounded-xl shadow-sm border overflow-hidden ${
                fee.status === 'unpaid' ? 'border-red-200' : 'border-gray-100'
              }`}
            >
              <div className="p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <span className="badge badge-gray">{typeMap[fee.type]}</span>
                      <span
                        className={`badge ${
                          fee.status === 'paid' ? 'badge-success' : 'badge-danger'
                        }`}
                      >
                        {fee.status === 'paid' ? '已缴纳' : '未缴纳'}
                      </span>
                    </div>
                    <p className="text-gray-900 mb-1">{fee.remark || typeMap[fee.type]}</p>
                    <p className="text-sm text-gray-500">到期日期：{fee.due_date}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-gray-900">¥{fee.amount}</p>
                    {fee.status === 'unpaid' && (
                      <button
                        onClick={() => handlePay(fee.id)}
                        className="btn btn-primary btn-sm mt-2"
                      >
                        立即缴纳
                      </button>
                    )}
                    {fee.status === 'paid' && fee.paid_date && (
                      <p className="text-sm text-gray-500 mt-1">
                        缴纳日期：{fee.paid_date}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="bg-white rounded-xl p-12 text-center">
            <div className="text-6xl mb-4">💰</div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">暂无费用记录</h3>
            <p className="text-gray-500">您当前没有需要缴纳的费用</p>
          </div>
        )}
      </div>

      {/* 分页 */}
      {total > 10 && (
        <div className="flex justify-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="btn btn-secondary disabled:opacity-50"
          >
            上一页
          </button>
          <span className="btn btn-secondary">{page}</span>
          <button
            onClick={() => setPage((p) => p + 1)}
            disabled={page * 10 >= total}
            className="btn btn-secondary disabled:opacity-50"
          >
            下一页
          </button>
        </div>
      )}
    </div>
  );
}
