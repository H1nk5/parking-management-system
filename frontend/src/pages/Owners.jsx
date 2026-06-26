/**
 * 业主管理页面
 * 功能：业主信息的增删改查
 */

import { useState, useEffect } from 'react';
import { ownerAPI } from '../services/api';

export default function Owners() {
  const [owners, setOwners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [keyword, setKeyword] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [editingOwner, setEditingOwner] = useState(null);
  const [formData, setFormData] = useState({
    user_id: '',
    building: '',
    unit: '',
    room: '',
    car_plate: '',
  });

  // 加载业主列表
  const loadOwners = async () => {
    setLoading(true);
    try {
      const res = await ownerAPI.getList({ keyword, page, pageSize: 10 });
      setOwners(res.data.list);
      setTotal(res.data.total);
    } catch (error) {
      console.error('加载业主列表失败:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOwners();
  }, [page, keyword]);

  // 处理表单变化
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // 打开新增弹窗
  const handleAdd = () => {
    setEditingOwner(null);
    setFormData({ user_id: '', building: '', unit: '', room: '', car_plate: '' });
    setShowModal(true);
  };

  // 打开编辑弹窗
  const handleEdit = (owner) => {
    setEditingOwner(owner);
    setFormData({
      user_id: owner.user_id,
      building: owner.building,
      unit: owner.unit,
      room: owner.room,
      car_plate: owner.car_plate || '',
    });
    setShowModal(true);
  };

  // 提交表单
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingOwner) {
        await ownerAPI.update(editingOwner.id, formData);
      } else {
        await ownerAPI.create(formData);
      }
      setShowModal(false);
      loadOwners();
    } catch (error) {
      alert(error.message || '操作失败');
    }
  };

  // 删除业主
  const handleDelete = async (id) => {
    if (!confirm('确定要删除该业主吗？')) return;
    try {
      await ownerAPI.delete(id);
      loadOwners();
    } catch (error) {
      alert(error.message || '删除失败');
    }
  };

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">业主管理</h1>
        <button onClick={handleAdd} className="btn btn-primary">
          + 添加业主
        </button>
      </div>

      {/* 搜索栏 */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <div className="flex gap-4">
          <input
            type="text"
            placeholder="搜索业主姓名、楼栋、房间号、车牌号..."
            value={keyword}
            onChange={(e) => {
              setKeyword(e.target.value);
              setPage(1);
            }}
            className="input flex-1"
          />
          <button onClick={() => loadOwners()} className="btn btn-secondary">
            搜索
          </button>
        </div>
      </div>

      {/* 业主列表 */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">加载中...</div>
        ) : owners.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    业主信息
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    房间号
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    车牌号
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    车位
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    联系方式
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    操作
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {owners.map((owner) => (
                  <tr key={owner.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium text-gray-900">{owner.real_name}</p>
                        <p className="text-sm text-gray-500">{owner.username}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {owner.building} {owner.unit} {owner.room}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {owner.car_plate || '-'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {owner.spot_number || '未分配'}
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-gray-600">{owner.phone}</p>
                      <p className="text-sm text-gray-500">{owner.email}</p>
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <button
                        onClick={() => handleEdit(owner)}
                        className="btn btn-sm btn-secondary"
                      >
                        编辑
                      </button>
                      <button
                        onClick={() => handleDelete(owner.id)}
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
              {editingOwner ? '编辑业主' : '添加业主'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              {!editingOwner && (
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
              )}
              <div>
                <label className="label">楼栋</label>
                <input
                  type="text"
                  name="building"
                  value={formData.building}
                  onChange={handleChange}
                  className="input"
                  placeholder="如：A栋"
                  required
                />
              </div>
              <div>
                <label className="label">单元</label>
                <input
                  type="text"
                  name="unit"
                  value={formData.unit}
                  onChange={handleChange}
                  className="input"
                  placeholder="如：1单元"
                  required
                />
              </div>
              <div>
                <label className="label">房间号</label>
                <input
                  type="text"
                  name="room"
                  value={formData.room}
                  onChange={handleChange}
                  className="input"
                  placeholder="如：101"
                  required
                />
              </div>
              <div>
                <label className="label">车牌号</label>
                <input
                  type="text"
                  name="car_plate"
                  value={formData.car_plate}
                  onChange={handleChange}
                  className="input"
                  placeholder="如：京A12345"
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
                  {editingOwner ? '保存' : '添加'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
