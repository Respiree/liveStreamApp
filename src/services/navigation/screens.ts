import {Dashboard} from 'src/screens/Dashboard';
import {Breathing} from 'src/screens/Breathing';
import {EventData} from 'src/screens/EventData';
import {Trends} from 'src/screens/Trends';
import Profile from 'src/screens/Profile/Profile';
import SyncModal from 'src/components/SyncModal';
import BleConErr from 'src/components/BleConErr';
import Spinner from 'src/components/Spinner';
import Initializing from 'src/screens/Initiliazing';
import LiveData from 'src/screens/LiveData';
import { TopBarButtons } from './buttons';
import { Options, OptionsModalPresentationStyle } from 'react-native-navigation';

// Here we define all information regarding screens

type Screen = {
  id: string;
  options: () => Options;
}
type ScreenName =
  'dashboard' |
  'trends' |
  'breathing' |
  'event' |
  'profile'|
  'screen_modal' |
  'ble_conn_err_modal'|
  'spinner'|
  'initializing'|
  'live_data';

const withPrefix = (s: string) => `screen.${s}`;

const screens: Record<ScreenName, Screen> = {
  dashboard: {
    id: withPrefix('Dashboard'),
    options: () => ({
      topBar: { visible: false },
    })
  },
  trends: {
    id: withPrefix('Trends'),
    options: () => ({
      topBar: { visible: false },
      animations: {
        push: {
          content: {
            translationX: {
              from: require('react-native').Dimensions.get('window').width,
              to: 0,
              duration: 300
            }
          }
        }
      }
    })
  },
  breathing: {
    id: withPrefix('Breathing'),
    options: () => ({
      topBar: { visible: false },
    })
  },
  event: {
    id: withPrefix('Event'),
    options: () => ({
      topBar: { visible: false },
    })
  },
  profile: {
    id: withPrefix('Profile'),
    options: () => ({
      topBar: { visible: false }
    })
  },
  ble_conn_err_modal: {
    id: withPrefix('BleConnErr'),
    options: () => ({
      topBar: { visible: false }
    })
  },
  screen_modal:{
    id: withPrefix('SyncModal'),
    options:()=>({
      overlay:{interceptTouchOutside:false},
      topBar: { visible: false },
      statusBar:{
        visible:false,
        hideWithTopBar:true,
        drawBehind:true
      },
      layout: { componentBackgroundColor: 'transparent' },
      modalPresentationStyle: OptionsModalPresentationStyle.fullScreen
    })
  },
  spinner: {
    id: withPrefix('Spinner'),
    options: () => ({
      topBar: { visible: false }
    })
  },
  initializing:{
    id: withPrefix('Initializing'),
    options:() =>({
      topBar: {visible:false},
      statusBar:{
        visible:false,
        hideWithTopBar:true
      },
      layout: { componentBackgroundColor: 'transparent' },
      modalPresentationStyle: OptionsModalPresentationStyle.fullScreen
    })
  },
  live_data: {
    id: withPrefix('LiveData'),
    options: () => ({
      topBar: { visible: false },
      bottomTabs:{
        visible:false
      }
    })
  },
}

const Screens = new Map<string, React.FC<any>>();
Screens.set(screens.dashboard.id, Dashboard);
Screens.set(screens.event.id, EventData);
Screens.set(screens.trends.id, Trends);
Screens.set(screens.breathing.id, Breathing);
Screens.set(screens.profile.id, Profile);
Screens.set(screens.screen_modal.id, SyncModal);
Screens.set(screens.ble_conn_err_modal.id, BleConErr);
Screens.set(screens.spinner.id, Spinner);
Screens.set(screens.initializing.id, Initializing);
Screens.set(screens.live_data.id, LiveData);

export default Screens;
export {
  screens,
};