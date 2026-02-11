import { View, Text, TouchableOpacity, Modal, SafeAreaView, StyleSheet } from 'react-native';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../utils/colors';

const LANGUAGES = [
  { code: 'es', label: 'Español' },
  { code: 'en', label: 'English' },
  { code: 'fr', label: 'Français' },
  { code: 'pt', label: 'Português' },
  { code: 'ca', label: 'Català' },
  { code: 'eu', label: 'Euskara' },
  { code: 'gl', label: 'Galego' },
];

export default function LanguageSelector() {
  const { i18n } = useTranslation();
  const [visible, setVisible] = useState(false);

  const currentLang = i18n.language?.split('-')[0] || 'es';
  const current = LANGUAGES.find(l => l.code === currentLang) || LANGUAGES[0];

  const handleSelect = (code) => {
    i18n.changeLanguage(code);
    setVisible(false);
  };

  return (
    <View style={styles.wrapper}>
      <TouchableOpacity style={styles.trigger} onPress={() => setVisible(true)}>
        <Ionicons name="language" size={16} color="#fff" />
        <Text style={styles.triggerLabel}>{current.label}</Text>
        <Ionicons name="chevron-down" size={14} color="rgba(255,255,255,0.7)" />
      </TouchableOpacity>

      <Modal visible={visible} animationType="fade" transparent>
        <TouchableOpacity
          style={styles.overlay}
          activeOpacity={1}
          onPress={() => setVisible(false)}
        >
          <SafeAreaView>
            <View style={styles.dropdown}>
              <Text style={styles.dropdownTitle}>Idioma / Language</Text>
              {LANGUAGES.map(({ code, label }) => (
                <TouchableOpacity
                  key={code}
                  style={[styles.option, currentLang === code && styles.optionActive]}
                  onPress={() => handleSelect(code)}
                >
                  <Text style={styles.optionCode}>{code.toUpperCase()}</Text>
                  <Text style={[styles.optionLabel, currentLang === code && styles.optionLabelActive]}>
                    {label}
                  </Text>
                  {currentLang === code && (
                    <Ionicons name="checkmark" size={18} color={COLORS.primary} />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </SafeAreaView>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginRight: 12,
  },
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  triggerLabel: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '500',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
    paddingTop: 100,
    paddingRight: 16,
  },
  dropdown: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    paddingVertical: 6,
    minWidth: 200,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  dropdownTitle: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '600',
    paddingHorizontal: 14,
    paddingVertical: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  optionActive: {
    backgroundColor: COLORS.primary + '10',
  },
  optionCode: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textSecondary,
    width: 24,
  },
  optionLabel: {
    flex: 1,
    fontSize: 15,
    color: COLORS.textPrimary,
  },
  optionLabelActive: {
    fontWeight: '600',
    color: COLORS.primary,
  },
});
