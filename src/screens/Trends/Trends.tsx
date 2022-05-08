import React ,{useEffect, useState} from 'react';
import {
    ScrollView,
    Text,
    View,
    TouchableOpacity,
    Alert,
    Platform
} from 'react-native';
import { observer } from 'mobx-react';
import { NavigationFunctionComponent } from 'react-native-navigation';

import { useStores } from 'src/stores';
import { useServices } from 'src/services';
import useStyles from 'src/hooks/useStyles';
import { screens } from 'src/services/navigation/screens';
import { ScaledSheet, s, vs, ms, mvs } from 'react-native-size-matters';
import TopBar from 'src/components/TopBar';
import useConstants from 'src/hooks/useConstants';
import moment from 'moment';
import DailyChart from './DailyChart';
import MonthlyChart from './MonthlyChart';

import { ButtonTitle } from 'src/components/Button';
import {
  TabView,
  TabBar,
  SceneMap,
  NavigationState,
  SceneRendererProps,
} from 'react-native-tab-view';
import { ModeType } from 'src/stores/bluetooth';

type State = NavigationState<{
  key: string;
  title: string;
}>;

const Component: NavigationFunctionComponent = observer(({
  componentId,
}) => {
  const { bluetooth, patient} = useStores();
  const { } = useServices();
  const { styles } = useStyles(_styles);
  const { colors, sizes } = useConstants();
  const { nav, t} = useServices();

  const routes = [
    { key: 'daily', title:  t.do("daily")},
    { key: 'monthly', title: t.do("monthly") }
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

  const viewLiveData=()=>{
    console.log("ble mode========",bluetooth.getMode())
    if(bluetooth.getMode() == 0 || bluetooth.getMode() == ModeType.LIVE_MODE || bluetooth.getMode() == ModeType.PULL_MODE){
      bluetooth.setMode(ModeType.LIVE_MODE)
      nav.pushScreen(componentId, screens.live_data.id, null, {bottomTabs:{visible: false, drawBehind: true, animate: true}})
    }
    
    // if(patient.isRegister && bluetooth.isOn && bluetooth.connected && bluetooth.connectedId){
    //   nav.pushScreen(componentId, screens.live_data.id)
    // }else{
    //   Alert.alert(t.do("error"),t.do("enable_ble"));
    // }
  }

  const renderTabBar = (
    props: SceneRendererProps & { navigationState: State }
  ) => (
    <TabBar
      {...props}
      scrollEnabled
      activeColor={colors.main}
      inactiveColor={colors.very_light_grey}
      indicatorStyle={styles.indicator}
      style={styles.tabbar}
      labelStyle={styles.label}
      tabStyle={styles.tabStyle}
    />
  );
  const renderScene = SceneMap({
    daily: DailyChart,
    monthly: MonthlyChart
  });

  return (
    <View style={{flex:1}}>
      <View style={{flex:.1, marginLeft: sizes.margin, marginTop: Platform.OS==="android"?0:40}}>
        <TopBar/>
      </View>
      <TabView
        initialLayout={{ width: ms(160,0.5) }}
        navigationState={state}
        renderScene={renderScene}
        renderTabBar={renderTabBar}
        onIndexChange={handleIndexChange}
      />
      <TouchableOpacity
        style={{
          alignItems:'center',
          justifyContent:'center',
          position: 'absolute',                                          
          top: Platform.OS==="android"?60:120,                                                 
          right: 20,
          backgroundColor:'#fff',
        }}
        onPress={viewLiveData}
      >
        <Text style={{color:colors.main, 
        fontFamily:'karla_bold',
        fontSize: ms(14, 0.8)}}>Live data</Text>
      </TouchableOpacity>
    </View>
  );
});

const _styles = (theme: ThemeType) => ScaledSheet.create({
  contentContainer: {
    flex: .9,
    padding: ms(theme.sizes.margin),
    width: '100%',
    height:'100%',
  },
  text: {
    fontSize: 20,
    margin: ms(theme.sizes.s),
    textAlign: 'center',
    color: theme.colors.text,
  },
  buttonText:{
    backgroundColor:theme.colors.main,
    height:50,
    fontSize: ms(20, 0.8),
    margin: 0,
    width:'100%'
  },
  tabbar: {
    backgroundColor: 'white',
    height: 40,
    elevation: 0, //disable the inactive indicator 
  },
  indicator: {
    backgroundColor: theme.colors.main,
    height: 4,
    width:ms(80, 0.5),
  },
  label: {
    fontFamily:'karla_bold',
    fontSize: ms(14, 0.8),
    width: ms(80, 0.5),
    textAlign:'center'
  },
  tabStyle: {
    width: ms(80, 0.5),
  },
});

Component.options = props => screens.trends.options();

export const Trends = Component;
