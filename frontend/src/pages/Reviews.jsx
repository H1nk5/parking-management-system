/**
 * 评价管理页面
 * 功能：查看和管理维修评价
 */

import { useState, useEffect } from 'react';
import { reviewAPI } from '../services/api';

// 评分星星组件
function StarRating({ rating, onChange, readonly = false }) {
  const stars = [1, 2, 3, 4, 5];

  return (
    <div className="flex gap-1">
      {stars.map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => !readonly && onChange?.(star)}
          className={`text-2xl ${
            readonly ? 'cursor-default' : 'cursor-pointer hover:scale-110'
          } transition-transform`}
        >
          {star <= rating ? '⭐' : '☆'}
        </button>
      ))}
    </div>
  );
}

export default function Reviews() {
  const [reviews, setReviews] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  // 加载评价列表
  const loadReviews = async () => {
    setLoading(true);
    try {
      const res = await reviewAPI.getList({ page, pageSize: 10 });
      setReviews(res.data.list);
      setTotal(res.data.total);
    } catch (error) {
      console.error('加载评价列表失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // 加载统计
  const loadStats = async () => {
    try {
      const res = await reviewAPI.getStats();
      setStats(res.data);
    } catch (error) {
      console.error('加载统计失败:', error);
    }
  };

  useEffect(() => {
    loadReviews();
  }, [page]);

  useEffect(() => {
    loadStats();
  }, []);

  // 删除评价
  const handleDelete = async (id) => {
    if (!confirm('确定要删除该评价吗？')) return;
    try {
      await reviewAPI.delete(id);
      loadReviews();
      loadStats();
    } catch (error) {
      alert(error.message || '删除失败');
    }
  };

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">评价管理</h1>
      </div>

      {/* 统计卡片 */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">评价总数</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{stats.totalReviews}</p>
              </div>
              <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-2xl">
                ⭐
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">平均评分</p>
                <div className="flex items-center gap-3 mt-1">
                  <p className="text-3xl font-bold text-amber-500">{stats.avgRating}</p>
                  <StarRating rating={Math.round(stats.avgRating)} readonly />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 评分分布 */}
      {stats?.distribution && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">评分分布</h3>
          <div className="space-y-3">
            {stats.distribution.map((item) => (
              <div key={item.rating} className="flex items-center gap-3">
                <span className="text-sm text-gray-600 w-12">{item.rating} 星</span>
                <div className="flex-1 bg-gray-100 rounded-full h-4 overflow-hidden">
                  <div
                    className="bg-amber-400 h-full rounded-full transition-all"
                    style={{
                      width: `${
                        stats.totalReviews > 0
                          ? (item.count / stats.totalReviews) * 100
                          : 0
                      }%`,
                    }}
                  />
                </div>
                <span className="text-sm text-gray-500 w-8 text-right">{item.count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 评价列表 */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-800">评价列表</h3>
        </div>

        {loading ? (
          <div className="p-8 text-center text-gray-500">加载中...</div>
        ) : reviews.length > 0 ? (
          <div className="divide-y divide-gray-100">
            {reviews.map((review) => (
              <div key={review.id} className="p-6 hover:bg-gray-50">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="font-medium text-gray-900">{review.reviewer_name}</span>
                      <StarRating rating={review.rating} readonly />
                      <span className="text-sm text-gray-500">
                        {new Date(review.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">
                      维修项目：{review.repair_title}
                    </p>
                    {review.comment && (
                      <p className="text-gray-700">{review.comment}</p>
                    )}
                    <div className="mt-2 flex items-center gap-4 text-sm text-gray-500">
                      <span>维修人员：{review.worker_name}</span>
                      <span>
                        类型：
                        {review.repair_type === 'parking' ? '车位设施' : '公共设施'}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDelete(review.id)}
                    className="btn btn-sm btn-danger"
                  >
                    删除
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center text-gray-500">暂无评价</div>
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
    </div>
  );
}
