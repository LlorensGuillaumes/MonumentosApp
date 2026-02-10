import { useEffect, useState, useCallback, useRef } from 'react';
import {
  View, Text, TextInput, FlatList, TouchableOpacity,
  ActivityIndicator, StyleSheet, Keyboard,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useApp } from '../context/AppContext';
import { getMonumentos } from '../services/api';
import MonumentoCard from '../components/MonumentoCard';
import FilterModal from '../components/FilterModal';
import { COLORS } from '../utils/colors';

const LIMIT_OPTIONS = [12, 24, 48, 96];

export default function SearchScreen({ navigation, route }) {
  const { t } = useTranslation();
  const { filters, setFilter, setFilters } = useApp();
  const [monumentos, setMonumentos] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(false);
  const [limit, setLimit] = useState(24);
  const [sort, setSort] = useState('nombre_asc');
  const [filtersVisible, setFiltersVisible] = useState(false);
  const [searchText, setSearchText] = useState('');
  const isFirstRender = useRef(true);
  const flatListRef = useRef(null);

  const SORT_OPTIONS = [
    { value: 'nombre_asc', label: t('search.sortAZ') },
    { value: 'nombre_desc', label: t('search.sortZA') },
    { value: 'municipio_asc', label: t('search.municipalityAZ') },
    { value: 'municipio_desc', label: t('search.municipalityZA') },
  ];

  // Recibir parámetros de navegación (desde HomeScreen)
  useEffect(() => {
    if (route.params) {
      const { pais, region } = route.params;
      const newFilters = {};
      if (pais) newFilters.pais = pais;
      if (region) newFilters.region = region;
      if (Object.keys(newFilters).length > 0) {
        setFilters(newFilters);
        doSearch(1, newFilters);
        return;
      }
    }
    doSearch(1);
  }, []);

  const doSearch = useCallback(async (pageNum = 1, overrideFilters) => {
    setLoading(true);
    Keyboard.dismiss();
    try {
      const activeFilters = overrideFilters || filters;
      const data = await getMonumentos({
        ...activeFilters,
        q: searchText,
        page: pageNum,
        limit,
        sort,
      });
      setMonumentos(data.items);
      setTotal(data.total);
      setTotalPages(data.total_pages);
      setPage(pageNum);
    } catch (err) {
      console.error('Error searching:', err);
    } finally {
      setLoading(false);
    }
  }, [filters, searchText, limit, sort]);

  // Re-buscar cuando cambian limit o sort
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    doSearch(1);
  }, [limit, sort]);

  const handleSearch = () => {
    setFilter('q', searchText || '');
    doSearch(1);
  };

  const handlePageChange = (newPage) => {
    doSearch(newPage);
    flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
  };

  // Contar filtros activos
  const activeFilterCount = [
    filters.pais, filters.region, filters.provincia, filters.municipio,
    filters.categoria, filters.tipo, filters.estilo,
    filters.solo_wikidata, filters.solo_imagen,
  ].filter(Boolean).length;

  const renderHeader = () => (
    <View>
      {/* Search Bar */}
      <View style={styles.searchBar}>
        <Ionicons name="search" size={20} color={COLORS.textSecondary} />
        <TextInput
          style={styles.searchInput}
          placeholder={t('filters.searchPlaceholder')}
          placeholderTextColor={COLORS.textSecondary}
          value={searchText}
          onChangeText={setSearchText}
          onSubmitEditing={handleSearch}
          returnKeyType="search"
        />
        {searchText ? (
          <TouchableOpacity onPress={() => { setSearchText(''); setFilter('q', ''); }}>
            <Ionicons name="close-circle" size={20} color={COLORS.textSecondary} />
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Filter & Sort Controls */}
      <View style={styles.controls}>
        <TouchableOpacity
          style={[styles.filterButton, activeFilterCount > 0 && styles.filterButtonActive]}
          onPress={() => setFiltersVisible(true)}
        >
          <Ionicons name="options" size={18} color={activeFilterCount > 0 ? '#fff' : COLORS.textPrimary} />
          <Text style={[styles.filterButtonText, activeFilterCount > 0 && styles.filterButtonTextActive]}>
            {t('filters.filters')} {activeFilterCount > 0 ? `(${activeFilterCount})` : ''}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.searchButton} onPress={handleSearch}>
          <Ionicons name="search" size={18} color="#fff" />
          <Text style={styles.searchButtonText}>{t('filters.search')}</Text>
        </TouchableOpacity>
      </View>

      {/* Results Info */}
      <View style={styles.resultsHeader}>
        <Text style={styles.resultsCount}>
          {loading ? t('search.searching') : t('search.results', { count: total.toLocaleString() })}
        </Text>
        <View style={styles.sortControls}>
          <ScrollableChips
            options={SORT_OPTIONS}
            value={sort}
            onChange={setSort}
          />
        </View>
      </View>

      {/* Limit selector */}
      <View style={styles.limitRow}>
        <Text style={styles.limitLabel}>{t('search.show')}</Text>
        {LIMIT_OPTIONS.map(l => (
          <TouchableOpacity
            key={l}
            style={[styles.limitChip, limit === l && styles.limitChipActive]}
            onPress={() => setLimit(l)}
          >
            <Text style={[styles.limitChipText, limit === l && styles.limitChipTextActive]}>
              {l}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderFooter = () => {
    if (totalPages <= 1) return null;
    return (
      <View style={styles.pagination}>
        <TouchableOpacity
          style={[styles.pageBtn, page === 1 && styles.pageBtnDisabled]}
          onPress={() => page > 1 && handlePageChange(page - 1)}
          disabled={page === 1}
        >
          <Ionicons name="chevron-back" size={18} color={page === 1 ? COLORS.border : COLORS.textPrimary} />
        </TouchableOpacity>

        <Text style={styles.pageInfo}>{page} / {totalPages.toLocaleString()}</Text>

        <TouchableOpacity
          style={[styles.pageBtn, page === totalPages && styles.pageBtnDisabled]}
          onPress={() => page < totalPages && handlePageChange(page + 1)}
          disabled={page === totalPages}
        >
          <Ionicons name="chevron-forward" size={18} color={page === totalPages ? COLORS.border : COLORS.textPrimary} />
        </TouchableOpacity>
      </View>
    );
  };

  const renderEmpty = () => {
    if (loading) return null;
    return (
      <View style={styles.emptyState}>
        <Text style={styles.emptyIcon}>🔍</Text>
        <Text style={styles.emptyTitle}>{t('search.noResults')}</Text>
        <Text style={styles.emptyText}>{t('search.noResultsHint')}</Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <FlatList
        ref={flatListRef}
        data={monumentos}
        keyExtractor={item => String(item.id)}
        renderItem={({ item }) => (
          <View style={styles.cardWrapper}>
            <MonumentoCard
              monumento={item}
              onPress={() => navigation.navigate('Detail', { id: item.id, title: item.denominacion })}
            />
          </View>
        )}
        ListHeaderComponent={renderHeader}
        ListFooterComponent={renderFooter}
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={styles.listContent}
        keyboardShouldPersistTaps="handled"
        numColumns={2}
        columnWrapperStyle={styles.columnWrapper}
      />

      {loading && monumentos.length > 0 && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      )}

      <FilterModal
        visible={filtersVisible}
        onClose={() => setFiltersVisible(false)}
        onSearch={() => doSearch(1)}
      />
    </View>
  );
}

function ScrollableChips({ options, value, onChange }) {
  return (
    <View style={styles.chipsRow}>
      {options.map(opt => (
        <TouchableOpacity
          key={opt.value}
          style={[styles.chip, value === opt.value && styles.chipActive]}
          onPress={() => onChange(opt.value)}
        >
          <Text style={[styles.chipText, value === opt.value && styles.chipTextActive]}>
            {opt.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  listContent: {
    paddingBottom: 20,
  },
  columnWrapper: {
    paddingHorizontal: 12,
    gap: 10,
  },
  cardWrapper: {
    flex: 1,
  },
  // Search bar
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    marginHorizontal: 12,
    marginTop: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: COLORS.textPrimary,
    paddingVertical: 2,
  },
  // Controls
  controls: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    marginTop: 10,
    gap: 10,
  },
  filterButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  filterButtonActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.textPrimary,
  },
  filterButtonTextActive: {
    color: '#fff',
  },
  searchButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: COLORS.primary,
  },
  searchButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  // Results header
  resultsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginTop: 14,
    marginBottom: 4,
  },
  resultsCount: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  sortControls: {
    flexDirection: 'row',
  },
  // Chips
  chipsRow: {
    flexDirection: 'row',
    gap: 4,
  },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    backgroundColor: COLORS.borderLight,
  },
  chipActive: {
    backgroundColor: COLORS.primary,
  },
  chipText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  chipTextActive: {
    color: '#fff',
  },
  // Limit
  limitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginTop: 8,
    marginBottom: 12,
    gap: 6,
  },
  limitLabel: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  limitChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: COLORS.borderLight,
  },
  limitChipActive: {
    backgroundColor: COLORS.primary,
  },
  limitChipText: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  limitChipTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  // Pagination
  pagination: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 16,
  },
  pageBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  pageBtnDisabled: {
    opacity: 0.4,
  },
  pageInfo: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  // Empty
  emptyState: {
    alignItems: 'center',
    paddingVertical: 50,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 6,
  },
  emptyText: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  // Loading overlay
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
