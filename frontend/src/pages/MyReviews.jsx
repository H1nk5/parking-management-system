/**
 * 我的评价页面（业主）
 * 功能：查看和提交评价
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

export default function MyReviews() {
  const [reviews, setReviews] = useState([]);
  const [pendingReviews, setPendingReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedRepair, setSelectedRepair] = useState(null);
  const [reviewData, setReviewData] = useState({
    rating: 5,
    comment: '',
  });

  // 加载评价列表
  const loadReviews = async () => {
    setLoading(true);
    try {
      const [reviewsRes, pendingRes] = await Promise.all([
        reviewAPI.getList({ page: 1, pageSize: 100 }),
        reviewAPI.getPending(),
      ]);
      setReviews(reviewsRes.data.list);
      setPendingReviews(pendingRes.data);
    } catch (error) {
      console.error('加载评价失败:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReviews();
  }, []);

  // 打开评价弹窗
  const handleReview = (repair) => {
    setSelectedRepair(repair);
    setReviewData({ rating: 5, comment: '' });
    setShowModal(true);
  };

  // 提交评价
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await reviewAPI.create({
        repair_id: selectedRepair.id,
        ...reviewData,
      });
      setShowModal(false);
      loadReviews();
      alert('评价成功！');
    } catch (error) {
      alert(error.message || '评价失败');
    }
  };

  // 删除评价
  const handleDelete = async (id) => {
    if (!confirm('确定要删除该评价吗？')) return;
    try {
      await reviewAPI.delete(id);
      loadReviews();
    } catch (error) {
      alert(error.message || '删除失败');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">加载中...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">我的评价</h1>

      {/* 待评价列表 */}
      {pendingReviews.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">
            待评价 ({pendingReviews.length})
          </h2>
          <div className="space-y-3">
            {pendingReviews.map((repair) => (
              <div
                key={repair.id}
                className="flex items-center justify-between p-4 bg-amber-50 rounded-lg"
              >
                <div>
                  <p className="font-medium text-gray-900">{repair.request_title}</p>
                  <p className="text-sm text-gray-500">
                    维修人员：{repair.worker_name} | 完成时间：
                    {repair.end_time
                      ? new Date(repair.end_time).toLocaleDateString()
                      : '-'}
                  </p>
                </div>
                <button
                  onClick={() => handleReview(repair)}
                  className="btn btn-primary btn-sm"
                >
                  去评价
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 已评价列表 */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-800">已评价 ({reviews.length})</h2>
        </div>

        {reviews.length > 0 ? (
          <div className="divide-y divide-gray-100">
            {reviews.map((review) => (
              <div key={review.id} className="p-6 hover:bg-gray-50">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="font-medium text-gray-900">
                        {review.repair_title}
                      </span>
                      <StarRating rating={review.rating} readonly />
                    </div>
                    {review.comment && (
                      <p className="text-gray-700 mb-2">{review.comment}</p>
                    )}
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span>维修人员：{review.worker_name}</span>
                      <span>
                        {new Date(review.created_at).toLocaleDateString()}
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
          <div className="p-8 text-center text-gray-500">暂无评价记录</div>
        )}
      </div>

      {/* 评价弹窗 */}
      {showModal && selectedRepair && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">评价维修服务</h2>
            <div className="mb-4 p-3 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">
                维修项目：{selectedRepair.request_title}
              </p>
              <p className="text-sm text-gray-600 mt-1">
                维修人员：{selectedRepair.worker_name}
              </p>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="label">评分</label>
                <StarRating
                  rating={reviewData.rating}
                  onChange={(rating) =>
                    setReviewData((prev) => ({ ...prev, rating }))
                  }
                />
              </div>
              <div>
                <label className="label">评价内容</label>
                <textarea
                  value={reviewData.comment}
                  onChange={(e) =>
                    setReviewData((prev) => ({ ...prev, comment: e.target.value }))
                  }
                  className="input min-h-[100px]"
                  placeholder="请分享您的维修体验..."
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
                  提交评价
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
