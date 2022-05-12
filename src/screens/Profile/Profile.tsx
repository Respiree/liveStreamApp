import React , {useState, useEffect}from 'react';
import {View, Dimensions } from 'react-native';
import { useServices } from 'src/services';
import useStyles from 'src/hooks/useStyles';
import { ButtonTitle, ButtonIcon } from 'src/components/Button';
import { ScaledSheet, s, vs, ms, mvs } from 'react-native-size-matters';
import useConstants from 'src/hooks/useConstants';
import { observer } from 'mobx-react';
import { useStores } from 'src/stores';
import Images from 'src/global/Images';

import { NavigationFunctionComponent } from 'react-native-navigation';
import {
  TabView,
  TabBar,
  SceneMap,
  NavigationState,
  SceneRendererProps,
} from 'react-native-tab-view';
type State = NavigationState<{
  key: string;
  title: string;
}>;
import UserProfile from './UserProfile';
import Settings from './Settings';

const Profile: React.FC  = observer(({
  componentId,
}) => {
  const { styles } = useStyles(_styles);
  const { colors } = useConstants();
  const { nav, t} = useServices();
  const { ui, patient, bluetooth} = useStores();
  const routes = [
    //{ key: 'user', title:  t.do("profile_tab_title")},
    { key: 'setting', title: t.do("settings_tab_title") }
  ]
  let initialState = {
    index: 0,
    routes: routes,
  };

  const [ state, setState ] = useState(initialState);
  const handleIndexChange =( index:number ) =>{
    initialState = {
      index: index,
      routes: routes,
    };
    setState(initialState);
  }
  const renderTabBar = (
    props: SceneRendererProps & { navigationState: State }
  ) => (
    <TabBar
      {...props}
      scrollEnabled
      activeColor={colors.darkGrey}
      inactiveColor={colors.very_light_grey}
      indicatorStyle={styles.indicator}
      style={styles.tabbar}
      labelStyle={styles.label}
      tabStyle={styles.tabStyle}
    />
  );

  const renderScene = SceneMap({
    user: UserProfile,
    setting: Settings
  });

    return (
      <View style={styles.root} key={'overlay'}>
        <View style={styles.alert}>
{/*           <View style={{alignSelf:'center', borderRadius:50, backgroundColor:'white', marginBottom:vs(10)}}>
            <ButtonIcon icon={'close'} onPress={()=>nav.dismissAllOverlays()} />
          </View> */}
          <TabView
            navigationState={state}
            renderScene={renderScene}
            renderTabBar={renderTabBar}
            onIndexChange={handleIndexChange}
            initialLayout={{ width: Dimensions.get('window').width }}
          />
        </View>
      </View>
    );
});

export default Profile;

const _styles = (theme: ThemeType) => ScaledSheet.create({
  root: {
    backgroundColor:'rgba(0,0,0,0.7)',
    position: 'absolute',
    height: '100%',
    width:'100%',
    justifyContent:'flex-end',
    bottom:0,
    left: 0,
    right: 0,
    flex:1,
  },
  alert: {
    width: '100%',
    height: Dimensions.get('window').height*0.8,
    alignSelf:'flex-end',
    backgroundColor:'transparent',
    justifyContent:'flex-end'
  },
  tabbar: {
    width:'100%',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    backgroundColor: 'white',
  },
  indicator: {
    backgroundColor: theme.colors.darkGrey,
  },
  label: {
    fontFamily:'karla_bold',
    fontSize: ms(14, 0.3),
  },
  tabStyle: {
    width: Dimensions.get('window').width/2,
    borderBottomWidth: 1, borderColor: theme.colors.very_light_grey
  },
});
