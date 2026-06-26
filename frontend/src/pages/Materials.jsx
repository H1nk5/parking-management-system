/**
 * 材料管理页面（管理员）
 * 功能：维修材料库存管理
 */

import { useState, useEffect } from 'react';
import { materialAPI } from '../services/api';

export default function Materials() {
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [keyword, setKeyword] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [showRestockModal, setShowRestockModal] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState(null);
  const [restockId, setRestockId] = useState(null);
  const [restockQuantity, setRestockQuantity] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    specification: '',
    unit: '',
    quantity: 0,
    unit_price: '',
  });

  // 加载材料列表
  const loadMaterials = async () => {
    setLoading(true);
    try {
      const res = await materialAPI.getList({ keyword, page, pageSize: 10 });
      setMaterials(res.data.list);
      setTotal(res.data.total);
    } catch (error) {
      console.error('加载材料列表失败:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMaterials();
  }, [page, keyword]);

  // 处理表单变化
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // 打开新增弹窗
  const handleAdd = () => {
    setEditingMaterial(null);
    setFormData({
      name: '',
      specification: '',
      unit: '',
      quantity: 0,
      unit_price: '',
    });
    setShowModal(true);
  };

  // 打开编辑弹窗
  const handleEdit = (material) => {
    setEditingMaterial(material);
    setFormData({
      name: material.name,
      specification: material.specification || '',
      unit: material.unit,
      quantity: material.quantity,
      unit_price: material.unit_price,
    });
    setShowModal(true);
  };

  // 提交表单
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = {
        ...formData,
        quantity: Number(formData.quantity),
        unit_price: Number(formData.unit_price),
      };

      if (editingMaterial) {
        await materialAPI.update(editingMaterial.id, data);
      } else {
        await materialAPI.create(data);
      }
      setShowModal(false);
      loadMaterials();
    } catch (error) {
      alert(error.message || '操作失败');
    }
  };

  // 删除材料
  const handleDelete = async (id) => {
    if (!confirm('确定要删除该材料吗？')) return;
    try {
      await materialAPI.delete(id);
      loadMaterials();
    } catch (error) {
      alert(error.message || '删除失败');
    }
  };

  // 打开补货弹窗
  const handleRestock = (id) => {
    setRestockId(id);
    setRestockQuantity('');
    setShowRestockModal(true);
  };

  // 提交补货
  const handleRestockSubmit = async (e) => {
    e.preventDefault();
    try {
      await materialAPI.restock(restockId, { quantity: Number(restockQuantity) });
      setShowRestockModal(false);
      loadMaterials();
    } catch (error) {
      alert(error.message || '补货失败');
    }
  };

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">材料管理</h1>
        <button onClick={handleAdd} className="btn btn-primary">
          + 添加材料
        </button>
      </div>

      {/* 搜索栏 */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <div className="flex gap-4">
          <input
            type="text"
            placeholder="搜索材料名称、规格..."
            value={keyword}
            onChange={(e) => {
              setKeyword(e.target.value);
              setPage(1);
            }}
            className="input flex-1"
          />
        </div>
      </div>

      {/* 材料列表 */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">加载中...</div>
        ) : materials.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    材料名称
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    规格
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    单位
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    库存
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    单价
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    操作
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {materials.map((material) => (
                  <tr key={material.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <span className="font-medium text-gray-900">{material.name}</span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {material.specification || '-'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{material.unit}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`font-medium ${
                          material.quantity < 10 ? 'text-red-600' : 'text-gray-900'
                        }`}
                      >
                        {material.quantity}
                        {material.quantity < 10 && (
                          <span className="text-xs text-red-500 ml-1">库存不足</span>
                        )}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">¥{material.unit_price}</td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <button
                        onClick={() => handleRestock(material.id)}
                        className="btn btn-sm btn-success"
                      >
                        补货
                      </button>
                      <button
                        onClick={() => handleEdit(material)}
                        className="btn btn-sm btn-secondary"
                      >
                        编辑
                      </button>
                      <button
                        onClick={() => handleDelete(material.id)}
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
          <div className="p-8 text-center text-gray-500">暂无材料</div>
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
              {editingMaterial ? '编辑材料' : '添加材料'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="label">材料名称</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="input"
                  placeholder="如：水泥"
                  required
                />
              </div>
              <div>
                <label className="label">规格</label>
                <input
                  type="text"
                  name="specification"
                  value={formData.specification}
                  onChange={handleChange}
                  className="input"
                  placeholder="如：P.O 42.5"
                />
              </div>
              <div>
                <label className="label">单位</label>
                <input
                  type="text"
                  name="unit"
                  value={formData.unit}
                  onChange={handleChange}
                  className="input"
                  placeholder="如：袋、个、根"
                  required
                />
              </div>
              <div>
                <label className="label">数量</label>
                <input
                  type="number"
                  name="quantity"
                  value={formData.quantity}
                  onChange={handleChange}
                  className="input"
                  min="0"
                  required
                />
              </div>
              <div>
                <label className="label">单价（元）</label>
                <input
                  type="number"
                  name="unit_price"
                  value={formData.unit_price}
                  onChange={handleChange}
                  className="input"
                  placeholder="请输入单价"
                  min="0"
                  step="0.01"
                  required
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
                  {editingMaterial ? '保存' : '添加'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 补货弹窗 */}
      {showRestockModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-sm">
            <h2 className="text-xl font-bold mb-4">补充库存</h2>
            <form onSubmit={handleRestockSubmit} className="space-y-4">
              <div>
                <label className="label">补货数量</label>
                <input
                  type="number"
                  value={restockQuantity}
                  onChange={(e) => setRestockQuantity(e.target.value)}
                  className="input"
                  placeholder="请输入补货数量"
                  min="1"
                  required
                />
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowRestockModal(false)}
                  className="btn btn-secondary"
                >
                  取消
                </button>
                <button type="submit" className="btn btn-success">
                  确认补货
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
