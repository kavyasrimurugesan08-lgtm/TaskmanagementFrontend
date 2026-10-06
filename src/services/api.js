// API Client for ApexTask Enterprise

const API_BASE = (typeof window !== 'undefined' && (window.location.port === '5173' || window.location.port === '5174'))
  ? 'http://localhost:5000/api'
  : '/api';

function getAuthHeader() {
  const token = localStorage.getItem('apextask_token');
  return token ? { 'Authorization': `Bearer ${token}` } : {};
}

async function request(endpoint, options = {}) {
  const headers = {
    ...getAuthHeader(),
    ...options.headers,
  };

  // If not FormData, default to application/json
  if (!(options.body instanceof FormData) && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || `HTTP error ${response.status}`);
  }

  return data;
}

function buildQueryString(params = {}) {
  const clean = {};
  for (const [key, value] of Object.entries(params)) {
    if (
      value !== undefined &&
      value !== null &&
      value !== '' &&
      value !== 'undefined' &&
      value !== 'null' &&
      value !== 'all'
    ) {
      clean[key] = value;
    }
  }
  const q = new URLSearchParams(clean).toString();
  return q ? `?${q}` : '';
}

export const api = {
  // Authentication & Companies
  auth: {
    login: (credentials) => request('/auth/login', { method: 'POST', body: JSON.stringify(credentials) }),
    me: () => request('/auth/me'),
    getAccounts: (companyId = 1) => request(`/auth/accounts?company_id=${companyId}`),
    getCompanies: () => request('/auth/companies'),
    createCompany: (data) => request('/auth/companies', { method: 'POST', body: JSON.stringify(data) })
  },

  // Tasks
  tasks: {
    getAll: (params = {}) => request(`/tasks${buildQueryString(params)}`),
    getOne: (id) => request(`/tasks/${id}`),
    create: (data) => request('/tasks', { method: 'POST', body: JSON.stringify(data) }),
    update: (id, data) => request(`/tasks/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    reschedule: (id, data) => request(`/tasks/${id}/reschedule`, { method: 'PATCH', body: JSON.stringify(data) }),
    updateStatus: (id, status) => request(`/tasks/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
    delete: (id) => request(`/tasks/${id}`, { method: 'DELETE' }),
    addComment: (id, comment) => request(`/tasks/${id}/comments`, { method: 'POST', body: JSON.stringify({ comment }) })
  },

  // Submissions & Approvals
  submissions: {
    getAll: (params = {}) => request(`/submissions${buildQueryString(params)}`),
    review: (id, action, review_comment) =>
      request(`/submissions/${id}/review`, { method: 'POST', body: JSON.stringify({ action, review_comment }) })
  },

  // Employees
  employees: {
    getAll: (params = {}) => request(`/employees${buildQueryString(params)}`),
    create: (data) => request('/employees', { method: 'POST', body: JSON.stringify(data) }),
    update: (id, data) => request(`/employees/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id) => request(`/employees/${id}`, { method: 'DELETE' }),
    regenerateToken: (id) => request(`/employees/${id}/regenerate-token`, { method: 'PATCH' }),
    revokeToken: (id) => request(`/employees/${id}/revoke-token`, { method: 'PATCH' }),
    getHistory: (id) => request(`/employees/${id}/history`)
  },

  // Managers
  managers: {
    getAll: () => request('/managers'),
    create: (data) => request('/managers', { method: 'POST', body: JSON.stringify(data) }),
    update: (id, data) => request(`/managers/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    toggleStatus: (id, status) => request(`/managers/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) })
  },

  // Departments
  departments: {
    getAll: () => request('/departments'),
    create: (data) => request('/departments', { method: 'POST', body: JSON.stringify(data) }),
    update: (id, data) => request(`/departments/${id}`, { method: 'PUT', body: JSON.stringify(data) })
  },

  // Attendance
  attendance: {
    getAll: (params = {}) => request(`/attendance${buildQueryString(params)}`),
    record: (data) => request('/attendance/record', { method: 'POST', body: JSON.stringify(data) })
  },

  // Notifications
  notifications: {
    getAll: () => request('/notifications'),
    send: (data) => request('/notifications', { method: 'POST', body: JSON.stringify(data) }),
    markRead: (id) => request(`/notifications/${id}/read`, { method: 'PATCH' }),
    markAllRead: () => request('/notifications/mark-all-read', { method: 'PATCH' })
  },

  // Reports
  reports: {
    getMetrics: (params = {}) => request(`/reports/metrics${buildQueryString(params)}`),
  },

  // Activity Log
  activity: {
    getAll: (params = {}) => request(`/activity${buildQueryString(params)}`),
  },

  // Company Settings
  settings: {
    get: () => request('/settings'),
    update: (data) => request('/settings', { method: 'PUT', body: JSON.stringify(data) })
  },

  // Search
  search: {
    query: (q) => request(`/search?q=${encodeURIComponent(q)}`)
  },

  // Dedicated Employee Portal (Token-based)
  portal: {
    getOverview: (token) => request(`/portal/${token}`),
    startTask: (token, taskId) => request(`/portal/${token}/start-task/${taskId}`, { method: 'POST' }),
    submitTask: (token, taskId, formData) =>
      request(`/portal/${token}/submit-task/${taskId}`, { method: 'POST', body: formData }),
    clockIn: (token) => request(`/portal/${token}/clock-in`, { method: 'POST' }),
    clockOut: (token) => request(`/portal/${token}/clock-out`, { method: 'POST' }),
    sendMessage: (token, data) => request(`/portal/${token}/message`, { method: 'POST', body: JSON.stringify(data) })
  }
};
