// Central configuration for the application
export const API_BASE_URL = 
  (window as any).ARYNOX_CONFIG?.VITE_API_BASE_URL || 
  import.meta.env.VITE_API_BASE_URL || 
  (import.meta.env.PROD ? '' : 'http://localhost:5000');
