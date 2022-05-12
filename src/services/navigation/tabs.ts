import { Options } from 'react-native-navigation';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Images from 'src/global/Images';

const TabTitles: TabTitlesType = ["LIVE DATA"];// ["DASHBOARD", "TRENDS", "LIVE DATA"];//"BREATHING MONK"/*,  "EVENT DATA"*/];

const loadTabIcons = async (): Promise<TabIcons> => {
  // getting icons for tabs as they have to be as image sources
  const [tab1, tab2] = await Promise.all([
    Ionicons.getImageSource('ios-rocket-outline', 25),
    Ionicons.getImageSource('ios-cog-outline', 25),
  ]);


  return [
    {
      icon: {
        uri: 'dashboard'
      },
      selectedIcon: {
        uri: 'dashboard_active'
      },
    },
    {
      icon: {
        uri: 'trends'
      },
      selectedIcon: {
        uri: 'trends_active'
      },
    },
    /*{
      icon: {
        uri: 'live_data'
      },
      selectedIcon: {
        uri: 'live_data'
      },
    },*/
    {
      icon: {
        uri: 'breathing'
      },
      selectedIcon: {
        uri: 'breathing_active'
      },
    },
    // {
    //   icon: {
    //     uri: 'event'
    //   },
    //   selectedIcon: {
    //     uri: 'event_active'
    //   },
    // }
  ];
}

const getTabOptions = async (): Promise<Options[]> => {
  const tabIcons = await loadTabIcons();

  return TabTitles.map((text, i) => ({
    bottomTab: { text }
  }));
}

export {
  TabTitles,
  getTabOptions,
}
