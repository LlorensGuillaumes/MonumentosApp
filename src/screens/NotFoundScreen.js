import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { COLORS } from '../utils/colors';

export default function NotFoundScreen({ navigation }) {
  const { t } = useTranslation();
  return (
    <View style={styles.container}>
      <Ionicons name="compass-outline" size={84} color={COLORS.textSecondary} />
      <Text style={styles.title}>404</Text>
      <Text style={styles.subtitle}>{t('notFound.title', 'Pàgina no trobada')}</Text>
      <Text style={styles.text}>
        {t('notFound.hint', 'La pàgina que busques no existeix o s\'ha mogut.')}
      </Text>
      <TouchableOpacity style={styles.btn} onPress={() => navigation.popToTop()}>
        <Text style={styles.btnText}>{t('notFound.goHome', 'Tornar a l\'inici')}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 12,
    backgroundColor: COLORS.background,
  },
  title: { fontSize: 48, fontWeight: '900', color: COLORS.primary },
  subtitle: { fontSize: 18, fontWeight: '700', color: COLORS.textPrimary },
  text: { fontSize: 14, color: COLORS.textSecondary, textAlign: 'center', lineHeight: 19 },
  btn: {
    marginTop: 16,
    paddingHorizontal: 24, paddingVertical: 12,
    backgroundColor: COLORS.primary, borderRadius: 10,
  },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
});
