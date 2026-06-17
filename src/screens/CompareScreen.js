import { useMemo } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, Image, StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useApp } from '../context/AppContext';
import { COLORS } from '../utils/colors';
import { imageSource } from '../utils/image';

// Camps a comparar (ordre i etiquetes i18n)
const FIELDS = [
  { key: 'categoria', i18n: 'detail.category' },
  { key: 'tipo', i18n: 'detail.type' },
  { key: 'tipo_monumento', i18n: 'detail.tipoMonumento' },
  { key: 'estilo', i18n: 'detail.style' },
  { key: 'periodo', i18n: 'detail.period' },
  { key: 'arquitecto', i18n: 'detail.architect' },
  { key: 'inception', i18n: 'detail.dating' },
  { key: 'material', i18n: 'detail.material' },
  { key: 'altura', i18n: 'detail.height' },
  { key: 'superficie', i18n: 'detail.surface' },
  { key: 'heritage_label', i18n: 'detail.heritageLabel' },
  { key: 'municipio', i18n: 'detail.municipality' },
  { key: 'provincia', i18n: 'detail.province' },
  { key: 'comunidad_autonoma', i18n: 'detail.region' },
  { key: 'pais', i18n: 'detail.country' },
];

const truncate = (s, n = 120) => {
  if (!s) return null;
  const str = String(s);
  return str.length > n ? str.substring(0, n) + '...' : str;
};

export default function CompareScreen({ navigation }) {
  const { t } = useTranslation();
  const { compareList, removeFromCompare, clearCompare } = useApp();

  // Detecta camps amb almenys un valor (no mostrar files buides)
  const visibleFields = useMemo(() => {
    if (!compareList.length) return [];
    return FIELDS.filter(f => compareList.some(m => m[f.key]));
  }, [compareList]);

  if (compareList.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="git-compare-outline" size={56} color={COLORS.textSecondary} />
        <Text style={styles.emptyTitle}>{t('compare.empty', 'Cap monument a comparar')}</Text>
        <Text style={styles.emptySub}>
          {t('compare.emptyHint', 'Afegeix monuments des de la fitxa amb el botó "Comparar".')}
        </Text>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backBtnText}>{t('common.back', 'Tornar')}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} horizontal={false}>
      <View style={styles.headerRow}>
        <Text style={styles.headerTitle}>
          {compareList.length}/3 {t('compare.monuments', 'monuments')}
        </Text>
        <TouchableOpacity onPress={clearCompare} style={styles.clearBtn}>
          <Ionicons name="trash-outline" size={16} color="#dc2626" />
          <Text style={styles.clearText}>{t('compare.clearAll', 'Buidar')}</Text>
        </TouchableOpacity>
      </View>

      {/* Header amb imatges + noms + remove */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.cardsRow}>
        {compareList.map((m) => (
          <View key={m.id} style={styles.cardCol}>
            <TouchableOpacity onPress={() => navigation.navigate('Detail', { id: m.id })}>
              {m.imagen_url ? (
                <Image source={imageSource(m.imagen_url)} style={styles.cardImg} />
              ) : (
                <View style={[styles.cardImg, styles.cardPlaceholder]}>
                  <Ionicons name="image-outline" size={32} color={COLORS.textSecondary} />
                </View>
              )}
            </TouchableOpacity>
            <Text style={styles.cardName} numberOfLines={2}>{m.denominacion}</Text>
            <Text style={styles.cardLoc} numberOfLines={1}>📍 {m.municipio || m.provincia}</Text>
            <TouchableOpacity style={styles.removeBtn} onPress={() => removeFromCompare(m.id)}>
              <Ionicons name="close" size={18} color="#fff" />
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>

      {/* Comparativa per files */}
      <View style={styles.table}>
        {visibleFields.map((f) => (
          <View key={f.key} style={styles.row}>
            <Text style={styles.rowLabel}>{t(f.i18n, f.key)}</Text>
            <View style={styles.rowValues}>
              {compareList.map((m) => (
                <View key={m.id} style={styles.cell}>
                  <Text style={styles.cellText}>
                    {truncate(m[f.key]) || '—'}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const CARD_WIDTH = 200;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 12,
    backgroundColor: COLORS.background,
  },
  emptyTitle: { fontSize: 17, fontWeight: '700', color: COLORS.textPrimary, marginTop: 8 },
  emptySub: { fontSize: 14, color: COLORS.textSecondary, textAlign: 'center' },
  backBtn: {
    marginTop: 12,
    paddingHorizontal: 20, paddingVertical: 10,
    backgroundColor: COLORS.primary, borderRadius: 8,
  },
  backBtnText: { color: '#fff', fontWeight: '600' },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerTitle: { fontSize: 15, fontWeight: '600', color: COLORS.textPrimary },
  clearBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  clearText: { color: '#dc2626', fontSize: 13, fontWeight: '600' },
  cardsRow: { padding: 12 },
  cardCol: {
    width: CARD_WIDTH,
    backgroundColor: COLORS.surface,
    borderRadius: 10,
    padding: 8,
    marginRight: 10,
    position: 'relative',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cardImg: {
    width: CARD_WIDTH - 16,
    height: 120,
    borderRadius: 6,
    backgroundColor: COLORS.borderLight,
  },
  cardPlaceholder: { alignItems: 'center', justifyContent: 'center' },
  cardName: { fontSize: 13, fontWeight: '600', color: COLORS.textPrimary, marginTop: 8 },
  cardLoc: { fontSize: 11, color: COLORS.textSecondary, marginTop: 4 },
  removeBtn: {
    position: 'absolute', top: 4, right: 4,
    width: 26, height: 26, borderRadius: 13,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center', justifyContent: 'center',
  },
  table: { paddingHorizontal: 12, paddingBottom: 24 },
  row: {
    backgroundColor: COLORS.surface,
    marginBottom: 6,
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  rowLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: 6,
  },
  rowValues: { flexDirection: 'row', gap: 8 },
  cell: {
    width: CARD_WIDTH - 16,
    paddingVertical: 4,
  },
  cellText: { fontSize: 13, color: COLORS.textPrimary },
});
