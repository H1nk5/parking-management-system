/**
 * 登录页面
 * 功能：用户登录和注册
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    real_name: '',
    phone: '',
    email: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login, register } = useAuth();
  const navigate = useNavigate();

  // 处理输入变化
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError('');
  };

  // 处理登录
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await login(formData.username, formData.password);
      navigate('/');
    } catch (err) {
      setError(err.message || '登录失败');
    } finally {
      setLoading(false);
    }
  };

  // 处理注册
  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await register(formData);
      setIsLogin(true);
      setError('');
      alert('注册成功，请登录');
    } catch (err) {
      setError(err.message || '注册失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="w-full max-w-md">
        {/* Logo和标题 */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-500 rounded-2xl mb-4">
            <span className="text-3xl">🚗</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">小区车位管理系统</h1>
          <p className="text-gray-500 mt-2">智慧物业 · 便捷生活</p>
        </div>

        {/* 登录/注册卡片 */}
        <div className="bg-white rounded-2xl shadow-lg p-8">
          {/* 切换标签 */}
          <div className="flex mb-6 bg-gray-100 rounded-lg p-1">
            <button
              type="button"
              onClick={() => {
                setIsLogin(true);
                setError('');
              }}
              className={`flex-1 py-2 rounded-md text-sm font-medium transition-all ${
                isLogin ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500'
              }`}
            >
              登录
            </button>
            <button
              type="button"
              onClick={() => {
                setIsLogin(false);
                setError('');
              }}
              className={`flex-1 py-2 rounded-md text-sm font-medium transition-all ${
                !isLogin ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500'
              }`}
            >
              注册
            </button>
          </div>

          {/* 错误提示 */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* 登录表单 */}
          {isLogin ? (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="label">用户名</label>
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  className="input"
                  placeholder="请输入用户名"
                  required
                />
              </div>
              <div>
                <label className="label">密码</label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="input"
                  placeholder="请输入密码"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full btn btn-primary py-3 text-base"
              >
                {loading ? '登录中...' : '登录'}
              </button>
            </form>
          ) : (
            /* 注册表单 */
            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label className="label">用户名</label>
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  className="input"
                  placeholder="请输入用户名"
                  required
                />
              </div>
              <div>
                <label className="label">密码</label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="input"
                  placeholder="请输入密码"
                  required
                />
              </div>
              <div>
                <label className="label">真实姓名</label>
                <input
                  type="text"
                  name="real_name"
                  value={formData.real_name}
                  onChange={handleChange}
                  className="input"
                  placeholder="请输入真实姓名"
                  required
                />
              </div>
              <div>
                <label className="label">手机号码</label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="input"
                  placeholder="请输入手机号码"
                />
              </div>
              <div>
                <label className="label">电子邮箱</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="input"
                  placeholder="请输入电子邮箱"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full btn btn-primary py-3 text-base"
              >
                {loading ? '注册中...' : '注册'}
              </button>
            </form>
          )}

          {/* 测试账号提示 */}
          {isLogin && (
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-500 font-medium mb-2">测试账号：</p>
              <div className="text-xs text-gray-400 space-y-1">
                <p>管理员：admin / admin123</p>
                <p>业主：user1 / 123456</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
