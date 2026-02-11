import { useEffect, useState, useCallback } from 'react';
import {
  View, Text, FlatList, ActivityIndicator,
  TouchableOpacity, StyleSheet,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { getFavoritos } from '../services/api';
import MonumentoCard from '../components/MonumentoCard';
import { COLORS } from '../utils/colors';

export default function FavoritosScreen({ navigation }) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  const loadFavoritos = useCallback(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    setLoading(true);
    getFavoritos({ page, limit: 20 })
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user, page]);

  // Recargar al volver a la pantalla
  useFocusEffect(
    useCallback(() => {
      loadFavoritos();
    }, [loadFavoritos])
  );

  if (!user) {
    return (
      <View style={styles.centered}>
        <Ionicons name="heart-outline" size={64} color={COLORS.textSecondary} />
        <Text style={styles.emptyTitle}>{t('favorites.title')}</Text>
        <Text style={styles.emptyText}>{t('auth.loginToFav')}</Text>
        <TouchableOpacity
          style={styles.loginBtn}
          onPress={() => navigation.navigate('Login')}
        >
          <Text style={styles.loginBtnText}>{t('auth.loginBtn')}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (!data || data.items.length === 0) {
    return (
      <View style={styles.centered}>
        <Ionicons name="heart-outline" size={64} color={COLORS.textSecondary} />
        <Text style={styles.emptyTitle}>{t('favorites.title')}</Text>
        <Text style={styles.emptyText}>{t('favorites.empty')}</Text>
        <TouchableOpacity
          style={styles.loginBtn}
          onPress={() => navigation.navigate('Buscar')}
        >
          <Text style={styles.loginBtnText}>{t('favorites.explore')}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.count}>
        {t('favorites.count', { count: data.total })}
      </Text>
      <FlatList
        data={data.items}
        keyExtractor={(item) => String(item.id)}
        numColumns={2}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <MonumentoCard
            monumento={item}
            onPress={() => navigation.navigate('Detail', { id: item.id, title: item.denominacion })}
          />
        )}
      />
      {data.pages > 1 && (
        <View style={styles.pagination}>
          <TouchableOpacity
            onPress={() => setPage(p => p - 1)}
            disabled={page <= 1}
            style={[styles.pageBtn, page <= 1 && styles.pageBtnDisabled]}
          >
            <Text style={styles.pageBtnText}>{t('search.previous')}</Text>
          </TouchableOpacity>
          <Text style={styles.pageInfo}>{page} / {data.pages}</Text>
          <TouchableOpacity
            onPress={() => setPage(p => p + 1)}
            disabled={page >= data.pages}
            style={[styles.pageBtn, page >= data.pages && styles.pageBtnDisabled]}
          >
            <Text style={styles.pageBtnText}>{t('search.next')}</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.dark,
    marginTop: 16,
  },
  emptyText: {
    fontSize: 15,
    color: COLORS.textSecondary,
    marginTop: 8,
    textAlign: 'center',
  },
  loginBtn: {
    marginTop: 20,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 10,
  },
  loginBtnText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 15,
  },
  count: {
    fontSize: 14,
    color: COLORS.textSecondary,
    padding: 16,
    paddingBottom: 8,
  },
  list: {
    padding: 8,
  },
  row: {
    justifyContent: 'space-between',
    paddingHorizontal: 8,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  pageBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  pageBtnDisabled: {
    opacity: 0.4,
  },
  pageBtnText: {
    color: COLORS.primary,
    fontWeight: '600',
    fontSize: 14,
  },
  pageInfo: {
    color: COLORS.textSecondary,
    fontSize: 14,
  },
});
