/**
 * 车位管理页面
 * 功能：车位信息的增删改查
 */

import { useState, useEffect } from 'react';
import { parkingAPI } from '../services/api';

// 状态映射
const statusMap = {
  available: { label: '空闲', className: 'badge-success' },
  occupied: { label: '已出租', className: 'badge-info' },
  maintenance: { label: '维护中', className: 'badge-warning' },
};

export default function Parking() {
  const [spots, setSpots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [keyword, setKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [editingSpot, setEditingSpot] = useState(null);
  const [formData, setFormData] = useState({
    spot_number: '',
    location: '',
    status: 'available',
    owner_id: '',
    rent_start: '',
    rent_end: '',
  });

  // 加载车位列表
  const loadSpots = async () => {
    setLoading(true);
    try {
      const res = await parkingAPI.getList({
        keyword,
        status: statusFilter,
        page,
        pageSize: 10,
      });
      setSpots(res.data.list);
      setTotal(res.data.total);
    } catch (error) {
      console.error('加载车位列表失败:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSpots();
  }, [page, keyword, statusFilter]);

  // 处理表单变化
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // 打开新增弹窗
  const handleAdd = () => {
    setEditingSpot(null);
    setFormData({
      spot_number: '',
      location: '',
      status: 'available',
      owner_id: '',
      rent_start: '',
      rent_end: '',
    });
    setShowModal(true);
  };

  // 打开编辑弹窗
  const handleEdit = (spot) => {
    setEditingSpot(spot);
    setFormData({
      spot_number: spot.spot_number,
      location: spot.location,
      status: spot.status,
      owner_id: spot.owner_id || '',
      rent_start: spot.rent_start || '',
      rent_end: spot.rent_end || '',
    });
    setShowModal(true);
  };

  // 提交表单
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = {
        ...formData,
        owner_id: formData.owner_id || null,
        rent_start: formData.rent_start || null,
        rent_end: formData.rent_end || null,
      };

      if (editingSpot) {
        await parkingAPI.update(editingSpot.id, data);
      } else {
        await parkingAPI.create(data);
      }
      setShowModal(false);
      loadSpots();
    } catch (error) {
      alert(error.message || '操作失败');
    }
  };

  // 删除车位
  const handleDelete = async (id) => {
    if (!confirm('确定要删除该车位吗？')) return;
    try {
      await parkingAPI.delete(id);
      loadSpots();
    } catch (error) {
      alert(error.message || '删除失败');
    }
  };

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">车位管理</h1>
        <button onClick={handleAdd} className="btn btn-primary">
          + 添加车位
        </button>
      </div>

      {/* 筛选栏 */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <div className="flex gap-4 flex-wrap">
          <input
            type="text"
            placeholder="搜索车位编号、位置、车牌号..."
            value={keyword}
            onChange={(e) => {
              setKeyword(e.target.value);
              setPage(1);
            }}
            className="input flex-1 min-w-[200px]"
          />
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="input w-auto"
          >
            <option value="">全部状态</option>
            <option value="available">空闲</option>
            <option value="occupied">已出租</option>
            <option value="maintenance">维护中</option>
          </select>
        </div>
      </div>

      {/* 车位列表 */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">加载中...</div>
        ) : spots.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    车位编号
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    位置
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    状态
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    业主
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    租赁期限
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    操作
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {spots.map((spot) => (
                  <tr key={spot.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <span className="font-medium text-gray-900">{spot.spot_number}</span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{spot.location}</td>
                    <td className="px-6 py-4">
                      <span className={`badge ${statusMap[spot.status]?.className}`}>
                        {statusMap[spot.status]?.label}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {spot.owner_name ? (
                        <div>
                          <p className="text-sm text-gray-900">{spot.owner_name}</p>
                          <p className="text-xs text-gray-500">{spot.car_plate}</p>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {spot.rent_start && spot.rent_end
                        ? `${spot.rent_start} 至 ${spot.rent_end}`
                        : '-'}
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <button
                        onClick={() => handleEdit(spot)}
                        className="btn btn-sm btn-secondary"
                      >
                        编辑
                      </button>
                      <button
                        onClick={() => handleDelete(spot.id)}
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
          <div className="p-8 text-center text-gray-500">暂无数据</div>
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

      {/* 新增/编辑弹窗 */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">
              {editingSpot ? '编辑车位' : '添加车位'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="label">车位编号</label>
                <input
                  type="text"
                  name="spot_number"
                  value={formData.spot_number}
                  onChange={handleChange}
                  className="input"
                  placeholder="如：A-001"
                  required
                />
              </div>
              <div>
                <label className="label">位置</label>
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  className="input"
                  placeholder="如：A栋地下一层"
                  required
                />
              </div>
              <div>
                <label className="label">状态</label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="input"
                >
                  <option value="available">空闲</option>
                  <option value="occupied">已出租</option>
                  <option value="maintenance">维护中</option>
                </select>
              </div>
              <div>
                <label className="label">业主ID（可选）</label>
                <input
                  type="number"
                  name="owner_id"
                  value={formData.owner_id}
                  onChange={handleChange}
                  className="input"
                  placeholder="关联的业主ID"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">租赁开始</label>
                  <input
                    type="date"
                    name="rent_start"
                    value={formData.rent_start}
                    onChange={handleChange}
                    className="input"
                  />
                </div>
                <div>
                  <label className="label">租赁结束</label>
                  <input
                    type="date"
                    name="rent_end"
                    value={formData.rent_end}
                    onChange={handleChange}
                    className="input"
                  />
                </div>
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
                  {editingSpot ? '保存' : '添加'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
