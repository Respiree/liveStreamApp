import { hydrateStores } from './stores';
import { initServices, services } from './services';
import { setOptionsForUseStyles } from './hooks/useStyles';
import Amplify, {Auth} from 'aws-amplify';
import { withAuthenticator } from 'aws-amplify-react-native';
import * as Font from 'expo-font';
const fonts = {
  'karla_bold': require('../assets/fonts/karla/karla_bold.ttf'),
  'karla_bolditalic': require('../assets/fonts/karla/karla_bolditalic.ttf'),
  'karla_regular': require('../assets/fonts/karla/karla_regular.ttf'),
  'karla_italic': require('../assets/fonts/karla/karla_italic.ttf'),
};
Amplify.configure({
  Auth: {
      /*identityPoolId: 'ap-southeast-1:f091bc7c-5265-44be-ae98-08506d04afe1​',
      region: 'ap-southeast-1',
      userPoolId: 'ap-southeast-1_yjXyh6PvV',
      userPoolWebClientId: '3lc5372sgsav4nu3av7f1g38tu'*/
      identityPoolId: 'us-east-1:bcf63865-a067-427f-ae99-83820a5e6540​',
      region: 'us-east-1',
      userPoolId: 'us-east-1_olKqLNilI',
      userPoolWebClientId: '5mv03nijkvf35s1sienltmsq8j'
  },
  Analytics: {
    disabled: true,
  },
})
console.disableYellowBox = true;

export const startApp = async () => {
  //await Font.loadAsync(fonts);
  // rehydrate stores
  await hydrateStores();

  //set options for useStyles before init services
  setOptionsForUseStyles({
    normalize: true,
    darkmode: false,
  });

  // init services
  await initServices();

  // here you can start the app depending on auth state.
  //await services.nav.initialize();
  await services.nav.startApp();
};

//export default withAuthenticator(startApp);
