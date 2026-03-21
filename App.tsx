/**
 * NTD Affiliate App
 * CÔNG TY CỔ PHẦN GIÁO DỤC COEDU
 */
import 'react-native-gesture-handler';
import React from 'react';
import { StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppNavigator } from './src/navigation/AppNavigator';

function App() {
  return (
    <SafeAreaProvider>
      <StatusBar barStyle="dark-content" backgroundColor="#F5F7FA" />
      <AppNavigator />
    </SafeAreaProvider>
  );
}

export default App;
