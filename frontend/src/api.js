/**
 * Centralized lightweight API client
 */
const API_BASE = import.meta.env.VITE_API_URL || '';

export const apiRequest = async (endpoint, options = {}) => {
  const token = localStorage.getItem('token');
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  let response;
  try {
    response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers
    });
  } catch (networkError) {
    const error = new Error('সার্ভারের সাথে যোগাযোগ করা যাচ্ছে না। দয়া করে ইন্টারনেট ও ব্যাকএন্ড সংযোগ পরীক্ষা করুন।');
    error.status = 0;
    throw error;
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    let msg = data.message;
    if (!msg) {
      if (response.status === 404 || response.status === 405) {
        msg = 'সার্ভার এন্ডপয়েন্ট পাওয়া যায়নি। ব্যাকএন্ড সার্ভার সংযুক্ত আছে কিনা নিশ্চিত করুন।';
      } else if (response.status >= 500) {
        msg = 'সার্ভারে অভ্যন্তরীণ ত্রুটি ঘটেছে। কিছুক্ষণ পর চেষ্টা করুন।';
      } else {
        msg = 'একটি ত্রুটি ঘটেছে। আবার চেষ্টা করুন।';
      }
    }
    const error = new Error(msg);
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
};

export const api = {
  get: (endpoint) => apiRequest(endpoint, { method: 'GET' }),
  post: (endpoint, body) => apiRequest(endpoint, { method: 'POST', body: JSON.stringify(body) })
};
