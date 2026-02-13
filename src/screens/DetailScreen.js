import { useEffect, useState, useRef } from 'react';
import {
  View, Text, ScrollView, Image, TouchableOpacity, FlatList,
  ActivityIndicator, Linking, StyleSheet, Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { getMonumento, getWikipediaExtract } from '../services/api';
import { useAuth } from '../context/AuthContext';
import LeafletMap from '../components/LeafletMap';
import { getCategoryColor, getCategoryIcon, COLORS } from '../utils/colors';
import { imageSource } from '../utils/image';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function DetailScreen({ route, navigation }) {
  const { t } = useTranslation();
  const { user, isFavorito, toggleFavorito } = useAuth();
  const { id } = route.params;
  const [monumento, setMonumento] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [favLoading, setFavLoading] = useState(false);
  const [wikiExtract, setWikiExtract] = useState(null);
  const [wikiLoading, setWikiLoading] = useState(false);
  const galleryRef = useRef(null);

  const handleToggleFav = async () => {
    if (!user) {
      navigation.navigate('Login');
      return;
    }
    setFavLoading(true);
    await toggleFavorito(id);
    setFavLoading(false);
  };

  function formatInception(value) {
    if (!value) return value;
    const bceMatch = value.match(/^-0*(\d+)-\d{2}-\d{2}/);
    if (bceMatch) return `${parseInt(bceMatch[1])} ${t('detail.bce')}`;
    const isoMatch = value.match(/^\+?(\d{1,4})-\d{2}-\d{2}/);
    if (isoMatch) return isoMatch[1];
    return value;
  }

  useEffect(() => {
    setLoading(true);
    setWikiExtract(null);
    getMonumento(id)
      .then(data => {
        setMonumento(data);
        navigation.setOptions({ title: data.denominacion });
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [id, navigation]);

  useEffect(() => {
    if (!monumento) return;
    const needsWikipedia = !monumento.descripcion_completa
      && (!monumento.wiki_descripcion || monumento.wiki_descripcion.length < 150)
      && monumento.wikipedia_url;
    if (!needsWikipedia) return;
    setWikiLoading(true);
    getWikipediaExtract(monumento.id)
      .then(data => { if (data?.extract) setWikiExtract(data.extract); })
      .finally(() => setWikiLoading(false));
  }, [monumento]);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>{t('detail.loading')}</Text>
      </View>
    );
  }

  if (error || !monumento) {
    return (
      <View style={styles.centered}>
        <Ionicons name="alert-circle" size={48} color={COLORS.error} />
        <Text style={styles.errorText}>{error || t('detail.notFound')}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => navigation.goBack()}>
          <Text style={styles.retryText}>{t('detail.back')}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const hasLocation = monumento.latitud && monumento.longitud;

  // Expandir imágenes que tienen múltiples URLs separadas por "|"
  const rawImages = [
    ...(monumento.imagen_url ? [{ url: monumento.imagen_url, titulo: monumento.denominacion }] : []),
    ...(monumento.imagenes || []),
  ];
  const seen = new Set();
  const allImages = rawImages.flatMap(img => {
    if (!img.url) return [];
    return img.url.split('|').map(u => u.trim()).filter(Boolean).map(u => ({ ...img, url: u }));
  }).filter(img => {
    if (seen.has(img.url)) return false;
    seen.add(img.url);
    return true;
  });

  const accentColor = getCategoryColor(monumento.categoria, monumento.tipo);
  const icon = getCategoryIcon(monumento.tipo, monumento.categoria);

  const locationParts = [
    monumento.municipio,
    monumento.provincia,
    monumento.comunidad_autonoma,
    monumento.pais && monumento.pais !== 'España' ? monumento.pais : null,
  ].filter(Boolean);

  const openGoogleMaps = () => {
    Linking.openURL(`https://www.google.com/maps?q=${monumento.latitud},${monumento.longitud}`);
  };

  const openURL = (url) => {
    Linking.openURL(url);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Image Gallery */}
      {allImages.length > 0 && (
        <View style={styles.gallerySection}>
          <FlatList
            ref={galleryRef}
            horizontal
            pagingEnabled
            data={allImages}
            keyExtractor={(_, i) => String(i)}
            renderItem={({ item }) => (
              <Image
                source={imageSource(item.url)}
                style={styles.mainImage}
              />
            )}
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={(e) => {
              const idx = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
              setSelectedImageIndex(idx);
            }}
          />
          {allImages.length > 1 && (
            <View style={styles.thumbRow}>
              {allImages.map((img, i) => (
                <TouchableOpacity
                  key={i}
                  onPress={() => {
                    setSelectedImageIndex(i);
                    galleryRef.current?.scrollToOffset({ offset: i * SCREEN_WIDTH, animated: true });
                  }}
                >
                  <Image
                    source={imageSource(img.url)}
                    style={[styles.thumb, i === selectedImageIndex && styles.thumbActive]}
                  />
                </TouchableOpacity>
              ))}
            </View>
          )}
          {allImages.length > 1 && (
            <Text style={styles.imageCounter}>
              {selectedImageIndex + 1} / {allImages.length}
            </Text>
          )}
        </View>
      )}

      {/* Title & Location */}
      <View style={styles.headerSection}>
        <View style={styles.titleRow}>
          <Text style={styles.iconEmoji}>{icon}</Text>
          <Text style={styles.title}>{monumento.denominacion}</Text>
          <TouchableOpacity
            style={styles.favButton}
            onPress={handleToggleFav}
            disabled={favLoading}
          >
            <Ionicons
              name={isFavorito(id) ? 'heart' : 'heart-outline'}
              size={26}
              color={isFavorito(id) ? '#e53e3e' : COLORS.textSecondary}
            />
          </TouchableOpacity>
        </View>
        {locationParts.length > 0 && (
          <Text style={styles.location}>📍 {locationParts.join(', ')}</Text>
        )}

        {/* Tags */}
        <View style={styles.tags}>
          {monumento.categoria && (
            <View style={[styles.tag, { backgroundColor: accentColor + '15' }]}>
              <Text style={[styles.tagText, { color: accentColor }]}>{monumento.categoria}</Text>
            </View>
          )}
          {monumento.tipo && (
            <View style={styles.tagOutline}>
              <Text style={styles.tagOutlineText}>{monumento.tipo}</Text>
            </View>
          )}
          {monumento.estilo && (
            <View style={styles.tagOutline}>
              <Text style={styles.tagOutlineText}>{monumento.estilo}</Text>
            </View>
          )}
          {monumento.heritage_label && (
            <View style={[styles.tag, { backgroundColor: '#fef3c7' }]}>
              <Text style={[styles.tagText, { color: '#92400e' }]}>{monumento.heritage_label}</Text>
            </View>
          )}
        </View>
      </View>

      {/* Description */}
      {(monumento.descripcion_completa || monumento.wiki_descripcion || wikiExtract) ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('detail.description')}</Text>
          {monumento.descripcion_completa ? (
            <Text style={styles.paragraph}>{monumento.descripcion_completa}</Text>
          ) : wikiExtract ? (
            <>
              <Text style={styles.paragraph}>{wikiExtract}</Text>
              <TouchableOpacity onPress={() => openURL(monumento.wikipedia_url)}>
                <Text style={styles.wikiAttribution}>{t('detail.sourceWikipedia')}</Text>
              </TouchableOpacity>
            </>
          ) : monumento.wiki_descripcion ? (
            <Text style={styles.paragraph}>{monumento.wiki_descripcion}</Text>
          ) : null}
        </View>
      ) : wikiLoading ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('detail.description')}</Text>
          <Text style={styles.wikiLoadingText}>{t('detail.loadingWikipedia')}</Text>
        </View>
      ) : null}

      {/* History */}
      {monumento.sintesis_historica && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('detail.history')}</Text>
          <Text style={styles.paragraph}>{monumento.sintesis_historica}</Text>
        </View>
      )}

      {/* Dating */}
      {(monumento.datacion || monumento.inception || monumento.periodo_historico || monumento.siglo) && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('detail.dating')}</Text>
          <View style={styles.detailList}>
            {monumento.datacion && <DetailRow label={t('detail.date')} value={monumento.datacion} />}
            {monumento.inception && <DetailRow label={t('detail.construction')} value={formatInception(monumento.inception)} />}
            {monumento.periodo_historico && <DetailRow label={t('detail.period')} value={monumento.periodo_historico} />}
            {monumento.siglo && <DetailRow label={t('detail.century')} value={monumento.siglo} />}
          </View>
        </View>
      )}

      {/* Technical Details */}
      {(monumento.arquitecto || monumento.material || monumento.altura || monumento.superficie) && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('detail.technicalDetails')}</Text>
          <View style={styles.detailList}>
            {monumento.arquitecto && <DetailRow label={t('detail.architect')} value={monumento.arquitecto} />}
            {monumento.material && <DetailRow label={t('detail.material')} value={monumento.material} />}
            {monumento.altura && <DetailRow label={t('detail.height')} value={`${monumento.altura} m`} />}
            {monumento.superficie && <DetailRow label={t('detail.area')} value={`${monumento.superficie} m²`} />}
          </View>
        </View>
      )}

      {/* Sources */}
      {(monumento.fuentes || monumento.bibliografia) && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('detail.sources')}</Text>
          {monumento.fuentes && <Text style={styles.paragraph}>{monumento.fuentes}</Text>}
          {monumento.bibliografia && <Text style={styles.paragraph}>{monumento.bibliografia}</Text>}
        </View>
      )}

      {/* Map */}
      {hasLocation && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('detail.location')}</Text>
          <View style={styles.mapContainer}>
            <LeafletMap
              center={{ lat: monumento.latitud, lng: monumento.longitud }}
              zoom={14}
              height={200}
              interactive={false}
              singleMarker={{ lat: monumento.latitud, lng: monumento.longitud, title: monumento.denominacion }}
            />
          </View>
          <TouchableOpacity style={styles.mapsButton} onPress={openGoogleMaps}>
            <Ionicons name="navigate" size={18} color={COLORS.primary} />
            <Text style={styles.mapsButtonText}>{t('detail.openGoogleMaps')}</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Location Info */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('detail.locationInfo')}</Text>
        <View style={styles.detailList}>
          {monumento.pais && monumento.pais !== 'España' && <DetailRow label={t('detail.countryLabel')} value={monumento.pais} />}
          {monumento.comunidad_autonoma && <DetailRow label={t('detail.regionLabel')} value={monumento.comunidad_autonoma} />}
          {monumento.provincia && <DetailRow label={t('detail.provinceLabel')} value={monumento.provincia} />}
          {monumento.comarca && <DetailRow label={t('detail.comarca')} value={monumento.comarca} />}
          {monumento.municipio && <DetailRow label={t('detail.municipalityLabel')} value={monumento.municipio} />}
          {monumento.localidad && <DetailRow label={t('detail.locality')} value={monumento.localidad} />}
          {monumento.ubicacion_detalle && <DetailRow label={t('detail.address')} value={monumento.ubicacion_detalle} />}
        </View>
      </View>

      {/* External Links */}
      {(monumento.wikipedia_url || monumento.qid || monumento.commons_category || monumento.sipca_url) && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('detail.links')}</Text>
          <View style={styles.linksContainer}>
            {monumento.wikipedia_url && (
              <TouchableOpacity style={styles.linkButton} onPress={() => openURL(monumento.wikipedia_url)}>
                <Text style={styles.linkIcon}>📖</Text>
                <Text style={styles.linkText}>Wikipedia</Text>
                <Ionicons name="open-outline" size={14} color={COLORS.textSecondary} />
              </TouchableOpacity>
            )}
            {monumento.qid && (
              <TouchableOpacity style={styles.linkButton} onPress={() => openURL(`https://www.wikidata.org/wiki/${monumento.qid}`)}>
                <Text style={styles.linkIcon}>🔗</Text>
                <Text style={styles.linkText}>Wikidata</Text>
                <Ionicons name="open-outline" size={14} color={COLORS.textSecondary} />
              </TouchableOpacity>
            )}
            {monumento.commons_category && (
              <TouchableOpacity style={styles.linkButton} onPress={() => openURL(`https://commons.wikimedia.org/wiki/Category:${monumento.commons_category}`)}>
                <Text style={styles.linkIcon}>📷</Text>
                <Text style={styles.linkText}>Wikimedia Commons</Text>
                <Ionicons name="open-outline" size={14} color={COLORS.textSecondary} />
              </TouchableOpacity>
            )}
            {monumento.sipca_url && (
              <TouchableOpacity style={styles.linkButton} onPress={() => openURL(monumento.sipca_url)}>
                <Text style={styles.linkIcon}>🏛️</Text>
                <Text style={styles.linkText}>SIPCA</Text>
                <Ionicons name="open-outline" size={14} color={COLORS.textSecondary} />
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

function DetailRow({ label, value }) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    paddingBottom: 20,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 15,
    color: COLORS.textSecondary,
  },
  errorText: {
    marginTop: 12,
    fontSize: 15,
    color: COLORS.error,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 16,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: COLORS.primary,
  },
  retryText: {
    color: '#fff',
    fontWeight: '600',
  },
  // Gallery
  gallerySection: {
    backgroundColor: '#000',
  },
  mainImage: {
    width: SCREEN_WIDTH,
    height: 280,
    resizeMode: 'cover',
  },
  thumbRow: {
    flexDirection: 'row',
    padding: 8,
    gap: 6,
  },
  thumb: {
    width: 56,
    height: 42,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  thumbActive: {
    borderColor: COLORS.primary,
  },
  imageCounter: {
    position: 'absolute',
    bottom: 60,
    right: 12,
    backgroundColor: 'rgba(0,0,0,0.6)',
    color: '#fff',
    fontSize: 12,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    overflow: 'hidden',
  },
  // Header
  headerSection: {
    padding: 16,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  favButton: {
    padding: 4,
    marginTop: 2,
  },
  iconEmoji: {
    fontSize: 24,
    marginTop: 2,
  },
  title: {
    flex: 1,
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.dark,
    lineHeight: 28,
  },
  location: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 6,
    marginLeft: 34,
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 12,
    marginLeft: 34,
  },
  tag: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 14,
  },
  tagText: {
    fontSize: 12,
    fontWeight: '600',
  },
  tagOutline: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  tagOutlineText: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  // Sections
  section: {
    padding: 16,
    backgroundColor: COLORS.surface,
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.dark,
    marginBottom: 10,
  },
  paragraph: {
    fontSize: 14,
    color: COLORS.textPrimary,
    lineHeight: 22,
  },
  // Detail list
  detailList: {
    gap: 0,
  },
  detailRow: {
    flexDirection: 'row',
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.borderLight,
  },
  detailLabel: {
    width: 110,
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  detailValue: {
    flex: 1,
    fontSize: 14,
    color: COLORS.textPrimary,
  },
  // Map
  mapContainer: {
    height: 200,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 10,
  },
  mapsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  mapsButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primary,
  },
  // Links
  linksContainer: {
    gap: 8,
  },
  linkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: COLORS.borderLight,
  },
  linkIcon: {
    fontSize: 18,
  },
  linkText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.primary,
  },
  wikiAttribution: {
    marginTop: 10,
    fontSize: 13,
    color: COLORS.primary,
    fontStyle: 'italic',
  },
  wikiLoadingText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontStyle: 'italic',
  },
});
