import { useState, useMemo } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, FlatList, Modal,
  StyleSheet, SafeAreaView, KeyboardAvoidingView, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { COLORS } from '../utils/colors';

function removeAccents(str) {
  return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

function matchSearch(text, query) {
  return removeAccents(text).toLowerCase().includes(removeAccents(query).toLowerCase());
}

export default function SearchableSelect({ value, onChange, options = [], placeholder = 'Todos', label }) {
  const { t } = useTranslation();
  const [visible, setVisible] = useState(false);
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    if (!search) return options;
    return options.filter(o => matchSearch(o.label || o.value, search));
  }, [options, search]);

  const selectedOption = options.find(o => o.value === value);
  const selectedLabel = selectedOption?.label || selectedOption?.value || '';

  const handleSelect = (val) => {
    onChange(val);
    setVisible(false);
    setSearch('');
  };

  const handleClear = () => {
    onChange('');
    setSearch('');
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={[styles.optionItem, item.value === value && styles.optionSelected]}
      onPress={() => handleSelect(item.value)}
    >
      <Text style={[styles.optionText, item.value === value && styles.optionTextSelected]}>
        {item.label || item.value}
      </Text>
      {item.count != null && (
        <Text style={styles.optionCount}>{item.count.toLocaleString()}</Text>
      )}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      <TouchableOpacity
        style={[styles.trigger, value ? styles.triggerActive : null]}
        onPress={() => setVisible(true)}
      >
        <Text style={[styles.triggerText, !value && styles.triggerPlaceholder]} numberOfLines={1}>
          {selectedLabel || placeholder}
        </Text>
        {value ? (
          <TouchableOpacity onPress={handleClear} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Ionicons name="close-circle" size={18} color={COLORS.textSecondary} />
          </TouchableOpacity>
        ) : (
          <Ionicons name="chevron-down" size={18} color={COLORS.textSecondary} />
        )}
      </TouchableOpacity>

      <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.modal}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{label || placeholder}</Text>
            <TouchableOpacity onPress={() => { setVisible(false); setSearch(''); }}>
              <Ionicons name="close" size={24} color={COLORS.textPrimary} />
            </TouchableOpacity>
          </View>

          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={styles.modalBody}
          >
            <View style={styles.searchBox}>
              <Ionicons name="search" size={18} color={COLORS.textSecondary} />
              <TextInput
                style={styles.searchInput}
                value={search}
                onChangeText={setSearch}
                placeholder={t('select.searchPlaceholder')}
                placeholderTextColor={COLORS.textSecondary}
                autoFocus
              />
              {search ? (
                <TouchableOpacity onPress={() => setSearch('')}>
                  <Ionicons name="close-circle" size={18} color={COLORS.textSecondary} />
                </TouchableOpacity>
              ) : null}
            </View>

            <TouchableOpacity
              style={[styles.optionItem, styles.defaultOption]}
              onPress={() => handleSelect('')}
            >
              <Text style={styles.defaultOptionText}>{placeholder}</Text>
            </TouchableOpacity>

            <FlatList
              data={filtered}
              renderItem={renderItem}
              keyExtractor={item => item.value}
              keyboardShouldPersistTaps="handled"
              ListEmptyComponent={
                <Text style={styles.emptyText}>{t('select.noResults')}</Text>
              }
            />
          </KeyboardAvoidingView>
        </SafeAreaView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 12,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 6,
  },
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    minHeight: 44,
  },
  triggerActive: {
    borderColor: COLORS.primary,
  },
  triggerText: {
    flex: 1,
    fontSize: 14,
    color: COLORS.textPrimary,
    marginRight: 8,
  },
  triggerPlaceholder: {
    color: COLORS.textSecondary,
  },
  modal: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  modalBody: {
    flex: 1,
  },
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
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    marginLeft: 8,
    color: COLORS.textPrimary,
    paddingVertical: 4,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.borderLight,
    backgroundColor: COLORS.surface,
  },
  optionSelected: {
    backgroundColor: COLORS.primary + '10',
  },
  optionText: {
    fontSize: 15,
    color: COLORS.textPrimary,
    flex: 1,
  },
  optionTextSelected: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  optionCount: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginLeft: 8,
  },
  defaultOption: {
    backgroundColor: COLORS.borderLight,
  },
  defaultOptionText: {
    fontSize: 15,
    color: COLORS.textSecondary,
    fontStyle: 'italic',
  },
  emptyText: {
    textAlign: 'center',
    color: COLORS.textSecondary,
    padding: 24,
    fontSize: 15,
  },
});
