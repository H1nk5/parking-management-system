/**
 * 报修管理页面（管理员）
 * 功能：查看和处理报修申请
 */

import { useState, useEffect } from 'react';
import { repairAPI } from '../services/api';

// 状态映射
const requestStatusMap = {
  pending: { label: '待处理', className: 'badge-warning' },
  processing: { label: '处理中', className: 'badge-info' },
  completed: { label: '已完成', className: 'badge-success' },
  rejected: { label: '已驳回', className: 'badge-danger' },
};

export default function Repairs() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [assignData, setAssignData] = useState({
    worker_name: '',
    cost: 0,
  });

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

  // 更新报修状态
  const handleUpdateStatus = async (id, status) => {
    try {
      await repairAPI.updateRequestStatus(id, { status });
      loadRequests();
    } catch (error) {
      alert(error.message || '操作失败');
    }
  };

  // 打开指派弹窗
  const handleAssign = (request) => {
    setSelectedRequest(request);
    setAssignData({ worker_name: '', cost: 0 });
    setShowAssignModal(true);
  };

  // 提交指派
  const handleAssignSubmit = async (e) => {
    e.preventDefault();
    try {
      await repairAPI.createRecord({
        request_id: selectedRequest.id,
        worker_name: assignData.worker_name,
        cost: assignData.cost,
      });
      setShowAssignModal(false);
      loadRequests();
    } catch (error) {
      alert(error.message || '指派失败');
    }
  };

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">报修管理</h1>
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
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">加载中...</div>
        ) : requests.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    报修信息
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    类型
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    提交人
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    状态
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    维修人员
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    时间
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    操作
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {requests.map((req) => (
                  <tr key={req.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium text-gray-900">{req.title}</p>
                        <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                          {req.description}
                        </p>
                        {req.spot_number && (
                          <p className="text-xs text-blue-500 mt-1">车位: {req.spot_number}</p>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="badge badge-gray">
                        {req.type === 'parking' ? '车位设施' : '公共设施'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{req.submitter_name}</td>
                    <td className="px-6 py-4">
                      <span className={`badge ${requestStatusMap[req.status]?.className}`}>
                        {requestStatusMap[req.status]?.label}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {req.worker_name || '-'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {new Date(req.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        {req.status === 'pending' && (
                          <>
                            <button
                              onClick={() => handleAssign(req)}
                              className="btn btn-sm btn-primary"
                            >
                              指派
                            </button>
                            <button
                              onClick={() => handleUpdateStatus(req.id, 'rejected')}
                              className="btn btn-sm btn-danger"
                            >
                              驳回
                            </button>
                          </>
                        )}
                        {req.status === 'processing' && req.repair_status === 'in_progress' && (
                          <span className="text-sm text-gray-500">维修中...</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-8 text-center text-gray-500">暂无报修记录</div>
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

      {/* 指派弹窗 */}
      {showAssignModal && selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">指派维修</h2>
            <div className="mb-4 p-3 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">报修标题：{selectedRequest.title}</p>
              <p className="text-sm text-gray-600 mt-1">提交人：{selectedRequest.submitter_name}</p>
            </div>
            <form onSubmit={handleAssignSubmit} className="space-y-4">
              <div>
                <label className="label">维修人员</label>
                <input
                  type="text"
                  value={assignData.worker_name}
                  onChange={(e) =>
                    setAssignData((prev) => ({ ...prev, worker_name: e.target.value }))
                  }
                  className="input"
                  placeholder="请输入维修人员姓名"
                  required
                />
              </div>
              <div>
                <label className="label">预估费用</label>
                <input
                  type="number"
                  value={assignData.cost}
                  onChange={(e) =>
                    setAssignData((prev) => ({ ...prev, cost: Number(e.target.value) }))
                  }
                  className="input"
                  placeholder="请输入预估费用"
                  min="0"
                />
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAssignModal(false)}
                  className="btn btn-secondary"
                >
                  取消
                </button>
                <button type="submit" className="btn btn-primary">
                  确认指派
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
