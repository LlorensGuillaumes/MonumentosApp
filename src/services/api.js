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

// Normaliza filtros antes de enviar al backend:
// - Vacíos / nulos / arrays vacíos: omitidos
// - Arrays con elementos: serializados como CSV (más simple que ?key[]=)
function normalizeFilters(params) {
  const out = {};
  for (const [k, v] of Object.entries(params || {})) {
    if (v === null || v === undefined || v === '') continue;
    if (Array.isArray(v)) {
      if (v.length === 0) continue;
      out[k] = v.join(',');
    } else {
      out[k] = v;
    }
  }
  return out;
}

export const getStats = () => api.get('/stats').then(r => r.data);

export const getMonumentos = (params = {}) =>
  api.get('/monumentos', { params: normalizeFilters(params) }).then(r => r.data);

export const getMonumento = (id) =>
  api.get(`/monumentos/${id}`).then(r => r.data);

export const getGeoJSON = (params = {}) =>
  api.get('/geojson', { params: normalizeFilters(params) }).then(r => r.data);

export const getFiltros = (params = {}) =>
  api.get('/filtros', { params: normalizeFilters(params) }).then(r => r.data);

export const getCCAAResumen = (params = {}) =>
  api.get('/ccaa-resumen', { params: normalizeFilters(params) }).then(r => r.data);

export const getMunicipios = (params = {}) =>
  api.get('/municipios', { params }).then(r => r.data);

// ============== WIKIPEDIA ==============

export const getWikipediaExtract = (id, lang) =>
  api.get(`/monumentos/${id}/wikipedia`, { params: lang ? { lang } : {} }).then(r => r.data).catch(() => null);

// ============== PERSONAS / AUTORES ==============

export const getPersonas = (params = {}) =>
  api.get('/personas', { params: normalizeFilters(params) }).then(r => r.data);

export const getPersonaBienes = (qid, limit = 100) =>
  api.get(`/personas/${qid}/bienes`, { params: { limit } }).then(r => r.data);

// ============== RUTAS CULTURALES ==============

export const getRutasCulturales = (lang) =>
  api.get('/rutas-culturales', { params: lang ? { lang } : {} }).then(r => r.data);

export const getRutaCultural = (slug) =>
  api.get(`/rutas-culturales/${slug}`).then(r => r.data);

// ============== TRAVEL DIARY ==============

export const getDiaryEntries = (params = {}) =>
  api.get('/diary', { params }).then(r => r.data);

export const addDiaryEntry = (data) =>
  api.post('/diary', data).then(r => r.data);

export const deleteDiaryEntry = (id) =>
  api.delete(`/diary/${id}`).then(r => r.data);

// ============== USER STATS ==============

export const getUserStats = () =>
  api.get('/auth/stats').then(r => r.data);

// ============== CHATBOT (admin) ==============

export const adminChat = ({ question, modo, history }) =>
  api.post('/admin/chat', { question, modo, history }).then(r => r.data);

export const getMonumentosByIds = (ids) =>
  api.get('/monumentos/by-ids', { params: { ids: ids.join(',') } }).then(r => r.data);

// ============== NOTAS + VALORACIONES (Detail) ==============

export const getNotasMonumento = (bienId) =>
  api.get(`/monumentos/${bienId}/notas`).then(r => r.data);

export const addNotaMonumento = (bienId, tipo, texto) =>
  api.post(`/monumentos/${bienId}/notas`, { tipo, texto }).then(r => r.data);

export const deleteNotaMonumento = (bienId, notaId) =>
  api.delete(`/monumentos/${bienId}/notas/${notaId}`).then(r => r.data);

export const getValoraciones = (bienId) =>
  api.get(`/monumentos/${bienId}/valoraciones`).then(r => r.data);

export const addValoracion = (bienId, data) =>
  api.post(`/monumentos/${bienId}/valoraciones`, data).then(r => r.data);

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

export const changePassword = (data) =>
  api.put('/auth/me/password', data).then(r => r.data);

// ============== FAVORITOS ==============

export const getFavoritos = (params = {}) =>
  api.get('/favoritos', { params }).then(r => r.data);

export const getFavoritoIds = () =>
  api.get('/favoritos/ids').then(r => r.data);

export const addFavorito = (bienId) =>
  api.post(`/favoritos/${bienId}`).then(r => r.data);

export const removeFavorito = (bienId) =>
  api.delete(`/favoritos/${bienId}`).then(r => r.data);

// ============== PROPUESTAS ==============

export const submitPropuesta = (formData) =>
  api.post('/propuestas', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 60000,
  }).then(r => r.data);

export const getMisPropuestas = (params = {}) =>
  api.get('/propuestas/mis', { params }).then(r => r.data);

// ============== CONTACTO ==============

export const sendContact = ({ email, asunto, mensaje, archivos = [] }) => {
  const formData = new FormData();
  formData.append('email', email);
  formData.append('asunto', asunto);
  formData.append('mensaje', mensaje);
  archivos.forEach(file => formData.append('archivos', file));
  return api.post('/contact', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 30000,
  }).then(r => r.data);
};

export default api;
