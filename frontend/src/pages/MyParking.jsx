/**
 * 我的车位页面（业主）
 * 功能：查看自己的车位信息
 */

import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { parkingAPI } from '../services/api';

export default function MyParking() {
  const { user } = useAuth();
  const [parkingInfo, setParkingInfo] = useState(null);
  const [loading, setLoading] = useState(true);

  // 加载车位信息
  useEffect(() => {
    loadParkingInfo();
  }, []);

  const loadParkingInfo = async () => {
    try {
      // 获取用户关联的车位信息
      const res = await parkingAPI.getList({ pageSize: 100 });
      // 查找当前用户的车位
      const mySpot = res.data.list.find(
        (spot) => spot.owner_name === user?.real_name
      );
      setParkingInfo(mySpot || null);
    } catch (error) {
      console.error('加载车位信息失败:', error);
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
      <h1 className="text-2xl font-bold text-gray-900">我的车位</h1>

      {parkingInfo ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          {/* 车位头部信息 */}
          <div className="bg-gradient-to-r from-blue-500 to-indigo-600 p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100">车位编号</p>
                <p className="text-3xl font-bold mt-1">{parkingInfo.spot_number}</p>
              </div>
              <div className="text-5xl">🅿️</div>
            </div>
          </div>

          {/* 车位详细信息 */}
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-500">位置</p>
                  <p className="text-lg font-medium text-gray-900">{parkingInfo.location}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">状态</p>
                  <span
                    className={`badge ${
                      parkingInfo.status === 'occupied'
                        ? 'badge-success'
                        : parkingInfo.status === 'available'
                        ? 'badge-info'
                        : 'badge-warning'
                    }`}
                  >
                    {parkingInfo.status === 'occupied'
                      ? '使用中'
                      : parkingInfo.status === 'available'
                      ? '空闲'
                      : '维护中'}
                  </span>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-500">租赁开始</p>
                  <p className="text-lg font-medium text-gray-900">
                    {parkingInfo.rent_start || '-'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">租赁结束</p>
                  <p className="text-lg font-medium text-gray-900">
                    {parkingInfo.rent_end || '-'}
                  </p>
                </div>
              </div>
            </div>

            {/* 业主信息 */}
            <div className="mt-6 pt-6 border-t border-gray-100">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">业主信息</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-gray-500">姓名</p>
                  <p className="font-medium text-gray-900">{parkingInfo.owner_name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">联系电话</p>
                  <p className="font-medium text-gray-900">{parkingInfo.owner_phone || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">车牌号</p>
                  <p className="font-medium text-gray-900">{parkingInfo.car_plate || '-'}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
          <div className="text-6xl mb-4">🚗</div>
          <h3 className="text-lg font-semibold text-gray-800 mb-2">暂未分配车位</h3>
          <p className="text-gray-500">请联系物业管理员分配车位</p>
        </div>
      )}
    </div>
  );
}
