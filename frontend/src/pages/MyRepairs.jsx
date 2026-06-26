/**
 * 我的报修页面（业主）
 * 功能：查看自己的报修记录
 */

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { repairAPI } from '../services/api';

// 状态映射
const statusMap = {
  pending: { label: '待处理', className: 'badge-warning' },
  processing: { label: '处理中', className: 'badge-info' },
  completed: { label: '已完成', className: 'badge-success' },
  rejected: { label: '已驳回', className: 'badge-danger' },
};

export default function MyRepairs() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  // 加载报修列表
  const loadRequests = async () => {
    setLoading(true);
    try {
      const res = await repairAPI.getRequestList({
        status: statusFilter,
        page,
        pageSize: 10,
      });
      setRequests(res.data.list);
      setTotal(res.data.total);
    } catch (error) {
      console.error('加载报修列表失败:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, [page, statusFilter]);

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">我的报修</h1>
        <Link to="/submit-repair" className="btn btn-primary">
          + 提交报修
        </Link>
      </div>

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
            <option value="pending">待处理</option>
            <option value="processing">处理中</option>
            <option value="completed">已完成</option>
            <option value="rejected">已驳回</option>
          </select>
        </div>
      </div>

      {/* 报修列表 */}
      <div className="space-y-4">
        {loading ? (
          <div className="bg-white rounded-xl p-8 text-center text-gray-500">
            加载中...
          </div>
        ) : requests.length > 0 ? (
          requests.map((req) => (
            <div
              key={req.id}
              className="bg-white rounded-xl shadow-sm border border-gray-100 p-6"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-semibold text-gray-900">{req.title}</h3>
                    <span className={`badge ${statusMap[req.status]?.className}`}>
                      {statusMap[req.status]?.label}
                    </span>
                  </div>
                  <p className="text-gray-600 mb-3">{req.description}</p>
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span>
                      类型：{req.type === 'parking' ? '车位设施' : '公共设施'}
                    </span>
                    {req.spot_number && <span>车位：{req.spot_number}</span>}
                    <span>提交时间：{new Date(req.created_at).toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* 维修信息 */}
              {req.repair_status && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-gray-500">维修状态：</span>
                    <span
                      className={`badge ${
                        req.repair_status === 'completed'
                          ? 'badge-success'
                          : 'badge-info'
                      }`}
                    >
                      {req.repair_status === 'completed' ? '已完成' : '维修中'}
                    </span>
                    {req.worker_name && (
                      <span className="text-gray-500 ml-4">
                        维修人员：{req.worker_name}
                      </span>
                    )}
                  </div>
                  {req.repair_result && (
                    <p className="text-sm text-gray-600 mt-2">
                      维修结果：{req.repair_result}
                    </p>
                  )}
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="bg-white rounded-xl p-12 text-center">
            <div className="text-6xl mb-4">📋</div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">暂无报修记录</h3>
            <p className="text-gray-500 mb-4">如果您遇到设施问题，可以提交报修申请</p>
            <Link to="/submit-repair" className="btn btn-primary">
              立即报修
            </Link>
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
