import { useUIStore } from '@/stores/useUIStore';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

async function request(endpoint, options = {}) {
  const isFormData = options.body instanceof FormData;
  const headers = {
    ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
    ...options.headers,
  };

  let res;
  try {
    res = await fetch(`${API_URL}${endpoint}`, {
      credentials: 'include',
      ...options,
      headers,
    });
  } catch (netErr) {
    const isOffline = typeof navigator !== 'undefined' && !navigator.onLine;
    const msg = isOffline
      ? 'You are offline. Please check your internet connection.'
      : 'Cannot connect to server. Please check your network connection.';
    
    useUIStore.getState().setNetworkError(msg);
    if (isOffline) {
      useUIStore.getState().setIsOnline(false);
    }
    const error = new Error(msg);
    error.isNetworkError = true;
    error.isOffline = isOffline;
    throw error;
  }

  let data;
  try {
    data = await res.json();
  } catch {
    data = null;
  }

  if (!res.ok) {
    const isDbDown = res.status === 503 || data?.isDatabaseDown;
    if (isDbDown) {
      useUIStore.getState().setIsDatabaseDown(true);
    }

    const errorMessage = data?.message || data?.error || `Request failed with status ${res.status}`;
    const error = new Error(errorMessage);
    error.status = res.status;
    error.data = data;
    error.isDatabaseDown = Boolean(isDbDown);
    throw error;
  }

  // Clear database down flag if call succeeded
  useUIStore.getState().setIsDatabaseDown(false);
  useUIStore.getState().setNetworkError(null);

  return data;
}

export const api = {
  get: (endpoint, options) => request(endpoint, { method: 'GET', ...options }),
  post: (endpoint, body, options) =>
    request(endpoint, {
      method: 'POST',
      body: body instanceof FormData ? body : JSON.stringify(body),
      ...options,
    }),
  patch: (endpoint, body, options) =>
    request(endpoint, {
      method: 'PATCH',
      body: body instanceof FormData ? body : JSON.stringify(body),
      ...options,
    }),
  put: (endpoint, body, options) =>
    request(endpoint, {
      method: 'PUT',
      body: body instanceof FormData ? body : JSON.stringify(body),
      ...options,
    }),
  delete: (endpoint, options) => request(endpoint, { method: 'DELETE', ...options }),
  upload: async (endpoint, formData) => {
    const res = await fetch(`${API_URL}${endpoint}`, {
      method: 'POST',
      body: formData,
      credentials: 'include',
    });
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      throw new Error(data?.message || 'Upload failed');
    }
    return data;
  },
};

export default api;
