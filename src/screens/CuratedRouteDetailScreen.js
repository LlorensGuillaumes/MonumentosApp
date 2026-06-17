import { useEffect, useState, useMemo, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, Image, ActivityIndicator,
  StyleSheet, Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { getRutaCultural } from '../services/api';
import LeafletMap from '../components/LeafletMap';
import { COLORS } from '../utils/colors';
import { imageSource } from '../utils/image';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function CuratedRouteDetailScreen({ route, navigation }) {
  const { t } = useTranslation();
  const { slug } = route.params;
  const [ruta, setRuta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getRutaCultural(slug);
      setRuta(data);
      if (data?.nombre) navigation.setOptions({ title: data.nombre });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [slug, navigation]);

  useEffect(() => { load(); }, [load]);

  // Markers per al mapa amb numeració
  const mapMarkers = useMemo(() => {
    if (!ruta?.paradas) return [];
    return ruta.paradas
      .filter(p => p.latitud != null && p.longitud != null)
      .map((p, i) => ({
        id: p.bien_id || p.id,
        lat: p.latitud,
        lng: p.longitud,
        title: `${i + 1}. ${p.nombre || ''}`,
        subtitle: p.municipio || p.localidad || '',
        color: COLORS.primary,
      }));
  }, [ruta]);

  // Centre del mapa = mitjana dels paradas
  const mapCenter = useMemo(() => {
    if (!mapMarkers.length) return { lat: 41.0, lng: -3.7 };
    const lat = mapMarkers.reduce((s, m) => s + m.lat, 0) / mapMarkers.length;
    const lng = mapMarkers.reduce((s, m) => s + m.lng, 0) / mapMarkers.length;
    return { lat, lng };
  }, [mapMarkers]);

  const handleMarkerPress = useCallback((id) => {
    navigation.navigate('Detail', { id });
  }, [navigation]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (error || !ruta) {
    return (
      <View style={styles.loadingContainer}>
        <Ionicons name="alert-circle-outline" size={48} color={COLORS.textSecondary} />
        <Text style={styles.errorText}>{error || t('curated.notFound', 'Ruta no trobada')}</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Hero amb imatge portada */}
      {ruta.imagen_portada && (
        <Image source={imageSource(ruta.imagen_portada)} style={styles.hero} />
      )}

      {/* Info principal */}
      <View style={styles.headerCard}>
        {ruta.tema ? <Text style={styles.tema}>{ruta.tema}</Text> : null}
        <Text style={styles.title}>{ruta.nombre}</Text>
        {ruta.region ? <Text style={styles.region}>📍 {ruta.region}{ruta.pais ? ` · ${ruta.pais}` : ''}</Text> : null}
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Ionicons name="location" size={16} color={COLORS.primary} />
            <Text style={styles.statText}>
              {ruta.paradas?.length || 0} {t('curated.stops', 'parades')}
            </Text>
          </View>
        </View>
      </View>

      {/* Descripció */}
      {ruta.descripcion ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('curated.description', 'Descripció')}</Text>
          <Text style={styles.descText}>{ruta.descripcion}</Text>
        </View>
      ) : null}

      {/* Mapa */}
      {mapMarkers.length > 0 ? (
        <View style={styles.mapWrap}>
          <Text style={styles.sectionTitle}>{t('curated.routeMap', 'Mapa de la ruta')}</Text>
          <LeafletMap
            markers={mapMarkers}
            center={mapCenter}
            zoom={ruta.zoom || 7}
            height={300}
            interactive
            onMarkerPress={handleMarkerPress}
          />
        </View>
      ) : null}

      {/* Paradas */}
      {ruta.paradas?.length > 0 ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {t('curated.stopsList', 'Paradas')} ({ruta.paradas.length})
          </Text>
          {ruta.paradas.map((p, idx) => (
            <TouchableOpacity
              key={`${p.id || p.bien_id}-${idx}`}
              style={styles.paradaRow}
              onPress={() => p.bien_id && navigation.navigate('Detail', { id: p.bien_id })}
              disabled={!p.bien_id}
            >
              <View style={styles.paradaNumber}>
                <Text style={styles.paradaNumberText}>{idx + 1}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.paradaTitle} numberOfLines={2}>{p.nombre}</Text>
                {(p.municipio || p.localidad) && (
                  <Text style={styles.paradaSub}>
                    📍 {[p.localidad, p.municipio].filter(Boolean).join(', ')}
                  </Text>
                )}
                {(p.estilo || p.periodo) && (
                  <Text style={styles.paradaMeta}>
                    {[p.estilo, p.periodo].filter(Boolean).join(' · ')}
                  </Text>
                )}
                {p.autor && (
                  <Text style={styles.paradaAuthor}>👤 {p.autor}</Text>
                )}
                {p.descripcion && (
                  <Text style={styles.paradaDesc} numberOfLines={3}>{p.descripcion}</Text>
                )}
              </View>
              {p.bien_id && (
                <Ionicons name="chevron-forward" size={18} color={COLORS.textSecondary} />
              )}
            </TouchableOpacity>
          ))}
        </View>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  loadingContainer: {
    flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, backgroundColor: COLORS.background,
  },
  errorText: { fontSize: 14, color: COLORS.textSecondary, textAlign: 'center', paddingHorizontal: 24 },
  hero: {
    width: SCREEN_WIDTH,
    height: 200,
    backgroundColor: COLORS.borderLight,
  },
  headerCard: {
    backgroundColor: COLORS.surface,
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  tema: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: 6,
  },
  title: { fontSize: 22, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 6 },
  region: { fontSize: 13, color: COLORS.textSecondary, marginBottom: 10 },
  statsRow: { flexDirection: 'row', gap: 10, marginTop: 6 },
  statBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: COLORS.primary + '15',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
  },
  statText: { fontSize: 12, fontWeight: '700', color: COLORS.primary },
  section: {
    padding: 16,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: 10,
  },
  descText: { fontSize: 14, lineHeight: 21, color: COLORS.textPrimary },
  mapWrap: { marginTop: 8, backgroundColor: COLORS.surface, paddingTop: 12 },
  paradaRow: {
    flexDirection: 'row',
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
    alignItems: 'flex-start',
  },
  paradaNumber: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: COLORS.primary,
    alignItems: 'center', justifyContent: 'center',
    marginTop: 2,
  },
  paradaNumberText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  paradaTitle: { fontSize: 15, fontWeight: '600', color: COLORS.textPrimary, marginBottom: 2 },
  paradaSub: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
  paradaMeta: { fontSize: 11, color: COLORS.textSecondary, marginTop: 2, fontStyle: 'italic' },
  paradaAuthor: { fontSize: 11, color: COLORS.primary, marginTop: 2 },
  paradaDesc: { fontSize: 12, color: COLORS.textSecondary, marginTop: 6, lineHeight: 17 },
});
