/**
 * API服务模块
 * 功能：封装所有后端API请求
 */

import axios from 'axios';

// 创建axios实例
const api = axios.create({
  baseURL: 'http://localhost:3001/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 请求拦截器：添加token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 响应拦截器：统一错误处理
api.interceptors.response.use(
  (response) => {
    return response.data;
  },
  (error) => {
    if (error.response) {
      const { status, data } = error.response;

      // 401未授权：清除token并跳转登录
      if (status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }

      return Promise.reject(data || { message: '请求失败' });
    }
    return Promise.reject({ message: '网络错误' });
  }
);

// ==================== 认证相关API ====================

export const authAPI = {
  // 用户登录
  login: (data) => api.post('/auth/login', data),

  // 用户注册
  register: (data) => api.post('/auth/register', data),

  // 获取当前用户信息
  getMe: () => api.get('/auth/me'),
};

// ==================== 业主管理API ====================

export const ownerAPI = {
  // 获取业主列表
  getList: (params) => api.get('/owners', { params }),

  // 获取业主详情
  getDetail: (id) => api.get(`/owners/${id}`),

  // 添加业主
  create: (data) => api.post('/owners', data),

  // 更新业主
  update: (id, data) => api.put(`/owners/${id}`, data),

  // 删除业主
  delete: (id) => api.delete(`/owners/${id}`),
};

// ==================== 车位管理API ====================

export const parkingAPI = {
  // 获取车位列表
  getList: (params) => api.get('/parking', { params }),

  // 获取车位详情
  getDetail: (id) => api.get(`/parking/${id}`),

  // 添加车位
  create: (data) => api.post('/parking', data),

  // 更新车位
  update: (id, data) => api.put(`/parking/${id}`, data),

  // 删除车位
  delete: (id) => api.delete(`/parking/${id}`),

  // 获取车位统计
  getStats: () => api.get('/parking/stats/summary'),
};

// ==================== 报修维修API ====================

export const repairAPI = {
  // 获取报修列表
  getRequestList: (params) => api.get('/repairs/requests', { params }),

  // 获取报修详情
  getRequestDetail: (id) => api.get(`/repairs/requests/${id}`),

  // 提交报修
  createRequest: (data) => api.post('/repairs/requests', data),

  // 更新报修状态
  updateRequestStatus: (id, data) => api.put(`/repairs/requests/${id}/status`, data),

  // 获取维修记录列表
  getRecordList: (params) => api.get('/repairs/records', { params }),

  // 创建维修记录
  createRecord: (data) => api.post('/repairs/records', data),

  // 更新维修记录
  updateRecord: (id, data) => api.put(`/repairs/records/${id}`, data),

  // 获取报修统计
  getStats: () => api.get('/repairs/stats/summary'),
};

// ==================== 费用管理API ====================

export const feeAPI = {
  // 获取费用列表
  getList: (params) => api.get('/fees', { params }),

  // 获取费用详情
  getDetail: (id) => api.get(`/fees/${id}`),

  // 添加费用
  create: (data) => api.post('/fees', data),

  // 更新费用
  update: (id, data) => api.put(`/fees/${id}`, data),

  // 缴费
  pay: (id) => api.put(`/fees/${id}/pay`),

  // 删除费用
  delete: (id) => api.delete(`/fees/${id}`),

  // 获取费用统计
  getStats: () => api.get('/fees/stats/summary'),
};

// ==================== 材料管理API ====================

export const materialAPI = {
  // 获取材料列表
  getList: (params) => api.get('/materials', { params }),

  // 获取材料详情
  getDetail: (id) => api.get(`/materials/${id}`),

  // 添加材料
  create: (data) => api.post('/materials', data),

  // 更新材料
  update: (id, data) => api.put(`/materials/${id}`, data),

  // 删除材料
  delete: (id) => api.delete(`/materials/${id}`),

  // 补充库存
  restock: (id, data) => api.put(`/materials/${id}/restock`, data),

  // 记录使用
  recordUsage: (data) => api.post('/materials/usage', data),

  // 获取使用记录
  getUsageList: (params) => api.get('/materials/usage/list', { params }),
};

// ==================== 评价管理API ====================

export const reviewAPI = {
  // 获取评价列表
  getList: (params) => api.get('/reviews', { params }),

  // 获取评价详情
  getDetail: (id) => api.get(`/reviews/${id}`),

  // 提交评价
  create: (data) => api.post('/reviews', data),

  // 更新评价
  update: (id, data) => api.put(`/reviews/${id}`, data),

  // 删除评价
  delete: (id) => api.delete(`/reviews/${id}`),

  // 获取待评价列表
  getPending: () => api.get('/reviews/pending/list'),

  // 获取评价统计
  getStats: () => api.get('/reviews/stats/summary'),
};

// ==================== 仪表盘API ====================

export const dashboardAPI = {
  // 获取统计数据
  getStats: () => api.get('/dashboard/stats'),

  // 获取最近报修
  getRecentRepairs: () => api.get('/dashboard/recent-repairs'),
};

export default api;
