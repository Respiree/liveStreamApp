import { Navigation, Options } from 'react-native-navigation';
import { Root, BottomTabs, StackWith, Component } from './layout';
import { screens } from './screens';
import NavigationSystem from './system';
import { getTabOptions } from './tabs';

class NavigationService extends NavigationSystem implements IService {
  init = async () => {
    await this.initSystem();
  }

  // pushSettings = async (cId: string) => {
  //   this.push(cId, screens.settings.id);
  // }

  // showSettings = async () => {
  //   thi  s.show(screens.settings.id);
  // }

  pushScreen = async<T>(cId: string, screenId:string,passProps?: T, options?: Options )=>{
    this.push(cId, screenId, passProps, options)
  }

  popScreen = async<T>(cId: string )=>{
    this.pop(cId)
  }

  showSpinner = async () => {
    this.showOverlay(screens.spinner.id);
  }

  showProfile = async<T> (props?:T) => {
    this.showOverlay(screens.profile.id, props);
  }

  showSync = async () => {
    this.showOverlay(screens.screen_modal.id);
  }

  showBleConnErr = async () => {
    this.showOverlay(screens.ble_conn_err_modal.id);
  }

  // APP

  startApp = async () => {
    const tabOptions = await getTabOptions();
    //console.log("screens.dashboard.id",screens.dashboard.id, screens.trends.id,screens.breathing.id)

    await Navigation.setRoot(
      Root(
        BottomTabs([
          /*StackWith(
            Component(screens.dashboard.id),
            { ...tabOptions[0] },
          ),
          StackWith(
            Component(screens.trends.id),
            { ...tabOptions[1] },
        ),*/
          StackWith(
            //Component(screens.breathing.id),
            Component(screens.live_data.id),
            { ...tabOptions[0] },
          ),
        ])
      )
    );
  }

  initialize = async()=>{
    Navigation.setRoot({
      root: {
        component: {
          name: screens.initializing.id
        }
      },
    });
  }
}

export default new NavigationService();
