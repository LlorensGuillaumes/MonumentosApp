import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, ActivityIndicator, Alert,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import * as DocumentPicker from 'expo-document-picker';
import { Ionicons } from '@expo/vector-icons';
import { sendContact } from '../services/api';
import { COLORS } from '../utils/colors';

export default function ContactScreen() {
  const { t } = useTranslation();
  const [form, setForm] = useState({ email: '', asunto: '', mensaje: '' });
  const [archivos, setArchivos] = useState([]);
  const [sending, setSending] = useState(false);

  const handleChange = (field, value) => {
    setForm(f => ({ ...f, [field]: value }));
  };

  const pickFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({ multiple: true });
      if (!result.canceled && result.assets) {
        setArchivos(prev => [...prev, ...result.assets]);
      }
    } catch (err) {
      // ignore
    }
  };

  const removeFile = (index) => {
    setArchivos(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!form.email || !form.asunto || !form.mensaje) {
      Alert.alert(t('detail.error'), t('contact.error'));
      return;
    }
    setSending(true);
    try {
      const files = archivos.map(f => ({
        uri: f.uri,
        name: f.name,
        type: f.mimeType || 'application/octet-stream',
      }));
      await sendContact({ ...form, archivos: files });
      Alert.alert(t('contact.title'), t('contact.success'));
      setForm({ email: '', asunto: '', mensaje: '' });
      setArchivos([]);
    } catch (err) {
      Alert.alert(t('detail.error'), t('contact.error'));
    } finally {
      setSending(false);
    }
  };

  const formatSize = (bytes) => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.subtitle}>{t('contact.subtitle')}</Text>

      <Text style={styles.label}>{t('contact.email')}</Text>
      <TextInput
        style={styles.input}
        value={form.email}
        onChangeText={v => handleChange('email', v)}
        placeholder={t('contact.emailPlaceholder')}
        placeholderTextColor={COLORS.textSecondary}
        keyboardType="email-address"
        autoCapitalize="none"
      />

      <Text style={styles.label}>{t('contact.subject')}</Text>
      <TextInput
        style={styles.input}
        value={form.asunto}
        onChangeText={v => handleChange('asunto', v)}
        placeholder={t('contact.subjectPlaceholder')}
        placeholderTextColor={COLORS.textSecondary}
      />

      <Text style={styles.label}>{t('contact.message')}</Text>
      <TextInput
        style={[styles.input, styles.textarea]}
        value={form.mensaje}
        onChangeText={v => handleChange('mensaje', v)}
        placeholder={t('contact.messagePlaceholder')}
        placeholderTextColor={COLORS.textSecondary}
        multiline
        numberOfLines={6}
        textAlignVertical="top"
      />

      <Text style={styles.label}>{t('contact.attachments')}</Text>
      <TouchableOpacity style={styles.addFileBtn} onPress={pickFile}>
        <Ionicons name="attach" size={18} color={COLORS.textSecondary} />
        <Text style={styles.addFileText}>{t('contact.addFile')}</Text>
      </TouchableOpacity>

      {archivos.map((f, i) => (
        <View key={i} style={styles.fileRow}>
          <Text style={styles.fileName} numberOfLines={1}>{f.name}</Text>
          {f.size ? <Text style={styles.fileSize}>{formatSize(f.size)}</Text> : null}
          <TouchableOpacity onPress={() => removeFile(i)}>
            <Ionicons name="close-circle" size={20} color={COLORS.error} />
          </TouchableOpacity>
        </View>
      ))}

      <TouchableOpacity
        style={[styles.submitBtn, sending && styles.submitBtnDisabled]}
        onPress={handleSubmit}
        disabled={sending}
      >
        {sending ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <Text style={styles.submitText}>{t('contact.send')}</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    padding: 16,
    gap: 8,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 12,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginTop: 8,
  },
  input: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: COLORS.textPrimary,
    marginTop: 4,
  },
  textarea: {
    minHeight: 120,
    textAlignVertical: 'top',
  },
  addFileBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderStyle: 'dashed',
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  addFileText: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  fileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: COLORS.surface,
    padding: 8,
    borderRadius: 6,
    marginTop: 4,
  },
  fileName: {
    flex: 1,
    fontSize: 13,
    color: COLORS.textPrimary,
  },
  fileSize: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  submitBtn: {
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
  },
  submitBtnDisabled: {
    opacity: 0.5,
  },
  submitText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
