import { View, Text, TouchableOpacity, Modal, Image, SafeAreaView, StyleSheet } from 'react-native';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../utils/colors';

const LANGUAGES = [
  { code: 'es', label: 'Español', flag: require('../../assets/flags/es.jpg') },
  { code: 'en', label: 'English', flag: require('../../assets/flags/en.jpg') },
  { code: 'fr', label: 'Français', flag: require('../../assets/flags/fr.jpg') },
  { code: 'pt', label: 'Português', flag: require('../../assets/flags/pt.jpg') },
  { code: 'ca', label: 'Català', flag: require('../../assets/flags/ca.jpg') },
  { code: 'eu', label: 'Euskara', flag: require('../../assets/flags/eu.jpg') },
  { code: 'gl', label: 'Galego', flag: require('../../assets/flags/gl.jpg') },
  { code: 'it', label: 'Italiano', flag: require('../../assets/flags/it.jpg') },
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
        <Image source={current.flag} style={styles.triggerFlag} />
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
              {LANGUAGES.map(({ code, label, flag }) => (
                <TouchableOpacity
                  key={code}
                  style={[styles.option, currentLang === code && styles.optionActive]}
                  onPress={() => handleSelect(code)}
                >
                  <Image source={flag} style={styles.optionFlag} />
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
  triggerFlag: {
    width: 24,
    height: 18,
    borderRadius: 2,
    resizeMode: 'cover',
  },
  optionFlag: {
    width: 26,
    height: 19,
    borderRadius: 2,
    resizeMode: 'cover',
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
