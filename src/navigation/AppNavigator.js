import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { COLORS } from '../utils/colors';
import LanguageSelector from '../components/LanguageSelector';

import HomeScreen from '../screens/HomeScreen';
import SearchScreen from '../screens/SearchScreen';
import MapScreen from '../screens/MapScreen';
import DetailScreen from '../screens/DetailScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function TabNavigator() {
  const { t } = useTranslation();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          if (route.name === 'Inicio') iconName = focused ? 'home' : 'home-outline';
          else if (route.name === 'Buscar') iconName = focused ? 'search' : 'search-outline';
          else if (route.name === 'Mapa') iconName = focused ? 'map' : 'map-outline';
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
        headerRight: () => <LanguageSelector />,
      })}
    >
      <Tab.Screen
        name="Inicio"
        component={HomeScreen}
        options={{ title: t('header.title'), tabBarLabel: t('nav.home') }}
      />
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
        headerRight: () => <LanguageSelector />,
      }}
    >
      <Stack.Screen
        name="Tabs"
        component={TabNavigator}
        options={{ headerShown: false }}
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
