// Colores por categoría/tipo de monumento
export const getCategoryColor = (categoria, tipo) => {
  const cat = (categoria || '').toLowerCase();
  const t = (tipo || '').toLowerCase();

  if (cat.includes('arqueol')) return '#92400e';
  if (cat.includes('etnol')) return '#065f46';
  if (cat.includes('obra civil')) return '#475569';
  if (t.includes('castillo') || t.includes('fortaleza') || t.includes('torre')) return '#7c3aed';
  if (t.includes('iglesia') || t.includes('catedral') || t.includes('ermita') || cat.includes('religio')) return '#be185d';
  if (t.includes('palacio') || t.includes('casa')) return '#0369a1';
  if (t.includes('puente')) return '#475569';
  return '#3b82f6';
};

// Icono emoji por tipo/categoría
export const getCategoryIcon = (tipo, categoria) => {
  const cat = (categoria || '').toLowerCase();
  const t = (tipo || '').toLowerCase();

  if (cat.includes('arqueol')) return '🏺';
  if (cat.includes('etnol')) return '🏚️';
  if (t.includes('castillo') || t.includes('fortaleza') || t.includes('torre')) return '🏰';
  if (t.includes('iglesia') || t.includes('catedral') || t.includes('ermita') || t.includes('convento')) return '⛪';
  if (t.includes('palacio') || t.includes('casa')) return '🏛️';
  if (t.includes('puente')) return '🌉';
  if (t.includes('molino')) return '🏭';
  if (cat.includes('arquitect')) return '🏛️';
  return '📍';
};

// Paleta principal de la app
export const COLORS = {
  primary: '#3b82f6',
  primaryDark: '#2563eb',
  dark: '#1a365d',
  background: '#f8fafc',
  surface: '#ffffff',
  textPrimary: '#1e293b',
  textSecondary: '#64748b',
  border: '#e2e8f0',
  borderLight: '#f1f5f9',
  success: '#10b981',
  warning: '#f59e0b',
  error: '#ef4444',
  overlay: 'rgba(0,0,0,0.5)',
};

// Colores para la leyenda del mapa
export const LEGEND_ITEMS = [
  { label: 'Castillos', color: '#7c3aed' },
  { label: 'Iglesias', color: '#be185d' },
  { label: 'Palacios', color: '#0369a1' },
  { label: 'Arqueología', color: '#92400e' },
  { label: 'Etnológico', color: '#065f46' },
  { label: 'Otros', color: '#3b82f6' },
];
