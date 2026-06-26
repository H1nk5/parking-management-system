/**
 * 小区车位管理系统 - 前端应用
 * 功能：路由配置和全局状态管理
 */

import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

// 布局组件
import MainLayout from './layouts/MainLayout';

// 页面组件
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Owners from './pages/Owners';
import Parking from './pages/Parking';
import Repairs from './pages/Repairs';
import Fees from './pages/Fees';
import Materials from './pages/Materials';
import Reviews from './pages/Reviews';
import MyParking from './pages/MyParking';
import MyRepairs from './pages/MyRepairs';
import SubmitRepair from './pages/SubmitRepair';
import MyFees from './pages/MyFees';
import MyReviews from './pages/MyReviews';

// 受保护的路由组件
function ProtectedRoute({ children, adminOnly = false }) {
  const { user, isAdmin } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (adminOnly && !isAdmin) {
    return <Navigate to="/" replace />;
  }

  return children;
}

// 应用路由
function AppRoutes() {
  const { user, isAdmin } = useAuth();

  return (
    <Routes>
      {/* 登录页 */}
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />

      {/* 主布局路由 */}
      <Route
        element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }
      >
        {/* 首页 - 所有角色 */}
        <Route path="/" element={<Dashboard />} />

        {/* 管理员路由 */}
        <Route
          path="/owners"
          element={
            <ProtectedRoute adminOnly>
              <Owners />
            </ProtectedRoute>
          }
        />
        <Route
          path="/parking"
          element={
            <ProtectedRoute adminOnly>
              <Parking />
            </ProtectedRoute>
          }
        />
        <Route
          path="/repairs"
          element={
            <ProtectedRoute adminOnly>
              <Repairs />
            </ProtectedRoute>
          }
        />
        <Route
          path="/fees"
          element={
            <ProtectedRoute adminOnly>
              <Fees />
            </ProtectedRoute>
          }
        />
        <Route
          path="/materials"
          element={
            <ProtectedRoute adminOnly>
              <Materials />
            </ProtectedRoute>
          }
        />
        <Route
          path="/reviews"
          element={
            <ProtectedRoute adminOnly>
              <Reviews />
            </ProtectedRoute>
          }
        />

        {/* 业主路由 */}
        <Route path="/my-parking" element={<MyParking />} />
        <Route path="/my-repairs" element={<MyRepairs />} />
        <Route path="/submit-repair" element={<SubmitRepair />} />
        <Route path="/my-fees" element={<MyFees />} />
        <Route path="/my-reviews" element={<MyReviews />} />
      </Route>

      {/* 404页面 */}
      <Route
        path="*"
        element={
          <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="text-center">
              <h1 className="text-6xl font-bold text-gray-300 mb-4">404</h1>
              <p className="text-gray-500 mb-4">页面未找到</p>
              <a href="/" className="btn btn-primary">
                返回首页
              </a>
            </div>
          </div>
        }
      />
    </Routes>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </Router>
  );
}

export default App;
