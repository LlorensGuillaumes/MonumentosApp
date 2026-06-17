import { useEffect, useState, useCallback } from 'react';
import {
  View, Text, TextInput, FlatList, TouchableOpacity, ActivityIndicator,
  StyleSheet, SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { getPersonas, getPersonaBienes } from '../services/api';
import { COLORS } from '../utils/colors';

export default function AutoresScreen({ navigation }) {
  const { t } = useTranslation();
  const [q, setQ] = useState('');
  const [personas, setPersonas] = useState([]);
  const [loading, setLoading] = useState(false);

  const [selectedQid, setSelectedQid] = useState(null);
  const [selectedNombre, setSelectedNombre] = useState('');
  const [bienes, setBienes] = useState([]);
  const [loadingBienes, setLoadingBienes] = useState(false);

  const fetchPersonas = useCallback(async (query) => {
    setLoading(true);
    try {
      const data = await getPersonas(query ? { q: query, limit: 40 } : { limit: 40 });
      setPersonas(data.personas || []);
    } catch (err) {
      console.error('autores:', err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchPersonas(''); }, [fetchPersonas]);

  // Debounced search
  useEffect(() => {
    const handle = setTimeout(() => fetchPersonas(q.trim()), 300);
    return () => clearTimeout(handle);
  }, [q, fetchPersonas]);

  const verBienes = useCallback(async (qid, nombre) => {
    if (!qid) return;
    setSelectedQid(qid);
    setSelectedNombre(nombre || '');
    setLoadingBienes(true);
    try {
      const data = await getPersonaBienes(qid);
      setBienes(data.bienes || []);
    } catch (err) {
      console.error('bienes autor:', err.message);
      setBienes([]);
    } finally {
      setLoadingBienes(false);
    }
  }, []);

  const back = () => {
    setSelectedQid(null);
    setSelectedNombre('');
    setBienes([]);
  };

  // === VISTA FITXA AUTOR (béns) ===
  if (selectedQid) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={back} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color={COLORS.textPrimary} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.authorName} numberOfLines={1}>
              {selectedNombre || t('autores.author', 'Autor')}
            </Text>
            <Text style={styles.authorCount}>
              {bienes.length} {t('autores.works', 'obres')}
            </Text>
          </View>
        </View>

        {loadingBienes ? (
          <ActivityIndicator color={COLORS.primary} style={{ marginTop: 24 }} />
        ) : (
          <FlatList
            data={bienes}
            keyExtractor={(item, idx) => `${item.id}-${idx}`}
            contentContainerStyle={styles.list}
            ItemSeparatorComponent={() => <View style={styles.sep} />}
            ListEmptyComponent={
              <Text style={styles.empty}>{t('autores.noWorks', 'Sense obres documentades')}</Text>
            }
            renderItem={({ item, index }) => (
              <TouchableOpacity
                style={styles.bienRow}
                onPress={() => navigation.navigate('Detail', { id: item.id })}
              >
                <View style={styles.bienNumber}>
                  <Text style={styles.bienNumberText}>{index + 1}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.bienTitle} numberOfLines={2}>{item.denominacion}</Text>
                  {(item.municipio || item.provincia) && (
                    <Text style={styles.bienSub}>
                      {[item.municipio, item.provincia, item.pais].filter(Boolean).join(', ')}
                    </Text>
                  )}
                  {item.rol && (
                    <Text style={styles.bienRol}>{item.rol}</Text>
                  )}
                </View>
                <Ionicons name="chevron-forward" size={18} color={COLORS.textSecondary} />
              </TouchableOpacity>
            )}
          />
        )}
      </SafeAreaView>
    );
  }

  // === VISTA LLISTAT AUTORS ===
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.searchBox}>
        <Ionicons name="search" size={18} color={COLORS.textSecondary} />
        <TextInput
          style={styles.searchInput}
          value={q}
          onChangeText={setQ}
          placeholder={t('autores.searchPlaceholder', 'Buscar autors (Gaudí, Cañas...)')}
          placeholderTextColor={COLORS.textSecondary}
        />
        {q ? (
          <TouchableOpacity onPress={() => setQ('')}>
            <Ionicons name="close-circle" size={18} color={COLORS.textSecondary} />
          </TouchableOpacity>
        ) : null}
      </View>

      {loading ? (
        <ActivityIndicator color={COLORS.primary} style={{ marginTop: 24 }} />
      ) : (
        <FlatList
          data={personas}
          keyExtractor={(item, idx) => `${item.qid || item.nombre}-${idx}`}
          contentContainerStyle={styles.list}
          ItemSeparatorComponent={() => <View style={styles.sep} />}
          ListEmptyComponent={
            <Text style={styles.empty}>
              {q ? t('autores.noResults', 'Cap autor trobat') : t('autores.empty', 'Sense autors')}
            </Text>
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.personaRow}
              disabled={!item.qid}
              onPress={() => verBienes(item.qid, item.nombre)}
            >
              <View style={styles.avatar}>
                <Ionicons name="person" size={20} color={COLORS.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.personaName}>{item.nombre}</Text>
                {item.roles && (
                  <Text style={styles.personaRoles} numberOfLines={1}>{item.roles}</Text>
                )}
              </View>
              <View style={styles.countBadge}>
                <Text style={styles.countText}>{item.n_bienes}</Text>
              </View>
            </TouchableOpacity>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    gap: 8,
  },
  backBtn: { padding: 4 },
  authorName: { fontSize: 16, fontWeight: '700', color: COLORS.textPrimary },
  authorCount: { fontSize: 13, color: COLORS.textSecondary },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    margin: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 8,
  },
  searchInput: { flex: 1, fontSize: 15, color: COLORS.textPrimary, paddingVertical: 4 },
  list: { paddingHorizontal: 12, paddingBottom: 16 },
  sep: { height: 8 },
  empty: { textAlign: 'center', color: COLORS.textSecondary, marginTop: 24, fontSize: 14 },
  personaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    padding: 12,
    borderRadius: 10,
    gap: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  avatar: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: COLORS.primary + '15',
    alignItems: 'center', justifyContent: 'center',
  },
  personaName: { fontSize: 15, fontWeight: '600', color: COLORS.textPrimary },
  personaRoles: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
  countBadge: {
    paddingHorizontal: 10, paddingVertical: 4,
    backgroundColor: COLORS.primary + '20',
    borderRadius: 12,
  },
  countText: { fontSize: 13, fontWeight: '700', color: COLORS.primary },
  bienRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    padding: 12,
    borderRadius: 10,
    gap: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  bienNumber: {
    width: 30, height: 30, borderRadius: 15,
    backgroundColor: COLORS.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  bienNumberText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  bienTitle: { fontSize: 14, fontWeight: '600', color: COLORS.textPrimary },
  bienSub: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
  bienRol: { fontSize: 11, color: COLORS.primary, marginTop: 2, fontStyle: 'italic' },
});
