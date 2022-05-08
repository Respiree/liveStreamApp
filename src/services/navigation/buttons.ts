//Top bar buttons
import Images from '../../global/Images';

const TopBarButtons = {
  Profile_Enable: {
    id: 'profileEnable',
    icon: Images.TOP_BAR_PROFILE_ACTIVE,
    /*component: {
      id: 'ROUND_COMPONENT',
      name: Screens.RoundButton,
      passProps: {
        title: 'Two',
        timesCreated: 1,
      },
    },*/
  },
  Profile_Disable: {
    id: 'profileDisable',
    icon: Images.TOP_BAR_PROFILE,
  },
  Sync_Enable: {
    id: 'syncEnable',
    icon: Images.TOP_BAR_SYNC_ACTIVE,
  },
  Sync_Disable: {
    id: 'syncDisable',
    icon: Images.TOP_BAR_SYNC,
  }
};


export {
  TopBarButtons,
}