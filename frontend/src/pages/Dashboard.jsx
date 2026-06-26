/**
 * 仪表盘页面
 * 功能：展示系统概览和统计数据
 */

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { dashboardAPI } from '../services/api';

// 统计卡片组件
function StatCard({ icon, title, value, color, link }) {
  const Card = (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500 mb-1">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
        </div>
        <div
          className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${color}`}
        >
          {icon}
        </div>
      </div>
    </div>
  );

  return link ? <Link to={link}>{Card}</Link> : Card;
}

// 状态标签组件
function StatusBadge({ status }) {
  const statusMap = {
    pending: { label: '待处理', className: 'badge-warning' },
    processing: { label: '处理中', className: 'badge-info' },
    completed: { label: '已完成', className: 'badge-success' },
    rejected: { label: '已驳回', className: 'badge-danger' },
  };

  const { label, className } = statusMap[status] || { label: status, className: 'badge-gray' };

  return <span className={`badge ${className}`}>{label}</span>;
}

export default function Dashboard() {
  const { user, isAdmin } = useAuth();
  const [stats, setStats] = useState(null);
  const [recentRepairs, setRecentRepairs] = useState([]);
  const [loading, setLoading] = useState(true);

  // 加载数据
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [statsRes, repairsRes] = await Promise.all([
        dashboardAPI.getStats(),
        dashboardAPI.getRecentRepairs(),
      ]);
      setStats(statsRes.data);
      setRecentRepairs(repairsRes.data);
    } catch (error) {
      console.error('加载数据失败:', error);
    } finally {
      setLoading(false);
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
      {/* 欢迎信息 */}
      <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl p-6 text-white">
        <h1 className="text-2xl font-bold mb-2">
          欢迎回来，{user?.real_name}！
        </h1>
        <p className="text-blue-100">
          {isAdmin
            ? '您可以通过此后台管理车位、处理报修、管理费用等。'
            : '您可以查看车位信息、提交报修申请、缴纳费用等。'}
        </p>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon="🅿️"
          title="车位总数"
          value={stats?.parking?.total || 0}
          color="bg-blue-50"
          link="/parking"
        />
        <StatCard
          icon="🔧"
          title="报修工单"
          value={stats?.repair?.total || 0}
          color="bg-amber-50"
          link={isAdmin ? '/repairs' : '/my-repairs'}
        />
        <StatCard
          icon="💰"
          title="待缴费用"
          value={`¥${stats?.fee?.unpaidAmount || 0}`}
          color="bg-emerald-50"
          link={isAdmin ? '/fees' : '/my-fees'}
        />
        <StatCard
          icon="⭐"
          title="平均评分"
          value={stats?.review?.avgRating || '-'}
          color="bg-purple-50"
          link="/reviews"
        />
      </div>

      {/* 管理员专属统计 */}
      {isAdmin && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard
            icon="👥"
            title="业主总数"
            value={stats?.owner?.total || 0}
            color="bg-cyan-50"
            link="/owners"
          />
          <StatCard
            icon="📦"
            title="材料种类"
            value={stats?.material?.total || 0}
            color="bg-rose-50"
            link="/materials"
          />
          <StatCard
            icon="⚠️"
            title="库存不足"
            value={stats?.material?.lowStock || 0}
            color="bg-orange-50"
            link="/materials"
          />
        </div>
      )}

      {/* 车位状态概览 */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">车位状态概览</h3>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-4 bg-emerald-50 rounded-lg">
            <p className="text-3xl font-bold text-emerald-600">
              {stats?.parking?.available || 0}
            </p>
            <p className="text-sm text-emerald-700 mt-1">空闲车位</p>
          </div>
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <p className="text-3xl font-bold text-blue-600">
              {stats?.parking?.occupied || 0}
            </p>
            <p className="text-sm text-blue-700 mt-1">已出租</p>
          </div>
          <div className="text-center p-4 bg-amber-50 rounded-lg">
            <p className="text-3xl font-bold text-amber-600">
              {stats?.parking?.maintenance || 0}
            </p>
            <p className="text-sm text-amber-700 mt-1">维护中</p>
          </div>
        </div>
      </div>

      {/* 最近报修 */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-800">最近报修</h3>
          <Link
            to={isAdmin ? '/repairs' : '/my-repairs'}
            className="text-sm text-blue-500 hover:text-blue-600"
          >
            查看全部 →
          </Link>
        </div>

        {recentRepairs.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-sm text-gray-500 border-b">
                  <th className="pb-3 font-medium">标题</th>
                  <th className="pb-3 font-medium">类型</th>
                  <th className="pb-3 font-medium">提交人</th>
                  <th className="pb-3 font-medium">状态</th>
                  <th className="pb-3 font-medium">时间</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {recentRepairs.map((repair) => (
                  <tr key={repair.id} className="hover:bg-gray-50">
                    <td className="py-3">
                      <span className="text-sm text-gray-900">{repair.title}</span>
                    </td>
                    <td className="py-3">
                      <span className="badge badge-gray">
                        {repair.type === 'parking' ? '车位设施' : '公共设施'}
                      </span>
                    </td>
                    <td className="py-3 text-sm text-gray-600">
                      {repair.submitter_name}
                    </td>
                    <td className="py-3">
                      <StatusBadge status={repair.status} />
                    </td>
                    <td className="py-3 text-sm text-gray-500">
                      {new Date(repair.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-center text-gray-500 py-8">暂无报修记录</p>
        )}
      </div>
    </div>
  );
}
