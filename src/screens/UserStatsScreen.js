import { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, ActivityIndicator, StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { getUserStats } from '../services/api';
import { COLORS } from '../utils/colors';

const STAT_CARDS = [
  { key: 'favorites_count', icon: 'heart', color: '#dc2626', i18n: 'userStats.favorites', fallback: 'Favorits' },
  { key: 'routes_count', icon: 'map', color: '#0369a1', i18n: 'userStats.routes', fallback: 'Rutes' },
  { key: 'proposals_count', icon: 'add-circle', color: '#16a34a', i18n: 'userStats.proposals', fallback: 'Propostes' },
  { key: 'diary_count', icon: 'book', color: '#7c3aed', i18n: 'userStats.diary', fallback: 'Diari' },
  { key: 'ratings_count', icon: 'star', color: '#fbbf24', i18n: 'userStats.ratings', fallback: 'Valoracions' },
  { key: 'notes_count', icon: 'document-text', color: '#475569', i18n: 'userStats.notes', fallback: 'Notes' },
  { key: 'photos_count', icon: 'camera', color: '#be185d', i18n: 'userStats.photos', fallback: 'Fotos' },
];

export default function UserStatsScreen() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getUserStats()
      .then(setStats)
      .catch(() => setStats(null))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  const s = stats || {
    favorites_count: 0, routes_count: 0, proposals_count: 0,
    diary_count: 0, ratings_count: 0, notes_count: 0, photos_count: 0,
    countries_visited: [], regions_visited: [], member_since: null,
  };

  const memberSinceText = s.member_since
    ? new Date(s.member_since).toLocaleDateString(undefined, { year: 'numeric', month: 'long' })
    : null;

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 12, paddingBottom: 24 }}>
      {/* Header amb avatar */}
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {(user?.nombre || user?.email || '?').charAt(0).toUpperCase()}
          </Text>
        </View>
        <Text style={styles.userName}>{user?.nombre || user?.email}</Text>
        {memberSinceText && (
          <Text style={styles.memberSince}>
            {t('userStats.memberSince', 'Membre des de')} {memberSinceText}
          </Text>
        )}
      </View>

      {/* Stats grid */}
      <View style={styles.grid}>
        {STAT_CARDS.map(card => (
          <View key={card.key} style={styles.card}>
            <View style={[styles.iconCircle, { backgroundColor: card.color + '15' }]}>
              <Ionicons name={card.icon} size={20} color={card.color} />
            </View>
            <Text style={styles.cardValue}>{s[card.key] || 0}</Text>
            <Text style={styles.cardLabel}>{t(card.i18n, card.fallback)}</Text>
          </View>
        ))}
      </View>

      {/* Countries visitats */}
      {s.countries_visited?.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {t('userStats.countriesVisited', 'Països visitats')} ({s.countries_visited.length})
          </Text>
          <View style={styles.chipsRow}>
            {s.countries_visited.map((c, i) => (
              <View key={i} style={styles.chip}>
                <Text style={styles.chipText}>{c}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Regions visitades */}
      {s.regions_visited?.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {t('userStats.regionsVisited', 'Regions visitades')} ({s.regions_visited.length})
          </Text>
          <View style={styles.chipsRow}>
            {s.regions_visited.map((r, i) => (
              <View key={i} style={[styles.chip, styles.chipSecondary]}>
                <Text style={styles.chipText}>{r}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* No stats fallback */}
      {!stats && (
        <View style={styles.emptyNote}>
          <Ionicons name="information-circle-outline" size={20} color={COLORS.textSecondary} />
          <Text style={styles.emptyNoteText}>
            {t('userStats.emptyHint', "Comença a explorar monumentos per omplir les teves estadístiques.")}
          </Text>
        </View>
      )}
    </ScrollView>
  );
}

const CARD_WIDTH = '48%';

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.background },
  header: {
    alignItems: 'center',
    padding: 20,
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  avatar: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: COLORS.primary,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 10,
  },
  avatarText: { color: '#fff', fontSize: 26, fontWeight: '700' },
  userName: { fontSize: 17, fontWeight: '700', color: COLORS.textPrimary },
  memberSince: { fontSize: 12, color: COLORS.textSecondary, marginTop: 4 },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'space-between',
  },
  card: {
    width: CARD_WIDTH,
    backgroundColor: COLORS.surface,
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  iconCircle: {
    width: 40, height: 40, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 8,
  },
  cardValue: { fontSize: 22, fontWeight: '700', color: COLORS.textPrimary },
  cardLabel: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
  section: {
    marginTop: 16,
    backgroundColor: COLORS.surface,
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: 10,
  },
  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: {
    paddingHorizontal: 10, paddingVertical: 5,
    backgroundColor: COLORS.primary + '15',
    borderRadius: 12,
  },
  chipSecondary: { backgroundColor: COLORS.borderLight },
  chipText: { fontSize: 12, fontWeight: '600', color: COLORS.textPrimary },
  emptyNote: {
    flexDirection: 'row',
    gap: 8,
    backgroundColor: '#fef3c7',
    padding: 12,
    borderRadius: 10,
    marginTop: 16,
    alignItems: 'flex-start',
  },
  emptyNoteText: { flex: 1, fontSize: 13, color: '#7c2d12', lineHeight: 18 },
});
