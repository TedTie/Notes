// API配置
const API_CONFIG = {
  BASE_URL: import.meta.env.PROD ? 
    (import.meta.env.VITE_API_URL || '') : 
    'http://localhost:5000',
  API_BASE_URL: import.meta.env.PROD ? 
    (import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/api` : '/api') : 
    'http://localhost:5000/api'
}

export default API_CONFIG