import { useUIStore } from '@/stores/useUIStore';

/**
 * Intelligently resolve the API base URL.
 * If running on a live domain (such as Vercel) but NEXT_PUBLIC_API_URL is missing or left as localhost,
 * automatically fall back to the live Render backend API.
 */
export const getApiBaseUrl = () => {
  const envUrl = process.env.NEXT_PUBLIC_API_URL;
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    const isLive = hostname !== 'localhost' && hostname !== '127.0.0.1';
    if (isLive && (!envUrl || envUrl.includes('localhost') || envUrl.includes('127.0.0.1'))) {
      return 'https://whatsapp-clone-1nlb.onrender.com/api';
    }
  }
  return envUrl || 'http://localhost:5000/api';
};

/**
 * Retrieve saved authentication token from localStorage if in browser environment
 */
export const getStoredToken = () => {
  if (typeof window !== 'undefined') {
    try {
      return localStorage.getItem('nexchat_token') || null;
    } catch {
      return null;
    }
  }
  return null;
};

async function request(endpoint, options = {}) {
  const isFormData = options.body instanceof FormData;
  const headers = {
    ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
    ...options.headers,
  };

  // Automatically attach Bearer token to authorize cross-domain API requests
  const token = getStoredToken();
  if (token && !headers['Authorization'] && !headers['authorization']) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const baseUrl = getApiBaseUrl();

  let res;
  try {
    res = await fetch(`${baseUrl}${endpoint}`, {
      credentials: 'include',
      ...options,
      headers,
    });
  } catch (netErr) {
    // Only mark offline if the device's navigator explicitly reports offline
    const isOffline = typeof navigator !== 'undefined' && navigator.onLine === false;
    
    if (isOffline) {
      useUIStore.getState().setIsOnline(false);
      useUIStore.getState().setNetworkError('You are currently offline. Check your internet connection.');
    } else {
      // The user is connected to mobile internet/wifi! The server might be waking up (Render cold-start)
      useUIStore.getState().setIsOnline(true);
      useUIStore.getState().setNetworkError(null);
    }

    const error = new Error(isOffline ? 'You are offline' : 'Cannot connect to server');
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
  useUIStore.getState().setIsOnline(true);

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
    const headers = {};
    const token = getStoredToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const baseUrl = getApiBaseUrl();
    const res = await fetch(`${baseUrl}${endpoint}`, {
      method: 'POST',
      body: formData,
      credentials: 'include',
      headers,
    });
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      throw new Error(data?.message || 'Upload failed');
    }
    return data;
  },
};

export default api;
