import { useState } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { getCategoryIcon, getCategoryColor, COLORS } from '../utils/colors';
import { imageSource } from '../utils/image';

export default function MonumentoCard({ monumento, onPress, horizontal = false }) {
  const icon = getCategoryIcon(monumento.tipo, monumento.categoria);
  const accentColor = getCategoryColor(monumento.categoria, monumento.tipo);
  const [imgError, setImgError] = useState(false);

  const showImage = monumento.imagen_url && !imgError;

  if (horizontal) {
    return (
      <TouchableOpacity style={styles.horizontalCard} onPress={onPress} activeOpacity={0.7}>
        <View style={styles.horizontalImage}>
          {showImage ? (
            <Image source={imageSource(monumento.imagen_url)} style={styles.horizontalImg} onError={() => setImgError(true)} />
          ) : (
            <View style={[styles.horizontalPlaceholder, { backgroundColor: accentColor + '20' }]}>
              <Text style={styles.placeholderIcon}>{icon}</Text>
            </View>
          )}
          <View style={styles.cardIconBadge}>
            <Text style={styles.cardIconText}>{icon}</Text>
          </View>
        </View>
        <View style={styles.horizontalContent}>
          <Text style={styles.horizontalTitle} numberOfLines={2}>{monumento.denominacion}</Text>
          <Text style={styles.cardLocation} numberOfLines={1}>
            📍 {monumento.municipio || monumento.provincia || monumento.comunidad_autonoma}
          </Text>
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.cardImage}>
        {showImage ? (
          <Image source={imageSource(monumento.imagen_url)} style={styles.image} onError={() => setImgError(true)} />
        ) : (
          <View style={[styles.placeholder, { backgroundColor: accentColor + '20' }]}>
            <Text style={styles.placeholderIcon}>{icon}</Text>
          </View>
        )}
        <View style={styles.cardIconBadge}>
          <Text style={styles.cardIconText}>{icon}</Text>
        </View>
      </View>
      <View style={styles.cardContent}>
        <Text style={styles.cardTitle} numberOfLines={2}>{monumento.denominacion}</Text>
        <Text style={styles.cardLocation} numberOfLines={1}>
          📍 {monumento.municipio || monumento.provincia || monumento.comunidad_autonoma}
        </Text>
        <View style={styles.cardTags}>
          {monumento.categoria ? (
            <View style={[styles.tag, { backgroundColor: accentColor + '15' }]}>
              <Text style={[styles.tagText, { color: accentColor }]}>{monumento.categoria}</Text>
            </View>
          ) : null}
          {monumento.estilo ? (
            <View style={styles.tagOutline}>
              <Text style={styles.tagOutlineText}>{monumento.estilo}</Text>
            </View>
          ) : null}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  cardImage: {
    height: 160,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  placeholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderIcon: {
    fontSize: 40,
  },
  cardIconBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 16,
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardIconText: {
    fontSize: 16,
  },
  cardContent: {
    padding: 12,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.dark,
    marginBottom: 4,
  },
  cardLocation: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginBottom: 8,
  },
  cardTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  tag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  tagText: {
    fontSize: 11,
    fontWeight: '500',
  },
  tagOutline: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  tagOutlineText: {
    fontSize: 11,
    color: COLORS.textSecondary,
  },
  horizontalCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    overflow: 'hidden',
    width: 220,
    marginRight: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  horizontalImage: {
    height: 130,
    position: 'relative',
  },
  horizontalImg: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  horizontalPlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  horizontalContent: {
    padding: 10,
  },
  horizontalTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.dark,
    marginBottom: 4,
  },
});
