import { View, Text, ScrollView, TouchableOpacity, Switch, Modal, StyleSheet, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useApp } from '../context/AppContext';
import SearchableSelect from './SearchableSelect';
import { COLORS } from '../utils/colors';

export default function FilterModal({ visible, onClose, onSearch }) {
  const { t } = useTranslation();
  const { filters, filtros, setFilter, resetFilters, reloadFiltros } = useApp();

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
    filters.categoria, filters.tipo, filters.estilo,
    filters.solo_wikidata, filters.solo_imagen,
  ].filter(Boolean).length;

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
              options={filtros.paises}
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
