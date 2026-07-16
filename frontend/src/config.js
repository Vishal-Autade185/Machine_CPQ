// Configuration mapping for the API backend
let baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Auto-correct missing '/api' suffix if the user configured the raw root domain in Vercel
if (baseUrl && !baseUrl.endsWith('/api') && !baseUrl.endsWith('/api/')) {
  if (baseUrl.endsWith('/')) {
    baseUrl = baseUrl.slice(0, -1);
  }
  baseUrl = `${baseUrl}/api`;
}

const API_URL = baseUrl;

export default {
  API_URL
};
