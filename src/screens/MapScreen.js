import { useEffect, useState, useCallback, useRef } from 'react';
import {
  View, Text, TouchableOpacity, ActivityIndicator, StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useApp } from '../context/AppContext';
import { getGeoJSON, getCCAAResumen } from '../services/api';
import LeafletMap from '../components/LeafletMap';
import FilterModal from '../components/FilterModal';
import { COLORS } from '../utils/colors';

const ZOOM_THRESHOLD = 7;

export default function MapScreen({ navigation }) {
  const { t } = useTranslation();
  const { filters } = useApp();
  const [markers, setMarkers] = useState([]);
  const [ccaaMarkers, setCCAAMarkers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState('ccaa');
  const [filtersVisible, setFiltersVisible] = useState(false);
  const [legendVisible, setLegendVisible] = useState(false);
  const loadingRef = useRef(false);

  const getDefaultCenter = () => {
    switch (filters.pais) {
      case 'Portugal': return { lat: 39.5, lng: -8.0 };
      case 'Francia': return { lat: 46.6, lng: 2.2 };
      case 'España': return { lat: 40.4, lng: -3.7 };
      default: return { lat: 43.0, lng: -2.0 };
    }
  };

  const getDefaultZoom = () => {
    switch (filters.pais) {
      case 'Portugal': return 7;
      case 'Francia':
      case 'España': return 6;
      default: return 5;
    }
  };

  // Load CCAA summary
  const loadCCAAResumen = useCallback(async () => {
    try {
      const params = {};
      if (filters.pais) params.pais = filters.pais;
      const geojson = await getCCAAResumen(params);
      const features = (geojson.features || []).map(f => ({
        region: f.properties.region,
        lat: f.geometry.coordinates[1],
        lng: f.geometry.coordinates[0],
        total: f.properties.total,
      }));
      setCCAAMarkers(features);
    } catch (err) {
      console.error('Error loading CCAA summary:', err);
    }
  }, [filters.pais]);

  // Load detail markers
  const loadMarkers = useCallback(async (bounds, zoom) => {
    if (loadingRef.current) return;
    loadingRef.current = true;
    setLoading(true);

    try {
      const params = { ...filters };

      if (zoom >= 10) params.limit = 10000;
      else if (zoom >= 8) params.limit = 5000;
      else if (zoom >= 6) params.limit = 3000;
      else params.limit = 1500;

      if (bounds) {
        params.bbox = `${bounds.minLon},${bounds.minLat},${bounds.maxLon},${bounds.maxLat}`;
      }

      const geojson = await getGeoJSON(params);
      const features = (geojson.features || []).map(f => ({
        id: f.properties.id,
        lat: f.geometry.coordinates[1],
        lng: f.geometry.coordinates[0],
        title: f.properties.nombre,
        subtitle: [f.properties.municipio, f.properties.provincia].filter(Boolean).join(', '),
        categoria: f.properties.categoria,
        tipo: f.properties.tipo,
      }));
      setMarkers(features);
    } catch (err) {
      console.error('Error loading markers:', err);
    } finally {
      setLoading(false);
      loadingRef.current = false;
    }
  }, [filters]);

  // Initial load
  useEffect(() => {
    loadCCAAResumen();
    setViewMode('ccaa');
  }, [loadCCAAResumen]);

  const handleRegionChange = useCallback((data) => {
    const { zoom, bounds } = data;

    if (zoom >= ZOOM_THRESHOLD && viewMode === 'ccaa') {
      setViewMode('detail');
      loadMarkers(bounds, zoom);
    } else if (zoom < ZOOM_THRESHOLD && viewMode === 'detail') {
      setViewMode('ccaa');
    } else if (viewMode === 'detail' && zoom >= ZOOM_THRESHOLD) {
      loadMarkers(bounds, zoom);
    }
  }, [viewMode, loadMarkers]);

  const handleMarkerPress = useCallback((id) => {
    navigation.navigate('Detail', { id });
  }, [navigation]);

  const handleFilterSearch = () => {
    loadCCAAResumen();
  };

  const totalMonumentos = viewMode === 'ccaa'
    ? ccaaMarkers.reduce((sum, c) => sum + c.total, 0)
    : markers.length;

  const translations = {
    viewDetail: t('map.viewDetail'),
    monuments: t('map.monuments'),
    zoomHint: t('map.zoomHint'),
    legendCastles: t('map.legend.castles'),
    legendChurches: t('map.legend.churches'),
    legendPalaces: t('map.legend.palaces'),
    legendArchaeology: t('map.legend.archaeology'),
    legendEthnologic: t('map.legend.ethnologic'),
    legendOthers: t('map.legend.others'),
  };

  return (
    <View style={styles.container}>
      <LeafletMap
        center={getDefaultCenter()}
        zoom={getDefaultZoom()}
        height="100%"
        interactive
        markers={viewMode === 'detail' ? markers : []}
        ccaaMarkers={viewMode === 'ccaa' ? ccaaMarkers : []}
        onMarkerPress={handleMarkerPress}
        onRegionChange={handleRegionChange}
        showLegend={legendVisible}
        translations={translations}
      />

      {/* Loading */}
      {loading && (
        <View style={styles.loadingBadge}>
          <ActivityIndicator size="small" color={COLORS.primary} />
          <Text style={styles.loadingText}>{t('map.loadingShort')}</Text>
        </View>
      )}

      {/* Counter */}
      <View style={styles.counterBadge}>
        <Text style={styles.counterText}>
          {viewMode === 'ccaa'
            ? t('map.monumentsInRegions', { count: totalMonumentos.toLocaleString(), regions: ccaaMarkers.length })
            : t('map.monumentsCount', { count: totalMonumentos.toLocaleString() })}
        </Text>
        {viewMode === 'ccaa' && (
          <Text style={styles.counterHint}>{t('map.zoomHint')}</Text>
        )}
      </View>

      {/* FAB Buttons */}
      <View style={styles.fabColumn}>
        <TouchableOpacity style={styles.fab} onPress={() => setFiltersVisible(true)}>
          <Ionicons name="options" size={22} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.fab, legendVisible && styles.fabActive]}
          onPress={() => setLegendVisible(!legendVisible)}
        >
          <Ionicons name="color-palette" size={22} color={legendVisible ? '#fff' : COLORS.textPrimary} />
        </TouchableOpacity>
      </View>

      <FilterModal
        visible={filtersVisible}
        onClose={() => setFiltersVisible(false)}
        onSearch={handleFilterSearch}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingBadge: {
    position: 'absolute',
    top: 12,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.surface,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  loadingText: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  counterBadge: {
    position: 'absolute',
    bottom: 20,
    alignSelf: 'center',
    backgroundColor: COLORS.surface,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
    alignItems: 'center',
  },
  counterText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  counterHint: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  fabColumn: {
    position: 'absolute',
    top: 12,
    right: 12,
    gap: 10,
  },
  fab: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  fabActive: {
    backgroundColor: COLORS.primary,
  },
});
