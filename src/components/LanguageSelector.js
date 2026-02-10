import { View, Text, TouchableOpacity, Modal, SafeAreaView, StyleSheet } from 'react-native';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../utils/colors';

const LANGUAGES = [
  { code: 'es', flag: '🇪🇸', label: 'Español' },
  { code: 'en', flag: '🇬🇧', label: 'English' },
  { code: 'fr', flag: '🇫🇷', label: 'Français' },
  { code: 'pt', flag: '🇵🇹', label: 'Português' },
  { code: 'ca', flag: '🏳️', label: 'Català' },
  { code: 'eu', flag: '🏳️', label: 'Euskara' },
  { code: 'gl', flag: '🏳️', label: 'Galego' },
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
    <>
      <TouchableOpacity style={styles.trigger} onPress={() => setVisible(true)}>
        <Text style={styles.triggerFlag}>{current.flag}</Text>
        <Text style={styles.triggerCode}>{current.code.toUpperCase()}</Text>
        <Ionicons name="chevron-down" size={14} color="#fff" />
      </TouchableOpacity>

      <Modal visible={visible} animationType="fade" transparent>
        <TouchableOpacity
          style={styles.overlay}
          activeOpacity={1}
          onPress={() => setVisible(false)}
        >
          <SafeAreaView>
            <View style={styles.dropdown}>
              {LANGUAGES.map(({ code, flag, label }) => (
                <TouchableOpacity
                  key={code}
                  style={[styles.option, currentLang === code && styles.optionActive]}
                  onPress={() => handleSelect(code)}
                >
                  <Text style={styles.optionFlag}>{flag}</Text>
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
    </>
  );
}

const styles = StyleSheet.create({
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  triggerFlag: {
    fontSize: 16,
  },
  triggerCode: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
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
    paddingVertical: 4,
    minWidth: 180,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
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
  optionFlag: {
    fontSize: 20,
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
