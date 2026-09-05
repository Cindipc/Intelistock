const API_BASE_URL = import.meta.env.VITE_ML_API_URL || 'http://localhost:5000';

async function request(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;

  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    ...options,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message = data?.detail || data?.message || 'Error en la API de ML';
    throw new Error(message);
  }

  return data;
}

export const checkHealth = async () => request('/health');

export const predict = async (payload) =>
  request('/predict', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

export const trainModel = async (payload) =>
  request('/train', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

export const getModelInfo = async () => request('/model');

const api = {
  checkHealth,
  predict,
  trainModel,
  getModelInfo,
};

export default api;
