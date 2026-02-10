import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import './src/i18n';
import { AppProvider } from './src/context/AppContext';
import AppNavigator from './src/navigation/AppNavigator';

export default function App() {
  return (
    <AppProvider>
      <NavigationContainer>
        <AppNavigator />
        <StatusBar style="light" />
      </NavigationContainer>
    </AppProvider>
  );
}
