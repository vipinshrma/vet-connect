import 'react-native-get-random-values';
import { useFonts } from 'expo-font';
import { StatusBar } from 'expo-status-bar';
import { Provider } from 'react-redux';
import { NavigationContainer } from '@react-navigation/native';
import 'react-native-reanimated';
import '../global.css';

import { store } from '../src/store';
import AppNavigator from '../src/navigation/AppNavigator';

export default function RootLayout() {
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  if (!loaded) {
    // Async font loading only occurs in development.
    return null;
  }

  return (
    <Provider store={store}>
      {/* <NavigationContainer> */}
        <AppNavigator />
      {/* </NavigationContainer> */}
      <StatusBar style="auto" />
    </Provider>
  );
}
