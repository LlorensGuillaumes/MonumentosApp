import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { COLORS } from '../utils/colors';

import HomeScreen from '../screens/HomeScreen';
import SearchScreen from '../screens/SearchScreen';
import MapScreen from '../screens/MapScreen';
import DetailScreen from '../screens/DetailScreen';
import LoginScreen from '../screens/LoginScreen';
import FavoritosScreen from '../screens/FavoritosScreen';
import ContactScreen from '../screens/ContactScreen';
import ProposeScreen from '../screens/ProposeScreen';
import MyProposalsScreen from '../screens/MyProposalsScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function TabNavigator() {
  const { t } = useTranslation();
  const { user, favoritoIds } = useAuth();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          if (route.name === 'Inicio') iconName = focused ? 'home' : 'home-outline';
          else if (route.name === 'Buscar') iconName = focused ? 'search' : 'search-outline';
          else if (route.name === 'Mapa') iconName = focused ? 'map' : 'map-outline';
          else if (route.name === 'Favoritos') iconName = focused ? 'heart' : 'heart-outline';
          else if (route.name === 'Proponer') iconName = focused ? 'add-circle' : 'add-circle-outline';
          else if (route.name === 'Contacto') iconName = focused ? 'mail' : 'mail-outline';
          else if (route.name === 'Login') iconName = focused ? 'log-in' : 'log-in-outline';
          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textSecondary,
        tabBarStyle: {
          backgroundColor: COLORS.surface,
          borderTopColor: COLORS.border,
        },
        headerStyle: {
          backgroundColor: COLORS.dark,
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: '600',
        },
      })}
    >
      <Tab.Screen
        name="Inicio"
        component={HomeScreen}
        options={{ title: t('header.title'), tabBarLabel: t('nav.home') }}
      />
      {user ? (
        <>
          <Tab.Screen
            name="Buscar"
            component={SearchScreen}
            options={{ title: t('search.title'), tabBarLabel: t('nav.search') }}
          />
          <Tab.Screen
            name="Mapa"
            component={MapScreen}
            options={{ title: t('map.title'), tabBarLabel: t('nav.map') }}
          />
          <Tab.Screen
            name="Favoritos"
            component={FavoritosScreen}
            options={{
              title: t('favorites.title'),
              tabBarLabel: t('nav.favorites'),
              tabBarBadge: favoritoIds.size > 0 ? favoritoIds.size : undefined,
            }}
          />
          <Tab.Screen
            name="Proponer"
            component={ProposeScreen}
            options={{ title: t('proposal.title'), tabBarLabel: t('nav.propose') }}
          />
        </>
      ) : (
        <Tab.Screen
          name="Login"
          component={LoginScreen}
          options={{
            title: t('auth.loginTitle'),
            tabBarLabel: t('nav.login'),
          }}
        />
      )}
      <Tab.Screen
        name="Contacto"
        component={ContactScreen}
        options={{ title: t('contact.title'), tabBarLabel: t('nav.contact') }}
      />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  const { t } = useTranslation();

  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: COLORS.dark },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: '600' },
        headerBackTitleVisible: false,
      }}
    >
      <Stack.Screen
        name="Tabs"
        component={TabNavigator}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="MyProposals"
        component={MyProposalsScreen}
        options={{ title: t('proposal.myProposals') }}
      />
      <Stack.Screen
        name="Detail"
        component={DetailScreen}
        options={({ route }) => ({
          title: route.params?.title || t('detail.defaultTitle'),
          headerTitleStyle: { fontWeight: '600', fontSize: 16 },
        })}
      />
    </Stack.Navigator>
  );
}
