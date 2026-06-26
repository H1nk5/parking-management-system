/**
 * 认证上下文
 * 功能：管理用户登录状态和用户信息
 */

import { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../services/api';

// 创建上下文
const AuthContext = createContext(null);

// 上下文提供者组件
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // 初始化时检查本地存储的token
  useEffect(() => {
    const token = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');

    if (token && savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (e) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }
    setLoading(false);
  }, []);

  // 登录
  const login = async (username, password) => {
    const response = await authAPI.login({ username, password });
    const { token, user: userData } = response.data;

    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);

    return userData;
  };

  // 注册
  const register = async (data) => {
    const response = await authAPI.register(data);
    return response;
  };

  // 登出
  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  // 刷新用户信息
  const refreshUser = async () => {
    try {
      const response = await authAPI.getMe();
      const userData = response.data;
      localStorage.setItem('user', JSON.stringify(userData));
      setUser(userData);
      return userData;
    } catch (error) {
      logout();
      throw error;
    }
  };

  // 检查是否是管理员
  const isAdmin = user?.role === 'admin';

  // 检查是否是业主
  const isUser = user?.role === 'user';

  const value = {
    user,
    loading,
    isAdmin,
    isUser,
    login,
    register,
    logout,
    refreshUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

// 自定义hook
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth必须在AuthProvider内部使用');
  }
  return context;
}

export default AuthContext;
