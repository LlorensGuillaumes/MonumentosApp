import { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput, ActivityIndicator,
  StyleSheet, Alert, KeyboardAvoidingView, Platform, Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { changePassword } from '../services/api';
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

export default function ProfileScreen({ navigation }) {
  const { t, i18n } = useTranslation();
  const { user, updateProfile, logout } = useAuth();

  const [nombre, setNombre] = useState(user?.nombre || '');
  const [idioma, setIdioma] = useState(user?.idioma_por_defecto || i18n.language || 'es');
  const [savingProfile, setSavingProfile] = useState(false);

  // Password change form
  const [currentPwd, setCurrentPwd] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');
  const [changingPwd, setChangingPwd] = useState(false);
  const [showPasswordSection, setShowPasswordSection] = useState(false);

  const memberSince = user?.created_at
    ? new Date(user.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'long' })
    : null;

  const handleSaveProfile = async () => {
    setSavingProfile(true);
    try {
      await updateProfile({ nombre, idioma_por_defecto: idioma });
      if (idioma !== i18n.language) i18n.changeLanguage(idioma);
      Alert.alert(t('profile.saved', 'Perfil actualitzat'));
    } catch (err) {
      Alert.alert(err.response?.data?.error || t('profile.errorSave', 'Error al desar'));
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async () => {
    if (!currentPwd || !newPwd) {
      Alert.alert(t('profile.passwordRequired', 'Omple tots els camps de password'));
      return;
    }
    if (newPwd.length < 6) {
      Alert.alert(t('profile.passwordTooShort', 'Mínim 6 caràcters'));
      return;
    }
    if (newPwd !== confirmPwd) {
      Alert.alert(t('profile.passwordMismatch', 'Les passwords no coincideixen'));
      return;
    }
    setChangingPwd(true);
    try {
      await changePassword({ current_password: currentPwd, new_password: newPwd });
      Alert.alert(t('profile.passwordChanged', 'Password actualitzada'));
      setCurrentPwd(''); setNewPwd(''); setConfirmPwd('');
      setShowPasswordSection(false);
    } catch (err) {
      Alert.alert(err.response?.data?.error || t('profile.errorPassword', 'Error al canviar password'));
    } finally {
      setChangingPwd(false);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      t('profile.logoutConfirm', 'Tancar sessió?'),
      '',
      [
        { text: t('common.cancel', 'Cancel·lar'), style: 'cancel' },
        {
          text: t('profile.logout', 'Tancar sessió'),
          style: 'destructive',
          onPress: async () => {
            await logout();
            navigation.popToTop();
          },
        },
      ],
    );
  };

  if (!user) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.warning}>{t('profile.notLogged', 'Cal iniciar sessió')}</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={{ flex: 1, backgroundColor: COLORS.background }}
    >
      <ScrollView contentContainerStyle={{ padding: 12, paddingBottom: 40 }}>
        {/* Header amb avatar + info */}
        <View style={styles.header}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {(user.nombre || user.email || '?').charAt(0).toUpperCase()}
            </Text>
          </View>
          <Text style={styles.userName}>{user.nombre || user.email}</Text>
          <Text style={styles.userEmail}>{user.email}</Text>
          {user.rol && user.rol !== 'user' && (
            <View style={[styles.badge, user.rol === 'admin' ? styles.badgeAdmin : styles.badgeCurator]}>
              <Text style={styles.badgeText}>{user.rol.toUpperCase()}</Text>
            </View>
          )}
          {user.premium && (
            <View style={[styles.badge, styles.badgePremium]}>
              <Ionicons name="star" size={11} color="#fff" />
              <Text style={styles.badgeText}>PREMIUM</Text>
            </View>
          )}
          {memberSince && (
            <Text style={styles.memberSince}>
              {t('profile.memberSince', 'Membre des de')} {memberSince}
            </Text>
          )}
        </View>

        {/* Edit perfil */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('profile.editProfile', 'Editar perfil')}</Text>

          <Text style={styles.label}>{t('profile.name', 'Nom')}</Text>
          <TextInput
            style={styles.input}
            value={nombre}
            onChangeText={setNombre}
            placeholder={t('profile.namePlaceholder', 'El teu nom')}
          />

          <Text style={styles.label}>{t('profile.defaultLanguage', 'Idioma per defecte')}</Text>
          <View style={styles.langGrid}>
            {LANGUAGES.map(l => {
              const active = idioma === l.code;
              return (
                <TouchableOpacity
                  key={l.code}
                  style={[styles.langChip, active && styles.langChipActive]}
                  onPress={() => setIdioma(l.code)}
                >
                  <Image source={l.flag} style={styles.langChipFlag} />
                  <Text style={[styles.langChipText, active && styles.langChipTextActive]}>
                    {l.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <TouchableOpacity
            style={[styles.primaryBtn, savingProfile && { opacity: 0.6 }]}
            onPress={handleSaveProfile}
            disabled={savingProfile}
          >
            {savingProfile ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.primaryBtnText}>{t('profile.saveChanges', 'Desar canvis')}</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Canvi password */}
        <View style={styles.section}>
          <TouchableOpacity
            style={styles.collapsibleHeader}
            onPress={() => setShowPasswordSection(s => !s)}
          >
            <Text style={styles.sectionTitle}>{t('profile.changePassword', 'Canviar password')}</Text>
            <Ionicons
              name={showPasswordSection ? 'chevron-up' : 'chevron-down'}
              size={18}
              color={COLORS.textSecondary}
            />
          </TouchableOpacity>

          {showPasswordSection && (
            <>
              <Text style={styles.label}>{t('profile.currentPassword', 'Password actual')}</Text>
              <TextInput
                style={styles.input}
                value={currentPwd}
                onChangeText={setCurrentPwd}
                secureTextEntry
                placeholder="••••••"
              />

              <Text style={styles.label}>{t('profile.newPassword', 'Nova password')}</Text>
              <TextInput
                style={styles.input}
                value={newPwd}
                onChangeText={setNewPwd}
                secureTextEntry
                placeholder={t('profile.min6chars', 'Mínim 6 caràcters')}
              />

              <Text style={styles.label}>{t('profile.confirmPassword', 'Confirma la nova')}</Text>
              <TextInput
                style={styles.input}
                value={confirmPwd}
                onChangeText={setConfirmPwd}
                secureTextEntry
                placeholder="••••••"
              />

              <TouchableOpacity
                style={[styles.primaryBtn, changingPwd && { opacity: 0.6 }]}
                onPress={handleChangePassword}
                disabled={changingPwd}
              >
                {changingPwd ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.primaryBtnText}>{t('profile.updatePassword', 'Actualitzar password')}</Text>
                )}
              </TouchableOpacity>
            </>
          )}
        </View>

        {/* Logout */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={18} color="#dc2626" />
          <Text style={styles.logoutText}>{t('profile.logout', 'Tancar sessió')}</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20 },
  warning: { fontSize: 14, color: COLORS.textSecondary },
  header: {
    alignItems: 'center',
    padding: 20,
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1, borderColor: COLORS.border,
  },
  avatar: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: COLORS.primary,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 10,
  },
  avatarText: { color: '#fff', fontSize: 30, fontWeight: '700' },
  userName: { fontSize: 18, fontWeight: '700', color: COLORS.textPrimary },
  userEmail: { fontSize: 13, color: COLORS.textSecondary, marginTop: 2 },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: 12,
    marginTop: 8,
  },
  badgeAdmin: { backgroundColor: '#7c3aed' },
  badgeCurator: { backgroundColor: '#0369a1' },
  badgePremium: { backgroundColor: '#fbbf24' },
  badgeText: { color: '#fff', fontSize: 10, fontWeight: '700', letterSpacing: 0.5 },
  memberSince: { fontSize: 12, color: COLORS.textSecondary, marginTop: 8 },
  section: {
    backgroundColor: COLORS.surface,
    padding: 14,
    borderRadius: 10,
    marginBottom: 12,
    borderWidth: 1, borderColor: COLORS.border,
  },
  collapsibleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: 10,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 6,
    marginTop: 10,
  },
  input: {
    backgroundColor: COLORS.background,
    borderWidth: 1, borderColor: COLORS.border,
    borderRadius: 10,
    padding: 12,
    fontSize: 15,
    color: COLORS.textPrimary,
  },
  langGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 4 },
  langChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10, paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1.5, borderColor: COLORS.border,
    backgroundColor: COLORS.background,
  },
  langChipActive: { borderColor: COLORS.primary, backgroundColor: COLORS.primary + '10' },
  langChipFlag: { width: 18, height: 13, borderRadius: 2 },
  langChipText: { fontSize: 12, fontWeight: '600', color: COLORS.textSecondary },
  langChipTextActive: { color: COLORS.primary },
  primaryBtn: {
    marginTop: 16,
    backgroundColor: COLORS.primary,
    paddingVertical: 13,
    borderRadius: 10,
    alignItems: 'center',
  },
  primaryBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  logoutBtn: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    marginTop: 16,
    paddingVertical: 13,
    borderRadius: 10,
    backgroundColor: COLORS.surface,
    borderWidth: 1, borderColor: '#fecaca',
  },
  logoutText: { color: '#dc2626', fontWeight: '700', fontSize: 14 },
});
