import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { COLORS } from '../utils/colors';

const PLANS = [
  {
    id: 'free',
    name: 'Free',
    price: '0€',
    period: '',
    color: COLORS.textSecondary,
    features: [
      { ok: true, text: 'unlimitedMonuments' },
      { ok: true, text: 'allMaps' },
      { ok: true, text: 'favorites' },
      { ok: true, text: 'diary' },
      { ok: false, text: 'noRoutePlanner' },
      { ok: false, text: 'noPdfExport' },
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    price: '4,99€',
    period: '/mes',
    color: COLORS.primary,
    highlight: true,
    features: [
      { ok: true, text: 'everythingFree' },
      { ok: true, text: 'routePlanner' },
      { ok: true, text: 'pdfExport' },
      { ok: true, text: 'gpxKmlExport' },
      { ok: true, text: 'noAds' },
      { ok: true, text: 'support' },
    ],
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: '—',
    period: '',
    color: '#7c3aed',
    features: [
      { ok: true, text: 'everythingPro' },
      { ok: true, text: 'customDeployment' },
      { ok: true, text: 'sla' },
      { ok: true, text: 'dedicatedSupport' },
    ],
  },
];

export default function PricingScreen({ navigation }) {
  const { t } = useTranslation();
  const { user } = useAuth();

  const handleAction = (plan) => {
    if (!user) {
      Alert.alert(t('pricing.loginFirst', 'Cal iniciar sessió'));
      navigation.navigate('Login');
      return;
    }
    if (plan.id === 'free') {
      navigation.popToTop();
      return;
    }
    Alert.alert(
      t('pricing.comingSoon', 'Pròximament'),
      t('pricing.comingSoonHint', 'Els plans Pro/Enterprise es desplegaran ben aviat.'),
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 12, paddingBottom: 24 }}>
      <Text style={styles.heading}>{t('pricing.title', 'Plans i preus')}</Text>
      <Text style={styles.subheading}>
        {t('pricing.subtitle', 'Tria el pla que millor s\'adapti a tu')}
      </Text>

      {PLANS.map(plan => (
        <View
          key={plan.id}
          style={[
            styles.card,
            plan.highlight && styles.cardHighlight,
            { borderColor: plan.color },
          ]}
        >
          {plan.highlight && (
            <View style={styles.recommended}>
              <Ionicons name="star" size={12} color="#fff" />
              <Text style={styles.recommendedText}>
                {t('pricing.recommended', 'Recomanat')}
              </Text>
            </View>
          )}
          <Text style={[styles.planName, { color: plan.color }]}>{plan.name}</Text>
          <View style={styles.priceRow}>
            <Text style={styles.price}>{plan.price}</Text>
            {plan.period && <Text style={styles.period}>{plan.period}</Text>}
          </View>

          <View style={styles.features}>
            {plan.features.map((f, i) => (
              <View key={i} style={styles.featRow}>
                <Ionicons
                  name={f.ok ? 'checkmark-circle' : 'close-circle'}
                  size={16}
                  color={f.ok ? '#16a34a' : '#dc2626'}
                />
                <Text style={styles.featText}>
                  {t(`pricing.feat_${f.text}`, f.text)}
                </Text>
              </View>
            ))}
          </View>

          <TouchableOpacity
            style={[styles.btn, { backgroundColor: plan.color }]}
            onPress={() => handleAction(plan)}
          >
            <Text style={styles.btnText}>
              {plan.id === 'free'
                ? t('pricing.continueFree', 'Continuar gratis')
                : plan.id === 'enterprise'
                ? t('pricing.contactUs', 'Contacta\'ns')
                : t('pricing.startTrial', 'Començar prova')}
            </Text>
          </TouchableOpacity>
        </View>
      ))}

      <Text style={styles.disclaimer}>
        {t('pricing.disclaimer', 'Tots els preus inclouen IVA. Pots cancel·lar quan vulguis.')}
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  heading: { fontSize: 24, fontWeight: '800', color: COLORS.textPrimary, textAlign: 'center', marginTop: 4 },
  subheading: { fontSize: 14, color: COLORS.textSecondary, textAlign: 'center', marginBottom: 16 },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    padding: 18,
    marginBottom: 14,
    borderWidth: 2,
    position: 'relative',
  },
  cardHighlight: {
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 4,
  },
  recommended: {
    position: 'absolute',
    top: -10, right: 12,
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: 10,
  },
  recommendedText: { color: '#fff', fontSize: 10, fontWeight: '700' },
  planName: { fontSize: 18, fontWeight: '800', marginBottom: 4 },
  priceRow: { flexDirection: 'row', alignItems: 'baseline', gap: 4, marginBottom: 14 },
  price: { fontSize: 32, fontWeight: '900', color: COLORS.textPrimary },
  period: { fontSize: 14, color: COLORS.textSecondary },
  features: { gap: 6, marginBottom: 14 },
  featRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  featText: { fontSize: 13, color: COLORS.textPrimary, flex: 1 },
  btn: {
    paddingVertical: 12, borderRadius: 10,
    alignItems: 'center',
  },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  disclaimer: { fontSize: 11, color: COLORS.textSecondary, textAlign: 'center', marginTop: 6 },
});
