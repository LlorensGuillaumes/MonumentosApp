import { useState, useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, ActivityIndicator,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { getMisPropuestas } from '../services/api';
import { COLORS } from '../utils/colors';

const STATUS_COLORS = {
  pendiente: { bg: '#fefcbf', text: '#975a16' },
  aprobada: { bg: '#c6f6d5', text: '#276749' },
  rechazada: { bg: '#fed7d7', text: '#c53030' },
};

export default function MyProposalsScreen({ navigation }) {
  const { t } = useTranslation();
  const [propuestas, setPropuestas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async (p = 1, isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      const data = await getMisPropuestas({ page: p, limit: 20 });
      setPropuestas(data.items);
      setTotalPages(data.pages);
      setPage(data.page);
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData(1);
  }, [fetchData]);

  const statusLabel = (estado) => {
    const map = { pendiente: t('proposal.pending'), aprobada: t('proposal.approved'), rechazada: t('proposal.rejected') };
    return map[estado] || estado;
  };

  const renderItem = ({ item }) => {
    const colors = STATUS_COLORS[item.estado] || STATUS_COLORS.pendiente;
    return (
      <View style={styles.card}>
        <View style={styles.cardTop}>
          <Text style={styles.cardTitle} numberOfLines={2}>{item.denominacion}</Text>
          <View style={[styles.badge, { backgroundColor: colors.bg }]}>
            <Text style={[styles.badgeText, { color: colors.text }]}>{statusLabel(item.estado)}</Text>
          </View>
        </View>
        <View style={styles.cardMeta}>
          <Text style={styles.metaText}>{item.pais}</Text>
          {item.municipio ? <Text style={styles.metaText}> · {item.municipio}</Text> : null}
          <Text style={styles.metaDate}> · {new Date(item.created_at).toLocaleDateString()}</Text>
        </View>
        {item.estado === 'rechazada' && item.notas_admin ? (
          <View style={styles.notesBox}>
            <Text style={styles.notesLabel}>{t('proposal.adminNotes')}:</Text>
            <Text style={styles.notesText}>{item.notas_admin}</Text>
          </View>
        ) : null}
        {item.estado === 'aprobada' && item.bien_id ? (
          <TouchableOpacity onPress={() => navigation.navigate('Detail', { id: item.bien_id, title: item.denominacion })}>
            <Text style={styles.viewLink}>{t('proposal.viewMonument')}</Text>
          </TouchableOpacity>
        ) : null}
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <FlatList
      style={styles.container}
      contentContainerStyle={propuestas.length === 0 ? styles.emptyContainer : styles.listContent}
      data={propuestas}
      keyExtractor={item => String(item.id)}
      renderItem={renderItem}
      refreshing={refreshing}
      onRefresh={() => fetchData(1, true)}
      ListEmptyComponent={
        <View style={styles.empty}>
          <Text style={styles.emptyText}>{t('proposal.noProposals')}</Text>
        </View>
      }
    />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  listContent: { padding: 12, gap: 10 },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  card: {
    backgroundColor: COLORS.surface, borderRadius: 10,
    padding: 14, borderWidth: 1, borderColor: COLORS.border,
  },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 },
  cardTitle: { flex: 1, fontSize: 15, fontWeight: '600', color: COLORS.textPrimary },
  badge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 10 },
  badgeText: { fontSize: 11, fontWeight: '700' },
  cardMeta: { flexDirection: 'row', marginTop: 6, flexWrap: 'wrap' },
  metaText: { fontSize: 13, color: COLORS.textSecondary },
  metaDate: { fontSize: 13, color: COLORS.textSecondary, opacity: 0.7 },
  notesBox: {
    marginTop: 8, padding: 10, backgroundColor: '#fff5f5',
    borderRadius: 6, borderWidth: 1, borderColor: '#feb2b2',
  },
  notesLabel: { fontSize: 12, fontWeight: '600', color: '#c53030' },
  notesText: { fontSize: 13, color: '#c53030', marginTop: 2 },
  viewLink: { marginTop: 8, fontSize: 14, fontWeight: '600', color: COLORS.primary },
  empty: { alignItems: 'center' },
  emptyText: { fontSize: 15, color: COLORS.textSecondary },
});
