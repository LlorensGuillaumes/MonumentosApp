import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTranslation } from 'react-i18next';
import {
  authLogin, authRegister, authGoogle, authMe, authUpdate,
  getFavoritoIds, addFavorito, removeFavorito,
} from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const { i18n } = useTranslation();
  const [user, setUser] = useState(null);
  const [favoritoIds, setFavoritoIds] = useState(new Set());
  const [loading, setLoading] = useState(true);

  // Cargar usuario guardado al iniciar
  useEffect(() => {
    (async () => {
      try {
        const token = await AsyncStorage.getItem('auth_token');
        const savedUser = await AsyncStorage.getItem('auth_user');
        if (token && savedUser) {
          const u = JSON.parse(savedUser);
          setUser(u);
          // Verificar token con el servidor
          try {
            const freshUser = await authMe();
            setUser(freshUser);
            await AsyncStorage.setItem('auth_user', JSON.stringify(freshUser));
          } catch {
            // Token expirado
            await AsyncStorage.multiRemove(['auth_token', 'auth_user']);
            setUser(null);
          }
        }
      } catch {} finally {
        setLoading(false);
      }
    })();
  }, []);

  // Cargar favoritos al tener usuario
  useEffect(() => {
    if (user) {
      getFavoritoIds()
        .then(ids => setFavoritoIds(new Set(ids)))
        .catch(() => setFavoritoIds(new Set()));
    } else {
      setFavoritoIds(new Set());
    }
  }, [user]);

  // Aplicar idioma del usuario al login (solo cuando cambia el usuario)
  useEffect(() => {
    if (user?.idioma_por_defecto) {
      i18n.changeLanguage(user.idioma_por_defecto);
    }
  }, [user?.idioma_por_defecto]); // eslint-disable-line react-hooks/exhaustive-deps

  const saveAuth = async (token, userData) => {
    await AsyncStorage.setItem('auth_token', token);
    await AsyncStorage.setItem('auth_user', JSON.stringify(userData));
    setUser(userData);
  };

  const login = useCallback(async (email, password) => {
    const { token, user: u } = await authLogin({ email, password });
    await saveAuth(token, u);
    return u;
  }, []);

  const register = useCallback(async (email, password, nombre, idioma_por_defecto) => {
    const { token, user: u } = await authRegister({ email, password, nombre, idioma_por_defecto });
    await saveAuth(token, u);
    return u;
  }, []);

  const loginWithGoogle = useCallback(async (googleData) => {
    const { token, user: u } = await authGoogle(googleData);
    await saveAuth(token, u);
    return u;
  }, []);

  const logout = useCallback(async () => {
    await AsyncStorage.multiRemove(['auth_token', 'auth_user']);
    setUser(null);
    setFavoritoIds(new Set());
  }, []);

  const updateProfile = useCallback(async (data) => {
    const u = await authUpdate(data);
    setUser(u);
    await AsyncStorage.setItem('auth_user', JSON.stringify(u));
    return u;
  }, []);

  const toggleFavorito = useCallback(async (bienId) => {
    if (!user) return false;
    const isFav = favoritoIds.has(bienId);
    // Optimistic update
    setFavoritoIds(prev => {
      const next = new Set(prev);
      if (isFav) next.delete(bienId);
      else next.add(bienId);
      return next;
    });
    try {
      if (isFav) await removeFavorito(bienId);
      else await addFavorito(bienId);
      return !isFav;
    } catch {
      // Revert
      setFavoritoIds(prev => {
        const next = new Set(prev);
        if (isFav) next.add(bienId);
        else next.delete(bienId);
        return next;
      });
      return isFav;
    }
  }, [user, favoritoIds]);

  const isFavorito = useCallback((bienId) => {
    return favoritoIds.has(bienId);
  }, [favoritoIds]);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        favoritoIds,
        login,
        register,
        loginWithGoogle,
        logout,
        updateProfile,
        toggleFavorito,
        isFavorito,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
