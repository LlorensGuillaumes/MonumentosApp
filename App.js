import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import './src/i18n';
import { AppProvider } from './src/context/AppContext';
import { AuthProvider } from './src/context/AuthContext';
import AppNavigator from './src/navigation/AppNavigator';

export default function App() {
  return (
    <AppProvider>
      <AuthProvider>
        <NavigationContainer>
          <AppNavigator />
          <StatusBar style="light" />
        </NavigationContainer>
      </AuthProvider>
    </AppProvider>
  );
}
