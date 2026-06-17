import { View, Text, ScrollView, TouchableOpacity, Switch, Modal, StyleSheet, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useApp } from '../context/AppContext';
import SearchableSelect from './SearchableSelect';
import { COLORS } from '../utils/colors';

// Mapeig pais (valor BD) -> imatge bandera. Quan s'amplii la BD amb nous països,
// afegir aqui el nou par + copiar imatge a assets/flags/.
const COUNTRY_FLAGS = {
  'España': require('../../assets/flags/es.jpg'),
  'Italia': require('../../assets/flags/it.jpg'),
  'Francia': require('../../assets/flags/fr.jpg'),
  'Portugal': require('../../assets/flags/pt.jpg'),
  'Alemania': require('../../assets/flags/de.jpg'),
  'Reino Unido': require('../../assets/flags/en.jpg'),
  'Austria': require('../../assets/flags/at.jpg'),
  'Suiza': require('../../assets/flags/ch.jpg'),
  'Rumanía': require('../../assets/flags/ro.jpg'),
  'Líbano': require('../../assets/flags/lb.jpg'),
  'Túnez': require('../../assets/flags/tn.jpg'),
  'Estados Unidos': require('../../assets/flags/us.jpg'),
  'México': require('../../assets/flags/mx.jpg'),
};

const HN_PILLS = [
  { id: 'roja', color: '#dc2626', activeBg: '#dc2626' },
  { id: 'verde', color: '#16a34a', activeBg: '#16a34a' },
  { id: 'negra', color: '#1f2937', activeBg: '#1f2937' },
];

