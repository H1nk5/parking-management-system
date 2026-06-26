/**
 * 提交报修页面（业主）
 * 功能：提交新的报修申请
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { repairAPI } from '../services/api';

export default function SubmitRepair() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'parking',
  });
  const [loading, setLoading] = useState(false);

  // 处理表单变化
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // 提交表单
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await repairAPI.createRequest(formData);
      alert('报修提交成功！');
      navigate('/my-repairs');
    } catch (error) {
      alert(error.message || '提交失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">提交报修</h1>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 报修类型 */}
          <div>
            <label className="label">报修类型</label>
            <div className="grid grid-cols-2 gap-4">
              <label
                className={`relative flex items-center p-4 border-2 rounded-xl cursor-pointer transition-all ${
                  formData.type === 'parking'
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <input
                  type="radio"
                  name="type"
                  value="parking"
                  checked={formData.type === 'parking'}
                  onChange={handleChange}
                  className="sr-only"
                />
                <div className="flex items-center gap-3">
                  <span className="text-2xl">🅿️</span>
                  <div>
                    <p className="font-medium text-gray-900">车位设施</p>
                    <p className="text-sm text-gray-500">车位锁、地面等问题</p>
                  </div>
                </div>
                {formData.type === 'parking' && (
                  <div className="absolute top-2 right-2 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                    <svg
                      className="w-3 h-3 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={3}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </div>
                )}
              </label>
              <label
                className={`relative flex items-center p-4 border-2 rounded-xl cursor-pointer transition-all ${
                  formData.type === 'public'
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <input
                  type="radio"
                  name="type"
                  value="public"
                  checked={formData.type === 'public'}
                  onChange={handleChange}
                  className="sr-only"
                />
                <div className="flex items-center gap-3">
                  <span className="text-2xl">🏢</span>
                  <div>
                    <p className="font-medium text-gray-900">公共设施</p>
                    <p className="text-sm text-gray-500">照明、消防、电梯等</p>
                  </div>
                </div>
                {formData.type === 'public' && (
                  <div className="absolute top-2 right-2 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                    <svg
                      className="w-3 h-3 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={3}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </div>
                )}
              </label>
            </div>
          </div>

          {/* 报修标题 */}
          <div>
            <label className="label">报修标题</label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              className="input"
              placeholder="请简要描述问题，如：车位地面破损"
              required
            />
          </div>

          {/* 详细描述 */}
          <div>
            <label className="label">详细描述</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              className="input min-h-[120px]"
              placeholder="请详细描述问题情况，包括位置、严重程度等..."
              required
            />
          </div>

          {/* 提交按钮 */}
          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="btn btn-secondary"
            >
              取消
            </button>
            <button type="submit" disabled={loading} className="btn btn-primary">
              {loading ? '提交中...' : '提交报修'}
            </button>
          </div>
        </form>
      </div>

      {/* 提示信息 */}
      <div className="bg-blue-50 rounded-xl p-4">
        <h3 className="font-medium text-blue-800 mb-2">温馨提示</h3>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• 请详细描述问题，方便维修人员了解情况</li>
          <li>• 提交后可在"我的报修"中查看处理进度</li>
          <li>• 紧急问题请直接联系物业前台</li>
        </ul>
      </div>
    </div>
  );
}
