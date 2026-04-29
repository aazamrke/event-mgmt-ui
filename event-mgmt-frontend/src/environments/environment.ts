export const environment = {
  production: false,
  apiUrl: (window as any)['__API_URL__'] || `${window.location.protocol}//${window.location.hostname}:8000`
};