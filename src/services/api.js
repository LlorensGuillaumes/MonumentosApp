import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// 10.0.2.2 es la IP especial del emulador Android que apunta al localhost del PC
const API_BASE = 'http://10.0.2.2:3001/api';

const api = axios.create({
  baseURL: API_BASE,
  timeout: 30000,
});

// Interceptor: añadir token JWT si existe
api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor: si 401 limpiar token
api.interceptors.response.use(
  (res) => res,
  async (err) => {
    if (err.response?.status === 401) {
      await AsyncStorage.multiRemove(['auth_token', 'auth_user']);
    }
    return Promise.reject(err);
  }
);

// ============== DATOS ==============

export const getStats = () => api.get('/stats').then(r => r.data);

export const getMonumentos = (params = {}) =>
  api.get('/monumentos', { params }).then(r => r.data);

export const getMonumento = (id) =>
  api.get(`/monumentos/${id}`).then(r => r.data);

export const getGeoJSON = (params = {}) =>
  api.get('/geojson', { params }).then(r => r.data);

export const getFiltros = (params = {}) =>
  api.get('/filtros', { params }).then(r => r.data);

export const getCCAAResumen = (params = {}) =>
  api.get('/ccaa-resumen', { params }).then(r => r.data);

export const getMunicipios = (params = {}) =>
  api.get('/municipios', { params }).then(r => r.data);

// ============== AUTH ==============

export const authRegister = (data) =>
  api.post('/auth/register', data).then(r => r.data);

export const authLogin = (data) =>
  api.post('/auth/login', data).then(r => r.data);

export const authGoogle = (data) =>
  api.post('/auth/google', data).then(r => r.data);

export const authMe = () =>
  api.get('/auth/me').then(r => r.data);

export const authUpdate = (data) =>
  api.put('/auth/me', data).then(r => r.data);

// ============== FAVORITOS ==============

export const getFavoritos = (params = {}) =>
  api.get('/favoritos', { params }).then(r => r.data);

export const getFavoritoIds = () =>
  api.get('/favoritos/ids').then(r => r.data);

export const addFavorito = (bienId) =>
  api.post(`/favoritos/${bienId}`).then(r => r.data);

export const removeFavorito = (bienId) =>
  api.delete(`/favoritos/${bienId}`).then(r => r.data);

export default api;
