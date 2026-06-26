/**
 * 费用管理页面（管理员）
 * 功能：费用记录管理
 */

import { useState, useEffect } from 'react';
import { feeAPI } from '../services/api';

// 费用类型映射
const typeMap = {
  rent: '车位租金',
  management: '物业管理费',
  repair: '维修费用',
};

// 状态映射
const statusMap = {
  paid: { label: '已缴纳', className: 'badge-success' },
  unpaid: { label: '未缴纳', className: 'badge-danger' },
};

export default function Fees() {
  const [fees, setFees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [stats, setStats] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    user_id: '',
    type: 'rent',
    amount: '',
    due_date: '',
    remark: '',
  });

  // 加载费用列表
  const loadFees = async () => {
    setLoading(true);
    try {
      const res = await feeAPI.getList({
        type: typeFilter,
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
  }, [page, typeFilter, statusFilter]);

  useEffect(() => {
    loadStats();
  }, []);

  // 处理表单变化
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // 提交表单
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await feeAPI.create({
        ...formData,
        amount: Number(formData.amount),
      });
      setShowModal(false);
      loadFees();
      loadStats();
    } catch (error) {
      alert(error.message || '添加失败');
    }
  };

  // 删除费用
  const handleDelete = async (id) => {
    if (!confirm('确定要删除该费用记录吗？')) return;
    try {
      await feeAPI.delete(id);
      loadFees();
      loadStats();
    } catch (error) {
      alert(error.message || '删除失败');
    }
  };

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">费用管理</h1>
        <button onClick={() => setShowModal(true)} className="btn btn-primary">
          + 添加费用
        </button>
      </div>

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
        <div className="flex gap-4 flex-wrap">
          <select
            value={typeFilter}
            onChange={(e) => {
              setTypeFilter(e.target.value);
              setPage(1);
            }}
            className="input w-auto"
          >
            <option value="">全部类型</option>
            <option value="rent">车位租金</option>
            <option value="management">物业管理费</option>
            <option value="repair">维修费用</option>
          </select>
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
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">加载中...</div>
        ) : fees.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    业主信息
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    费用类型
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    金额
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    状态
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    到期日
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    备注
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    操作
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {fees.map((fee) => (
                  <tr key={fee.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium text-gray-900">{fee.real_name}</p>
                        <p className="text-sm text-gray-500">
                          {fee.building} {fee.unit} {fee.room}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="badge badge-gray">{typeMap[fee.type]}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-medium text-gray-900">¥{fee.amount}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`badge ${statusMap[fee.status]?.className}`}>
                        {statusMap[fee.status]?.label}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{fee.due_date}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{fee.remark || '-'}</td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleDelete(fee.id)}
                        className="btn btn-sm btn-danger"
                      >
                        删除
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-8 text-center text-gray-500">暂无费用记录</div>
        )}

        {/* 分页 */}
        {total > 10 && (
          <div className="px-6 py-4 border-t border-gray-100 flex justify-between items-center">
            <span className="text-sm text-gray-500">共 {total} 条记录</span>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="btn btn-sm btn-secondary disabled:opacity-50"
              >
                上一页
              </button>
              <span className="btn btn-sm btn-secondary">{page}</span>
              <button
                onClick={() => setPage((p) => p + 1)}
                disabled={page * 10 >= total}
                className="btn btn-sm btn-secondary disabled:opacity-50"
              >
                下一页
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 添加费用弹窗 */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">添加费用</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="label">用户ID</label>
                <input
                  type="number"
                  name="user_id"
                  value={formData.user_id}
                  onChange={handleChange}
                  className="input"
                  placeholder="请输入用户ID"
                  required
                />
              </div>
              <div>
                <label className="label">费用类型</label>
                <select
                  name="type"
                  value={formData.type}
                  onChange={handleChange}
                  className="input"
                  required
                >
                  <option value="rent">车位租金</option>
                  <option value="management">物业管理费</option>
                  <option value="repair">维修费用</option>
                </select>
              </div>
              <div>
                <label className="label">金额（元）</label>
                <input
                  type="number"
                  name="amount"
                  value={formData.amount}
                  onChange={handleChange}
                  className="input"
                  placeholder="请输入金额"
                  min="0"
                  step="0.01"
                  required
                />
              </div>
              <div>
                <label className="label">到期日期</label>
                <input
                  type="date"
                  name="due_date"
                  value={formData.due_date}
                  onChange={handleChange}
                  className="input"
                  required
                />
              </div>
              <div>
                <label className="label">备注</label>
                <input
                  type="text"
                  name="remark"
                  value={formData.remark}
                  onChange={handleChange}
                  className="input"
                  placeholder="可选备注信息"
                />
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="btn btn-secondary"
                >
                  取消
                </button>
                <button type="submit" className="btn btn-primary">
                  添加
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