export default function FilterModal({ visible, onClose, onSearch }) {
  const { t } = useTranslation();
  const { filters, filtros, setFilter, resetFilters, reloadFiltros } = useApp();

  // Traduce las opciones de filtro manteniendo el value original (español/BD)
  const translateOptions = (options, i18nPrefix) =>
    options?.map(o => ({ ...o, label: t(`${i18nPrefix}.${o.value}`, o.value) })) || [];

  if (!filtros) return null;

  // Labels dinámicos según país
  const labels = (() => {
    switch (filters.pais) {
      case 'Portugal': return {
        region: t('filters.portugal.region'),
        provincia: t('filters.portugal.province'),
        municipio: t('filters.portugal.municipality'),
      };
      case 'Francia': return {
        region: t('filters.france.region'),
        provincia: t('filters.france.province'),
        municipio: t('filters.france.municipality'),
      };
      case 'Italia': return {
        region: t('filters.italy.region'),
        provincia: t('filters.italy.province'),
        municipio: t('filters.italy.municipality'),
      };
      default: return {
        region: t('filters.region'),
        provincia: t('filters.province'),
        municipio: t('filters.municipality'),
      };
    }
  })();

  // Filtros en cascada
  const regionesFiltradas = filters.pais
    ? filtros.regiones.filter(r => r.pais === filters.pais)
    : filtros.regiones;

  const provinciasFiltradas = (filtros.provincias || []).filter(p =>
    (!filters.pais || p.pais === filters.pais) &&
    (!filters.region || p.region === filters.region)
  );

  const municipiosFiltrados = (filtros.municipios || []).filter(m =>
    (!filters.pais || m.pais === filters.pais) &&
    (!filters.region || m.region === filters.region) &&
    (!filters.provincia || m.provincia === filters.provincia)
  );

  const handlePaisChange = async (value) => {
    setFilter('pais', value);
    setFilter('region', '');
    setFilter('provincia', '');
    setFilter('municipio', '');
    setFilter('categoria', '');
    setFilter('tipo', '');
    setFilter('estilo', '');
    await reloadFiltros(value, '', '');
  };

  const handleRegionChange = async (value) => {
    setFilter('region', value);
    setFilter('provincia', '');
    setFilter('municipio', '');
    setFilter('categoria', '');
    setFilter('tipo', '');
    setFilter('estilo', '');
    await reloadFiltros(filters.pais, value, '');
  };

  const handleProvinciaChange = async (value) => {
    setFilter('provincia', value);
    setFilter('municipio', '');
    setFilter('categoria', '');
    setFilter('tipo', '');
    setFilter('estilo', '');
    await reloadFiltros(filters.pais, filters.region, value);
  };

  const handleSearch = () => {
    onSearch?.();
    onClose();
  };

  const handleReset = () => {
    resetFilters();
  };

  // Contar filtros activos
  const activeCount = [
    filters.pais, filters.region, filters.provincia, filters.municipio,
    filters.categoria, filters.tipo, filters.estilo, filters.evento,
    filters.solo_wikidata, filters.solo_imagen,
  ].filter(Boolean).length + ((filters.hn_listas || []).length > 0 ? 1 : 0);

  const toggleHnLista = (id) => {
    const curr = filters.hn_listas || [];
    const next = curr.includes(id) ? curr.filter(x => x !== id) : [...curr, id];
    setFilter('hn_listas', next);
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>
            {t('filters.filters')} {activeCount > 0 ? `(${activeCount})` : ''}
          </Text>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={24} color={COLORS.textPrimary} />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent}>
          {/* Ubicación */}
          <Text style={styles.sectionTitle}>{t('filters.location')}</Text>

          {filtros.paises && filtros.paises.length > 1 && (
            <SearchableSelect
              label={t('filters.country')}
              value={filters.pais}
              onChange={handlePaisChange}
              options={translateOptions(filtros.paises, 'filters.countries').map(o => ({
                ...o,
                flag: COUNTRY_FLAGS[o.value] || null,
              }))}
              placeholder={t('filters.allCountries')}
            />
          )}

          <SearchableSelect
            label={labels.region}
            value={filters.region}
            onChange={handleRegionChange}
            options={regionesFiltradas}
            placeholder={t('filters.allRegions')}
          />

          <SearchableSelect
            label={labels.provincia}
            value={filters.provincia}
            onChange={handleProvinciaChange}
            options={provinciasFiltradas}
            placeholder={t('filters.allProvinces')}
          />

          <SearchableSelect
            label={labels.municipio}
            value={filters.municipio}
            onChange={(v) => setFilter('municipio', v)}
            options={municipiosFiltrados}
            placeholder={t('filters.allMunicipalities')}
          />

          {/* Clasificación */}
          <Text style={styles.sectionTitle}>{t('filters.classification')}</Text>

          <SearchableSelect
            label={t('filters.category')}
            value={filters.categoria}
            onChange={(v) => setFilter('categoria', v)}
            options={filtros.categorias}
            placeholder={t('filters.allCategories')}
          />

          <SearchableSelect
            label={t('filters.type')}
            value={filters.tipo}
            onChange={(v) => setFilter('tipo', v)}
            options={filtros.tipos}
            placeholder={t('filters.allTypes')}
          />

          <SearchableSelect
            label={t('filters.style')}
            value={filters.estilo}
            onChange={(v) => setFilter('estilo', v)}
            options={filtros.estilos}
            placeholder={t('filters.allStyles')}
          />

          {filtros.eventos?.length > 0 && (
            <SearchableSelect
              label={t('filters.event')}
              value={filters.evento}
              onChange={(v) => setFilter('evento', v)}
              options={translateOptions(filtros.eventos, 'filters.events')}
              placeholder={t('filters.allEvents')}
            />
          )}

          {/* Opciones */}
          <Text style={styles.sectionTitle}>{t('filters.options')}</Text>

          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>{t('filters.onlyWikipedia')}</Text>
            <Switch
              value={filters.solo_wikidata}
              onValueChange={(v) => setFilter('solo_wikidata', v)}
              trackColor={{ false: COLORS.border, true: COLORS.primary + '60' }}
              thumbColor={filters.solo_wikidata ? COLORS.primary : '#f4f3f4'}
            />
          </View>

          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>{t('filters.onlyImage')}</Text>
            <Switch
              value={filters.solo_imagen}
              onValueChange={(v) => setFilter('solo_imagen', v)}
              trackColor={{ false: COLORS.border, true: COLORS.primary + '60' }}
              thumbColor={filters.solo_imagen ? COLORS.primary : '#f4f3f4'}
            />
          </View>

          {/* Pills Hispania Nostra (multi-select) */}
          <View style={styles.hnBlock}>
            <Text style={styles.hnLabel}>🛡️ {t('filters.hnListsLabel', 'Lista Roja de Hispania Nostra')}</Text>
            <View style={styles.hnPillsRow}>
              {HN_PILLS.map(p => {
                const active = (filters.hn_listas || []).includes(p.id);
                const labelKey = `filters.hn${p.id.charAt(0).toUpperCase()}${p.id.slice(1)}`;
                const fallback = p.id === 'roja' ? 'Roja' : p.id === 'verde' ? 'Verde' : 'Negra';
                return (
                  <TouchableOpacity
                    key={p.id}
                    style={[
                      styles.hnPill,
                      { borderColor: p.color },
                      active && { backgroundColor: p.activeBg, borderColor: p.activeBg },
                    ]}
                    onPress={() => toggleHnLista(p.id)}
                  >
                    <View style={[
                      styles.hnPillDot,
                      { backgroundColor: active ? 'rgba(255,255,255,0.85)' : p.color },
                    ]} />
                    <Text style={[
                      styles.hnPillText,
                      { color: active ? '#fff' : p.color },
                    ]}>{t(labelKey, fallback)}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity style={styles.resetButton} onPress={handleReset}>
            <Text style={styles.resetText}>{t('filters.reset')}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.searchButton} onPress={handleSearch}>
            <Ionicons name="search" size={18} color="#fff" />
            <Text style={styles.searchText}>{t('filters.search')}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  body: {
    flex: 1,
  },
  bodyContent: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.dark,
    marginTop: 8,
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.surface,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  switchLabel: {
    fontSize: 14,
    color: COLORS.textPrimary,
  },
  hnBlock: {
    marginTop: 12,
    paddingHorizontal: 4,
  },
  hnLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: 8,
  },
  hnPillsRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  hnPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    borderWidth: 1.5,
    backgroundColor: COLORS.surface,
  },
  hnPillDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  hnPillText: {
    fontSize: 13,
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  resetButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    backgroundColor: COLORS.borderLight,
    alignItems: 'center',
  },
  resetText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  searchButton: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 10,
    backgroundColor: COLORS.primary,
  },
  searchText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
});
