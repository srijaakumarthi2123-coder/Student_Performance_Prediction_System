const API_BASE = 'http://localhost:8000/api';

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${url}`, {
    headers: { 'Content-Type': 'application/json', ...options?.headers },
    ...options,
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Request failed' }));
    throw new Error(error.detail || `HTTP ${response.status}`);
  }
  return response.json();
}

export const api = {
  // Auth
  login: (username: string, password: string) =>
    request<any>('/login', { method: 'POST', body: JSON.stringify({ username, password }) }),
  logout: () => request<any>('/logout', { method: 'POST' }),

  // Dashboard
  getDashboard: () => request<any>('/dashboard'),

  // Students
  getStudents: (params: Record<string, string | number>) => {
    const query = new URLSearchParams(
      Object.entries(params).reduce((acc, [k, v]) => ({ ...acc, [k]: String(v) }), {} as Record<string, string>)
    ).toString();
    return request<any>(`/students?${query}`);
  },
  getStudent: (id: string) => request<any>(`/students/${id}`),
  getStudentTrend: (id: string) => request<any>(`/students/${id}/trend`),
  addStudent: (data: any) => request<any>('/students', { method: 'POST', body: JSON.stringify(data) }),

  // References
  getBranches: () => request<any>('/branches'),
  getYears: () => request<any>('/years'),
  getSemesters: () => request<any>('/semesters'),

  // Analytics
  getAnalytics: (params?: Record<string, string>) => {
    const query = params ? new URLSearchParams(params).toString() : '';
    return request<any>(`/analytics?${query}`);
  },
  getRiskAnalysis: (params?: Record<string, string>) => {
    const query = params ? new URLSearchParams(params).toString() : '';
    return request<any>(`/risk-analysis?${query}`);
  },

  // Prediction
  predict: (data: any) =>
    request<any>('/predict', { method: 'POST', body: JSON.stringify(data) }),
  getPredictions: (params?: { search?: string; branch?: string; year?: string; semester?: string; performance?: string }) => {
    const query = new URLSearchParams(
      Object.entries(params || {}).reduce((acc, [k, v]) => (v ? { ...acc, [k]: String(v) } : acc), {} as Record<string, string>)
    ).toString();
    return request<any>(`/predictions?${query}`);
  },
  deletePrediction: (id: number) =>
    request<any>(`/predictions/${id}`, { method: 'DELETE' }),
  getModelPerformance: () => request<any>('/model-performance'),

  // Dataset
  getDatasetInfo: () => request<any>('/dataset/info'),
  getDatasetPreview: (page: number, search?: string) =>
    request<any>(`/dataset/preview?page=${page}&page_size=50&search=${search || ''}`),
  uploadDataset: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return fetch(`${API_BASE}/upload-dataset`, { method: 'POST', body: formData }).then(r => r.json());
  },
  refreshDataset: () => request<any>('/dataset/refresh', { method: 'POST' }),

  // Reports
  getOverallReport: () => request<any>('/reports/overall'),
  getBranchReport: (branch?: string) =>
    request<any>(`/reports/branch?branch=${branch || ''}`),
  getAtRiskReport: () => request<any>('/reports/at-risk'),
  getSemesterReport: (sem?: string) =>
    request<any>(`/reports/semester?semester=${sem || ''}`),
  getYearReport: (year?: string) =>
    request<any>(`/reports/year?joining_year=${year || ''}`),
  exportReport: (type: string, params?: Record<string, string>) => {
    const query = params ? new URLSearchParams(params).toString() : '';
    window.open(`${API_BASE}/reports/export/${type}?${query}`, '_blank');
  },

  // Train
  trainModel: () => request<any>('/train-model'),
};
