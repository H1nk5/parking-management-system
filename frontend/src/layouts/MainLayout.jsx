/**
 * 主布局组件
 * 功能：包含侧边栏和内容区域的布局
 */

import { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// 侧边栏菜单配置
const adminMenus = [
  { path: '/', icon: '📊', label: '首页概览' },
  { path: '/owners', icon: '👥', label: '业主管理' },
  { path: '/parking', icon: '🅿️', label: '车位管理' },
  { path: '/repairs', icon: '🔧', label: '报修管理' },
  { path: '/fees', icon: '💰', label: '费用管理' },
  { path: '/materials', icon: '📦', label: '材料管理' },
  { path: '/reviews', icon: '⭐', label: '评价管理' },
];

const userMenus = [
  { path: '/', icon: '📊', label: '首页' },
  { path: '/my-parking', icon: '🅿️', label: '我的车位' },
  { path: '/my-repairs', icon: '🔧', label: '我的报修' },
  { path: '/my-fees', icon: '💰', label: '我的费用' },
  { path: '/submit-repair', icon: '📝', label: '提交报修' },
  { path: '/my-reviews', icon: '⭐', label: '我的评价' },
];

export default function MainLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const { user, isAdmin, logout } = useAuth();
  const navigate = useNavigate();

  // 根据角色选择菜单
  const menus = isAdmin ? adminMenus : userMenus;

  // 处理登出
  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* 侧边栏 */}
      <aside
        className={`bg-white border-r border-gray-200 transition-all duration-300 ${
          collapsed ? 'w-16' : 'w-64'
        }`}
      >
        {/* Logo区域 */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-gray-200">
          {!collapsed && (
            <div className="flex items-center space-x-2">
              <span className="text-2xl">🚗</span>
              <span className="font-bold text-gray-800">车位管理</span>
            </div>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500"
          >
            {collapsed ? '→' : '←'}
          </button>
        </div>

        {/* 菜单列表 */}
        <nav className="p-2 space-y-1">
          {menus.map((menu) => (
            <NavLink
              key={menu.path}
              to={menu.path}
              end={menu.path === '/'}
              className={({ isActive }) =>
                `flex items-center px-3 py-2.5 rounded-lg transition-all ${
                  isActive
                    ? 'bg-blue-50 text-blue-600'
                    : 'text-gray-600 hover:bg-gray-100'
                } ${collapsed ? 'justify-center' : 'space-x-3'}`
              }
            >
              <span className="text-lg">{menu.icon}</span>
              {!collapsed && <span className="text-sm font-medium">{menu.label}</span>}
            </NavLink>
          ))}
        </nav>
      </aside>

      {/* 主内容区 */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* 顶部导航栏 */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6">
          <h2 className="text-lg font-semibold text-gray-800">
            {isAdmin ? '物业管理后台' : '业主服务中心'}
          </h2>

          <div className="flex items-center space-x-4">
            {/* 用户信息 */}
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-sm">👤</span>
              </div>
              <div className="hidden sm:block">
                <p className="text-sm font-medium text-gray-700">{user?.real_name}</p>
                <p className="text-xs text-gray-500">{isAdmin ? '管理员' : '业主'}</p>
              </div>
            </div>

            {/* 登出按钮 */}
            <button
              onClick={handleLogout}
              className="px-3 py-1.5 text-sm text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
            >
              退出登录
            </button>
          </div>
        </header>

        {/* 页面内容 */}
        <main className="flex-1 overflow-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
