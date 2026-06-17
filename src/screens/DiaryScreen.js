import { useEffect, useState, useMemo } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput, FlatList,
  ActivityIndicator, Modal, StyleSheet, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { getDiaryEntries, addDiaryEntry, deleteDiaryEntry } from '../services/api';
import { COLORS } from '../utils/colors';

const FILTERS = ['all', 'month', 'year'];

export default function DiaryScreen({ navigation }) {
  const { t } = useTranslation();
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [sortOrder, setSortOrder] = useState('desc');
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    bien_id: '', fecha: new Date().toISOString().split('T')[0], notas: '', puntuacion: 5,
  });

  useEffect(() => {
    getDiaryEntries()
      .then(data => setEntries(Array.isArray(data) ? data : data?.items || []))
      .catch(() => setEntries([]))
      .finally(() => setLoading(false));
  }, []);

  const filteredEntries = useMemo(() => {
    let res = entries.filter(e => {
      if (filter === 'all') return true;
      const d = new Date(e.fecha);
      const now = new Date();
      if (filter === 'month') return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      if (filter === 'year') return d.getFullYear() === now.getFullYear();
      return true;
    });
    res = [...res].sort((a, b) => sortOrder === 'desc'
      ? new Date(b.fecha) - new Date(a.fecha)
      : new Date(a.fecha) - new Date(b.fecha));
    return res;
  }, [entries, filter, sortOrder]);

  const stats = useMemo(() => ({
    total: entries.length,
    thisYear: entries.filter(e => new Date(e.fecha).getFullYear() === new Date().getFullYear()).length,
    uniqueRegions: new Set(entries.map(e => e.comunidad_autonoma).filter(Boolean)).size,
  }), [entries]);

  const handleSubmit = async () => {
    if (!form.bien_id) {
      Alert.alert(t('diary.errorNoMonument', 'Falta el ID del monument'));
      return;
    }
    setSubmitting(true);
    try {
      const entry = await addDiaryEntry(form);
      setEntries(prev => [entry, ...prev]);
      setForm({ bien_id: '', fecha: new Date().toISOString().split('T')[0], notas: '', puntuacion: 5 });
      setShowForm(false);
    } catch (err) {
      Alert.alert(err.response?.data?.error || t('diary.errorSave', 'Error al desar'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = (id) => {
    Alert.alert(
      t('diary.confirmDelete', 'Eliminar entrada?'),
      '',
      [
        { text: t('common.cancel', 'Cancel·lar'), style: 'cancel' },
        {
          text: t('diary.delete', 'Eliminar'),
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteDiaryEntry(id);
              setEntries(prev => prev.filter(e => e.id !== id));
            } catch { /* ignore */ }
          },
        },
      ],
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Stats cards */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{stats.total}</Text>
          <Text style={styles.statLabel}>{t('diary.totalVisits', 'Visites')}</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{stats.thisYear}</Text>
          <Text style={styles.statLabel}>{t('diary.thisYear', 'Aquest any')}</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{stats.uniqueRegions}</Text>
          <Text style={styles.statLabel}>{t('diary.regions', 'Regions')}</Text>
        </View>
      </View>

      {/* Filter bar */}
      <View style={styles.filterBar}>
        <View style={styles.filterPills}>
          {FILTERS.map(f => (
            <TouchableOpacity
              key={f}
              style={[styles.pill, filter === f && styles.pillActive]}
              onPress={() => setFilter(f)}
            >
              <Text style={[styles.pillText, filter === f && styles.pillTextActive]}>
                {t(`diary.filter_${f}`, f === 'all' ? 'Tot' : f === 'month' ? 'Mes' : 'Any')}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        <TouchableOpacity onPress={() => setSortOrder(s => s === 'desc' ? 'asc' : 'desc')} style={styles.sortBtn}>
          <Ionicons name={sortOrder === 'desc' ? 'arrow-down' : 'arrow-up'} size={14} color={COLORS.textSecondary} />
          <Text style={styles.sortText}>{t('diary.sortDate', 'Data')}</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={filteredEntries}
        keyExtractor={e => String(e.id)}
        contentContainerStyle={styles.list}
        ItemSeparatorComponent={() => <View style={styles.sep} />}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="book-outline" size={48} color={COLORS.textSecondary} />
            <Text style={styles.emptyText}>{t('diary.empty', 'Encara no tens entrades al diari')}</Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.entry}>
            <View style={styles.entryDate}>
              <Text style={styles.entryDay}>{new Date(item.fecha).getDate()}</Text>
              <Text style={styles.entryMonth}>
                {new Date(item.fecha).toLocaleDateString(undefined, { month: 'short', year: '2-digit' })}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <TouchableOpacity onPress={() => item.bien_id && navigation.navigate('Detail', { id: item.bien_id })}>
                <Text style={styles.entryName} numberOfLines={2}>
                  {item.denominacion || `#${item.bien_id}`}
                </Text>
              </TouchableOpacity>
              {item.municipio && (
                <Text style={styles.entryLoc} numberOfLines={1}>
                  📍 {[item.municipio, item.comunidad_autonoma].filter(Boolean).join(', ')}
                </Text>
              )}
              {item.notas && <Text style={styles.entryNotes} numberOfLines={3}>{item.notas}</Text>}
              <Text style={styles.entryRating}>
                {'★'.repeat(item.puntuacion || 0)}{'☆'.repeat(5 - (item.puntuacion || 0))}
              </Text>
            </View>
            <TouchableOpacity onPress={() => handleDelete(item.id)} style={styles.deleteBtn}>
              <Ionicons name="close" size={18} color={COLORS.textSecondary} />
            </TouchableOpacity>
          </View>
        )}
      />

      {/* FAB add */}
      <TouchableOpacity style={styles.fab} onPress={() => setShowForm(true)}>
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>

      {/* Modal afegir entrada */}
      <Modal visible={showForm} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setShowForm(false)}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalContainer}
        >
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{t('diary.addEntry', 'Nova entrada')}</Text>
            <TouchableOpacity onPress={() => setShowForm(false)}>
              <Ionicons name="close" size={24} color={COLORS.textPrimary} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalBody} contentContainerStyle={{ padding: 16 }}>
            <Text style={styles.label}>{t('diary.monumentId', "ID del monument")}</Text>
            <TextInput
              style={styles.input}
              value={form.bien_id}
              onChangeText={v => setForm(f => ({ ...f, bien_id: v }))}
              placeholder="Ex: 230187"
              keyboardType="number-pad"
            />

            <Text style={styles.label}>{t('diary.visitDate', 'Data de visita')}</Text>
            <TextInput
              style={styles.input}
              value={form.fecha}
              onChangeText={v => setForm(f => ({ ...f, fecha: v }))}
              placeholder="YYYY-MM-DD"
            />

            <Text style={styles.label}>{t('diary.rating', 'Valoració')}</Text>
            <View style={styles.starsRow}>
              {[1, 2, 3, 4, 5].map(n => (
                <TouchableOpacity key={n} onPress={() => setForm(f => ({ ...f, puntuacion: n }))}>
                  <Ionicons
                    name={n <= form.puntuacion ? 'star' : 'star-outline'}
                    size={28}
                    color={n <= form.puntuacion ? '#fbbf24' : COLORS.textSecondary}
                  />
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.label}>{t('diary.notes', 'Notes')}</Text>
            <TextInput
              style={[styles.input, { height: 100, textAlignVertical: 'top' }]}
              value={form.notas}
              onChangeText={v => setForm(f => ({ ...f, notas: v }))}
              placeholder={t('diary.notesPlaceholder', 'La meva impressió...')}
              multiline
            />

            <TouchableOpacity
              style={[styles.saveBtn, submitting && { opacity: 0.6 }]}
              onPress={handleSubmit}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.saveBtnText}>{t('diary.save', 'Desar')}</Text>
              )}
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  statsRow: { flexDirection: 'row', padding: 12, gap: 8 },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: 10,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  statValue: { fontSize: 22, fontWeight: '700', color: COLORS.primary },
  statLabel: { fontSize: 11, color: COLORS.textSecondary, marginTop: 4, textTransform: 'uppercase' },
  filterBar: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingBottom: 8,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  filterPills: { flexDirection: 'row', gap: 6 },
  pill: {
    paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: 14, backgroundColor: COLORS.surface,
    borderWidth: 1, borderColor: COLORS.border,
  },
  pillActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  pillText: { fontSize: 12, color: COLORS.textSecondary, fontWeight: '600' },
  pillTextActive: { color: '#fff' },
  sortBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  sortText: { fontSize: 12, color: COLORS.textSecondary },
  list: { padding: 12, paddingBottom: 80 },
  sep: { height: 8 },
  emptyContainer: { alignItems: 'center', marginTop: 40, gap: 12 },
  emptyText: { fontSize: 14, color: COLORS.textSecondary, textAlign: 'center', paddingHorizontal: 24 },
  entry: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    padding: 12,
    borderRadius: 10,
    gap: 10,
    borderWidth: 1, borderColor: COLORS.border,
  },
  entryDate: {
    width: 50,
    alignItems: 'center',
    backgroundColor: COLORS.primary + '10',
    paddingVertical: 6,
    borderRadius: 8,
  },
  entryDay: { fontSize: 20, fontWeight: '700', color: COLORS.primary },
  entryMonth: { fontSize: 10, color: COLORS.textSecondary, textTransform: 'uppercase' },
  entryName: { fontSize: 14, fontWeight: '600', color: COLORS.textPrimary },
  entryLoc: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
  entryNotes: { fontSize: 13, color: COLORS.textPrimary, marginTop: 6, lineHeight: 17 },
  entryRating: { fontSize: 13, color: '#fbbf24', marginTop: 4 },
  deleteBtn: { padding: 4 },
  fab: {
    position: 'absolute',
    bottom: 24, right: 24,
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: COLORS.primary,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 6,
  },
  modalContainer: { flex: 1, backgroundColor: COLORS.background },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  modalTitle: { fontSize: 17, fontWeight: '700', color: COLORS.textPrimary },
  modalBody: { flex: 1 },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 6,
    marginTop: 12,
  },
  input: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    padding: 12,
    fontSize: 15,
    color: COLORS.textPrimary,
  },
  starsRow: { flexDirection: 'row', gap: 8, marginVertical: 4 },
  saveBtn: {
    marginTop: 20,
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  saveBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
