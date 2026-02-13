import { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, ActivityIndicator, Alert, Image,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { Picker } from '@react-native-picker/picker';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { submitPropuesta, getFiltros } from '../services/api';
import { COLORS } from '../utils/colors';

const PAISES = ['España', 'Francia', 'Portugal', 'Italia'];

export default function ProposeScreen({ navigation }) {
  const { t } = useTranslation();

  const [form, setForm] = useState({
    denominacion: '', pais: '', comunidad_autonoma: '', provincia: '',
    municipio: '', localidad: '', categoria: '', tipo: '',
    descripcion: '', estilo: '', material: '', inception: '',
    arquitecto: '', wikipedia_url: '',
    latitud: '', longitud: '',
  });
  const [files, setFiles] = useState([]);
  const [filtros, setFiltros] = useState(null);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!form.pais) return;
    const params = { pais: form.pais };
    if (form.comunidad_autonoma) params.region = form.comunidad_autonoma;
    getFiltros(params).then(setFiltros).catch(() => {});
  }, [form.pais, form.comunidad_autonoma]);

  const handleChange = (field, value) => {
    setForm(f => {
      const next = { ...f, [field]: value };
      if (field === 'pais') { next.comunidad_autonoma = ''; next.provincia = ''; }
      if (field === 'comunidad_autonoma') { next.provincia = ''; }
      return next;
    });
  };

  const pickImages = async () => {
    if (files.length >= 5) {
      Alert.alert('', t('proposal.uploadHint'));
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      selectionLimit: 5 - files.length,
      quality: 0.8,
    });
    if (!result.canceled && result.assets) {
      setFiles(prev => [...prev, ...result.assets].slice(0, 5));
    }
  };

  const takePhoto = async () => {
    if (files.length >= 5) return;
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') return;
    const result = await ImagePicker.launchCameraAsync({ quality: 0.8 });
    if (!result.canceled && result.assets) {
      setFiles(prev => [...prev, ...result.assets].slice(0, 5));
    }
  };

  const handleSubmit = async () => {
    if (!form.denominacion.trim() || !form.pais) {
      Alert.alert(t('detail.error'), t('proposal.error'));
      return;
    }
    setSending(true);
    try {
      const formData = new FormData();
      Object.entries(form).forEach(([key, val]) => {
        if (val) formData.append(key, val);
      });

      files.forEach((f, i) => {
        const ext = f.uri.split('.').pop() || 'jpg';
        formData.append('imagenes', {
          uri: f.uri,
          name: f.fileName || `foto_${i}.${ext}`,
          type: f.mimeType || `image/${ext}`,
        });
      });

      await submitPropuesta(formData);
      Alert.alert(t('proposal.title'), t('proposal.success'), [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (err) {
      Alert.alert(t('detail.error'), err.response?.data?.error || t('proposal.error'));
    } finally {
      setSending(false);
    }
  };

  const regiones = filtros?.regiones || [];
  const provincias = filtros?.provincias || [];
  const categorias = filtros?.categorias || [];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.subtitle}>{t('proposal.subtitle')}</Text>

      {/* Name */}
      <Text style={styles.label}>{t('proposal.name')} *</Text>
      <TextInput
        style={styles.input}
        value={form.denominacion}
        onChangeText={v => handleChange('denominacion', v)}
        placeholder={t('proposal.namePlaceholder')}
        placeholderTextColor={COLORS.textSecondary}
      />

      {/* Country */}
      <Text style={styles.label}>{t('filters.country')} *</Text>
      <View style={styles.pickerWrap}>
        <Picker selectedValue={form.pais} onValueChange={v => handleChange('pais', v)} style={styles.picker}>
          <Picker.Item label={t('filters.allCountries')} value="" />
          {PAISES.map(p => <Picker.Item key={p} label={p} value={p} />)}
        </Picker>
      </View>

      {/* Region */}
      {form.pais && regiones.length > 0 && (
        <>
          <Text style={styles.label}>{t('filters.region')}</Text>
          <View style={styles.pickerWrap}>
            <Picker selectedValue={form.comunidad_autonoma} onValueChange={v => handleChange('comunidad_autonoma', v)} style={styles.picker}>
              <Picker.Item label={t('filters.allRegions')} value="" />
              {regiones.map(r => <Picker.Item key={r.value} label={r.value} value={r.value} />)}
            </Picker>
          </View>
        </>
      )}

      {/* Province */}
      {form.pais && provincias.length > 0 && (
        <>
          <Text style={styles.label}>{t('filters.province')}</Text>
          <View style={styles.pickerWrap}>
            <Picker selectedValue={form.provincia} onValueChange={v => handleChange('provincia', v)} style={styles.picker}>
              <Picker.Item label={t('filters.allProvinces')} value="" />
              {provincias.map(p => <Picker.Item key={p.value} label={p.value} value={p.value} />)}
            </Picker>
          </View>
        </>
      )}

      {/* Municipality & Locality */}
      <Text style={styles.label}>{t('filters.municipality')}</Text>
      <TextInput style={styles.input} value={form.municipio} onChangeText={v => handleChange('municipio', v)} placeholderTextColor={COLORS.textSecondary} />

      <Text style={styles.label}>{t('detail.locality')}</Text>
      <TextInput style={styles.input} value={form.localidad} onChangeText={v => handleChange('localidad', v)} placeholderTextColor={COLORS.textSecondary} />

      {/* Category */}
      {categorias.length > 0 && (
        <>
          <Text style={styles.label}>{t('filters.category')}</Text>
          <View style={styles.pickerWrap}>
            <Picker selectedValue={form.categoria} onValueChange={v => handleChange('categoria', v)} style={styles.picker}>
              <Picker.Item label={t('filters.allCategories')} value="" />
              {categorias.map(c => <Picker.Item key={c.value} label={c.value} value={c.value} />)}
            </Picker>
          </View>
        </>
      )}

      {/* Description */}
      <Text style={styles.sectionTitle}>{t('proposal.description')}</Text>
      <TextInput
        style={[styles.input, styles.textarea]}
        value={form.descripcion}
        onChangeText={v => handleChange('descripcion', v)}
        placeholder={t('proposal.descriptionPlaceholder')}
        placeholderTextColor={COLORS.textSecondary}
        multiline
        numberOfLines={4}
        textAlignVertical="top"
      />

      {/* Extra fields */}
      <View style={styles.row}>
        <View style={styles.halfField}>
          <Text style={styles.label}>{t('proposal.style')}</Text>
          <TextInput style={styles.input} value={form.estilo} onChangeText={v => handleChange('estilo', v)} placeholderTextColor={COLORS.textSecondary} />
        </View>
        <View style={styles.halfField}>
          <Text style={styles.label}>{t('proposal.material')}</Text>
          <TextInput style={styles.input} value={form.material} onChangeText={v => handleChange('material', v)} placeholderTextColor={COLORS.textSecondary} />
        </View>
      </View>

      <View style={styles.row}>
        <View style={styles.halfField}>
          <Text style={styles.label}>{t('proposal.epoch')}</Text>
          <TextInput style={styles.input} value={form.inception} onChangeText={v => handleChange('inception', v)} placeholderTextColor={COLORS.textSecondary} />
        </View>
        <View style={styles.halfField}>
          <Text style={styles.label}>{t('proposal.architect')}</Text>
          <TextInput style={styles.input} value={form.arquitecto} onChangeText={v => handleChange('arquitecto', v)} placeholderTextColor={COLORS.textSecondary} />
        </View>
      </View>

      {/* Coordinates */}
      <Text style={styles.sectionTitle}>{t('proposal.locationSection')}</Text>
      <View style={styles.row}>
        <View style={styles.halfField}>
          <Text style={styles.label}>{t('proposal.latitude')}</Text>
          <TextInput style={styles.input} value={form.latitud} onChangeText={v => handleChange('latitud', v)} keyboardType="numeric" placeholderTextColor={COLORS.textSecondary} placeholder="41.6560" />
        </View>
        <View style={styles.halfField}>
          <Text style={styles.label}>{t('proposal.longitude')}</Text>
          <TextInput style={styles.input} value={form.longitud} onChangeText={v => handleChange('longitud', v)} keyboardType="numeric" placeholderTextColor={COLORS.textSecondary} placeholder="-0.8773" />
        </View>
      </View>

      {/* Images */}
      <Text style={styles.sectionTitle}>{t('proposal.images')}</Text>
      <View style={styles.imageActions}>
        <TouchableOpacity style={styles.addFileBtn} onPress={pickImages}>
          <Ionicons name="images-outline" size={18} color={COLORS.textSecondary} />
          <Text style={styles.addFileText}>{t('proposal.uploadImages')}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.addFileBtn} onPress={takePhoto}>
          <Ionicons name="camera-outline" size={18} color={COLORS.textSecondary} />
          <Text style={styles.addFileText}>Foto</Text>
        </TouchableOpacity>
      </View>
      <Text style={styles.hint}>{t('proposal.uploadHint')}</Text>

      {files.length > 0 && (
        <View style={styles.imageGrid}>
          {files.map((f, i) => (
            <View key={i} style={styles.imageItem}>
              <Image source={{ uri: f.uri }} style={styles.imageThumb} />
              <TouchableOpacity style={styles.imageRemove} onPress={() => setFiles(prev => prev.filter((_, j) => j !== i))}>
                <Ionicons name="close-circle" size={22} color={COLORS.error} />
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}

      {/* Submit */}
      <TouchableOpacity
        style={[styles.submitBtn, (sending || !form.denominacion || !form.pais) && styles.submitBtnDisabled]}
        onPress={handleSubmit}
        disabled={sending || !form.denominacion || !form.pais}
      >
        {sending ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <Text style={styles.submitText}>{t('proposal.submit')}</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: 16, paddingBottom: 40 },
  subtitle: { fontSize: 14, color: COLORS.textSecondary, marginBottom: 12 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: COLORS.textPrimary, marginTop: 16, marginBottom: 4 },
  label: { fontSize: 13, fontWeight: '600', color: COLORS.textPrimary, marginTop: 8 },
  input: {
    backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border,
    borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10,
    fontSize: 15, color: COLORS.textPrimary, marginTop: 4,
  },
  textarea: { minHeight: 100, textAlignVertical: 'top' },
  pickerWrap: {
    backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border,
    borderRadius: 8, marginTop: 4, overflow: 'hidden',
  },
  picker: { color: COLORS.textPrimary },
  row: { flexDirection: 'row', gap: 10 },
  halfField: { flex: 1 },
  imageActions: { flexDirection: 'row', gap: 10, marginTop: 4 },
  addFileBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingVertical: 8, paddingHorizontal: 12,
    backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border,
    borderStyle: 'dashed', borderRadius: 8,
  },
  addFileText: { fontSize: 14, color: COLORS.textSecondary },
  hint: { fontSize: 12, color: COLORS.textSecondary, marginTop: 4 },
  imageGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 },
  imageItem: { position: 'relative' },
  imageThumb: { width: 80, height: 80, borderRadius: 6 },
  imageRemove: { position: 'absolute', top: -6, right: -6 },
  submitBtn: {
    backgroundColor: COLORS.primary, paddingVertical: 14,
    borderRadius: 8, alignItems: 'center', marginTop: 20,
  },
  submitBtnDisabled: { opacity: 0.5 },
  submitText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
