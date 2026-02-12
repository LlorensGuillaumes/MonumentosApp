import { useEffect, useState, useCallback } from 'react';
import {
  View, Text, ScrollView, FlatList, TouchableOpacity,
  ActivityIndicator, StyleSheet, RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { getMonumentos } from '../services/api';
import MonumentoCard from '../components/MonumentoCard';
import LanguageSelector from '../components/LanguageSelector';
import { COLORS } from '../utils/colors';

const FLAG_MAP = { 'España': '🇪🇸', 'Italia': '🇮🇹', 'Portugal': '🇵🇹', 'Francia': '🇫🇷' };

export default function HomeScreen({ navigation }) {
  const { t } = useTranslation();
  const { stats } = useApp();
  const { user } = useAuth();
  const [destacados, setDestacados] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadDestacados = useCallback(async () => {
    try {
      const data = await getMonumentos({
        solo_wikidata: true,
        solo_imagen: true,
        limit: 8,
        page: Math.floor(Math.random() * 100) + 1,
      });
      setDestacados(data.items);
    } catch (err) {
      console.error('Error loading destacados:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadDestacados();
  }, [loadDestacados]);

  const onRefresh = () => {
    setRefreshing(true);
    loadDestacados();
  };

  const requireAuth = (callback) => {
    if (!user) {
      navigation.navigate('Login');
      return;
    }
    callback();
  };

  const navigateToSearch = (params = {}) => {
    requireAuth(() => navigation.navigate('Buscar', params));
  };

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
    >
      {/* Hero */}
      <View style={styles.hero}>
        <View style={styles.heroTopRow}>
          <View style={{ flex: 1 }} />
          <LanguageSelector />
        </View>
        <Text style={styles.heroTitle}>{t('home.heroTitle')}</Text>
        <Text style={styles.heroSubtitle}>
          {t('home.heroSubtitle', { count: stats?.total?.toLocaleString() || '100,000' })}
        </Text>
        <View style={styles.heroActions}>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => navigateToSearch()}
          >
            <Ionicons name="search" size={18} color="#fff" />
            <Text style={styles.primaryButtonText}>{t('home.exploreMonuments')}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => requireAuth(() => navigation.navigate('Mapa'))}
          >
            <Ionicons name="map" size={18} color={COLORS.primary} />
            <Text style={styles.secondaryButtonText}>{t('home.viewOnMap')}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Stats */}
      {stats && (
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statIcon}>🏛️</Text>
            <Text style={styles.statValue}>{stats.total?.toLocaleString()}</Text>
            <Text style={styles.statLabel}>{t('home.monuments')}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statIcon}>📍</Text>
            <Text style={styles.statValue}>{stats.con_coordenadas?.toLocaleString()}</Text>
            <Text style={styles.statLabel}>{t('home.withLocation')}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statIcon}>📚</Text>
            <Text style={styles.statValue}>{stats.con_wikidata?.toLocaleString()}</Text>
            <Text style={styles.statLabel}>{t('home.withWikipedia')}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statIcon}>📷</Text>
            <Text style={styles.statValue}>{stats.imagenes?.toLocaleString()}</Text>
            <Text style={styles.statLabel}>{t('home.images')}</Text>
          </View>
        </View>
      )}

      {/* CTA Banner */}
      {!user && (
        <View style={styles.ctaBanner}>
          <Text style={styles.ctaTitle}>{t('home.ctaTitle')}</Text>
          <Text style={styles.ctaText}>{t('home.ctaText')}</Text>
          <TouchableOpacity
            style={styles.ctaButton}
            onPress={() => navigation.navigate('Login')}
          >
            <Ionicons name="person-add" size={18} color="#ef4444" />
            <Text style={styles.ctaButtonText}>{t('home.ctaButton')}</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Destacados */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('home.featuredMonuments')}</Text>
        {loading ? (
          <ActivityIndicator size="large" color={COLORS.primary} style={{ padding: 30 }} />
        ) : (
          <FlatList
            horizontal
            data={destacados}
            keyExtractor={item => String(item.id)}
            renderItem={({ item }) => (
              <MonumentoCard
                monumento={item}
                horizontal
                onPress={() => requireAuth(() => navigation.navigate('Detail', { id: item.id, title: item.denominacion }))}
              />
            )}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 16 }}
          />
        )}
      </View>

      {/* Países */}
      {stats?.por_pais && stats.por_pais.length > 1 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('home.exploreByCountry')}</Text>
          <View style={styles.countriesGrid}>
            {stats.por_pais.map(p => (
              <TouchableOpacity
                key={p.pais}
                style={styles.countryCard}
                onPress={() => requireAuth(() => navigateToSearch({ pais: p.pais }))}
              >
                <Text style={styles.countryFlag}>{FLAG_MAP[p.pais] || '🌍'}</Text>
                <Text style={styles.countryName}>{p.pais}</Text>
                <Text style={styles.countryCount}>{t('home.monumentsCount', { count: p.total.toLocaleString() })}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {/* Regiones */}
      {stats?.por_region && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('home.exploreByRegion')}</Text>
          <View style={styles.regionsGrid}>
            {stats.por_region.map(r => (
              <TouchableOpacity
                key={`${r.pais}-${r.region}`}
                style={styles.regionCard}
                onPress={() => requireAuth(() => navigateToSearch({ region: r.region, pais: r.pais }))}
              >
                <Text style={styles.regionName} numberOfLines={1}>{r.region}</Text>
                <Text style={styles.regionCount}>{r.total.toLocaleString()}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      <View style={{ height: 30 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  // Hero
  hero: {
    backgroundColor: COLORS.dark,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 28,
  },
  heroTopRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 10,
  },
  heroTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 10,
  },
  heroSubtitle: {
    fontSize: 15,
    color: '#cbd5e1',
    lineHeight: 22,
    marginBottom: 20,
  },
  heroActions: {
    flexDirection: 'row',
    gap: 10,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 10,
  },
  primaryButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 10,
  },
  secondaryButtonText: {
    color: COLORS.primary,
    fontWeight: '600',
    fontSize: 14,
  },
  // Stats
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 12,
    gap: 8,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  statIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.dark,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  // CTA Banner
  ctaBanner: {
    marginHorizontal: 12,
    marginTop: 16,
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    overflow: 'hidden',
    backgroundColor: '#ef4444',
  },
  ctaTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 8,
  },
  ctaText: {
    fontSize: 14,
    color: '#fef2f2',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 16,
  },
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
  },
  ctaButtonText: {
    color: '#ef4444',
    fontWeight: '700',
    fontSize: 15,
  },
  // Sections
  section: {
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.dark,
    marginBottom: 12,
    paddingHorizontal: 16,
  },
  // Countries
  countriesGrid: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 10,
  },
  countryCard: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  countryFlag: {
    fontSize: 30,
    marginBottom: 6,
  },
  countryName: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.dark,
  },
  countryCount: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  // Regions
  regionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    gap: 8,
  },
  regionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.surface,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    minWidth: '47%',
    flex: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  regionName: {
    fontSize: 13,
    fontWeight: '500',
    color: COLORS.textPrimary,
    flex: 1,
  },
  regionCount: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.primary,
    marginLeft: 6,
  },
});
