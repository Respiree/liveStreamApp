import 'expo-asset';
import 'react-native-gesture-handler';
import { Navigation } from 'react-native-navigation';
import { registerRootComponent } from 'expo';
import { Thread } from 'react-native-threads';
import { startApp } from './src/App';
import ExpoApp from './src/screens/ExpoApp';
/* const workerThread = new Thread('./src/utils/rr_conversion/rr_thread.js'); */
registerRootComponent(ExpoApp); // Without this line, it was causing a crash on iOS (14?) in release build
Navigation.events().registerAppLaunchedListener(() => {
    startApp();
});