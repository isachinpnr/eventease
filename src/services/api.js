import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add token to requests
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

// Handle response errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// UroPay payment functions
export const createUroPayPayment = async (eventId, seats) => {
  const response = await api.post('/payments/create-payment', {
    eventId,
    seats
  });
  return response.data;
};

export const verifyUroPayPayment = async (bookingData, transactionId, paymentLinkId = null) => {
  const response = await api.post('/payments/verify', {
    bookingData,
    transactionId,
    paymentLinkId
  });
  return response.data;
};

export const getPaymentStatus = async (bookingId) => {
  const response = await api.get(`/payments/status/${bookingId}`);
  return response.data;
};

export default api;

