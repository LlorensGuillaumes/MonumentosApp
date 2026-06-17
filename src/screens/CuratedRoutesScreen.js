import { useEffect, useState, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, Image, ActivityIndicator,
  StyleSheet, RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { getRutasCulturales } from '../services/api';
import { COLORS } from '../utils/colors';
import { imageSource } from '../utils/image';

export default function CuratedRoutesScreen({ navigation }) {
  const { t, i18n } = useTranslation();
  const [rutas, setRutas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getRutasCulturales(i18n.language);
      setRutas(Array.isArray(data) ? data : (data?.rutas || []));
    } catch (err) {
      console.error('Error rutas culturales:', err.message);
      setRutas([]);
    } finally {
      setLoading(false);
    }
  }, [i18n.language]);

  useEffect(() => { load(); }, [load]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  if (loading && rutas.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <FlatList
      data={rutas}
      keyExtractor={(item) => String(item.id ?? item.slug)}
      contentContainerStyle={styles.list}
      ItemSeparatorComponent={() => <View style={styles.sep} />}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />
      }
      ListEmptyComponent={
        <View style={styles.emptyContainer}>
          <Ionicons name="map-outline" size={48} color={COLORS.textSecondary} />
          <Text style={styles.emptyText}>
            {t('curated.empty', 'Sense rutes culturals')}
          </Text>
        </View>
      }
      renderItem={({ item }) => (
        <TouchableOpacity
          style={styles.card}
          onPress={() => navigation.navigate('CuratedRouteDetail', { slug: item.slug, title: item.nombre })}
          activeOpacity={0.7}
        >
          {item.imagen_portada ? (
            <Image source={imageSource(item.imagen_portada)} style={styles.image} />
          ) : (
            <View style={[styles.image, styles.imagePlaceholder]}>
              <Ionicons name="map" size={32} color={COLORS.textSecondary} />
            </View>
          )}
          <View style={styles.body}>
            {item.tema ? <Text style={styles.tema}>{item.tema}</Text> : null}
            <Text style={styles.title} numberOfLines={2}>{item.nombre}</Text>
            {item.region ? <Text style={styles.region}>📍 {item.region}</Text> : null}
            {item.descripcion ? (
              <Text style={styles.desc} numberOfLines={2}>{item.descripcion}</Text>
            ) : null}
            <View style={styles.footer}>
              <View style={styles.badge}>
                <Ionicons name="location" size={12} color={COLORS.primary} />
                <Text style={styles.badgeText}>
                  {item.num_paradas || 0} {t('curated.stops', 'parades')}
                </Text>
              </View>
              {item.pais ? (
                <Text style={styles.country}>{item.pais}</Text>
              ) : null}
            </View>
          </View>
        </TouchableOpacity>
      )}
    />
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.background,
  },
  list: { padding: 12, paddingBottom: 24 },
  sep: { height: 12 },
  emptyContainer: { alignItems: 'center', marginTop: 60, gap: 12 },
  emptyText: { fontSize: 15, color: COLORS.textSecondary },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  image: {
    width: '100%',
    height: 140,
    backgroundColor: COLORS.borderLight,
  },
  imagePlaceholder: {
    alignItems: 'center', justifyContent: 'center',
  },
  body: { padding: 12 },
  tema: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: 4,
  },
  title: { fontSize: 16, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 4 },
  region: { fontSize: 13, color: COLORS.textSecondary, marginBottom: 4 },
  desc: { fontSize: 13, color: COLORS.textSecondary, lineHeight: 18, marginBottom: 8 },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: COLORS.primary + '15',
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.primary,
  },
  country: { fontSize: 12, color: COLORS.textSecondary, fontWeight: '600' },
});
