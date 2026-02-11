import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  ScrollView, StyleSheet, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { COLORS } from '../utils/colors';

export default function LoginScreen({ navigation }) {
  const { t } = useTranslation();
  const { login, register } = useAuth();
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nombre, setNombre] = useState('');
  const [idioma, setIdioma] = useState('es');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!email || !password) {
      setError(t('auth.genericError'));
      return;
    }
    setError(null);
    setLoading(true);
    try {
      if (mode === 'login') {
        await login(email, password);
      } else {
        await register(email, password, nombre, idioma);
      }
      navigation.goBack();
    } catch (err) {
      setError(err.response?.data?.error || t('auth.genericError'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <View style={styles.card}>
          <Ionicons name="person-circle" size={64} color={COLORS.primary} style={styles.icon} />
          <Text style={styles.title}>
            {mode === 'login' ? t('auth.loginTitle') : t('auth.registerTitle')}
          </Text>

          {error && (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {mode === 'register' && (
            <View style={styles.inputGroup}>
              <Text style={styles.label}>{t('auth.name')}</Text>
              <TextInput
                style={styles.input}
                value={nombre}
                onChangeText={setNombre}
                placeholder={t('auth.namePlaceholder')}
                placeholderTextColor={COLORS.textSecondary}
              />
            </View>
          )}

          <View style={styles.inputGroup}>
            <Text style={styles.label}>{t('auth.email')}</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder={t('auth.emailPlaceholder')}
              placeholderTextColor={COLORS.textSecondary}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>{t('auth.password')}</Text>
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              placeholder={mode === 'register' ? t('auth.passwordMin') : ''}
              placeholderTextColor={COLORS.textSecondary}
              secureTextEntry
            />
          </View>

          <TouchableOpacity
            style={[styles.submitBtn, loading && styles.submitBtnDisabled]}
            onPress={handleSubmit}
            disabled={loading}
          >
            <Text style={styles.submitText}>
              {loading ? t('auth.loading') : (mode === 'login' ? t('auth.loginBtn') : t('auth.registerBtn'))}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.switchBtn}
            onPress={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(null); }}
          >
            <Text style={styles.switchText}>
              {mode === 'login' ? t('auth.noAccount') : t('auth.hasAccount')}{' '}
              <Text style={styles.switchLink}>
                {mode === 'login' ? t('auth.registerLink') : t('auth.loginLink')}
              </Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  icon: {
    alignSelf: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.dark,
    textAlign: 'center',
    marginBottom: 20,
  },
  errorBox: {
    backgroundColor: '#fff5f5',
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#fed7d7',
  },
  errorText: {
    color: '#c53030',
    fontSize: 14,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.textSecondary,
    marginBottom: 6,
  },
  input: {
    backgroundColor: COLORS.borderLight,
    borderRadius: 10,
    padding: 14,
    fontSize: 16,
    color: COLORS.textPrimary,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  submitBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  submitBtnDisabled: {
    opacity: 0.6,
  },
  submitText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  switchBtn: {
    marginTop: 20,
    alignItems: 'center',
  },
  switchText: {
    color: COLORS.textSecondary,
    fontSize: 14,
  },
  switchLink: {
    color: COLORS.primary,
    fontWeight: '600',
  },
});
