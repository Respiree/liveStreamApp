import React, {useState} from 'react';
import { Image, View, Text, TouchableOpacity, Alert } from 'react-native';
import Images from 'src/global/Images';
import { screens } from 'src/services/navigation/screens';
import useStyles from 'src/hooks/useStyles';
import useConstants from 'src/hooks/useConstants';
import { useServices } from 'src/services';
import { ScaledSheet, s, vs, ms, mvs } from 'react-native-size-matters';
import { useStores } from 'src/stores';
import _ from 'lodash';
import { Colors } from 'react-native/Libraries/NewAppScreen';
import Icon from 'react-native-vector-icons/FontAwesome5';

const TopBar: React.FC = (
props: {liveRR:any}) => {
  const { styles } = useStyles(_styles);
  const { nav, t} = useServices();
  const { ui, patient, bluetooth} = useStores();
  const [update, setUpdate] = useState(false);
  const { colors, sizes ,options } = useConstants();
  const showSyncModal = ()=>{

    if(bluetooth.isOn){
      if(bluetooth.savedRecords && bluetooth.savedRecords.recordCollectedBySensor>0){
        nav.showSync();
        setTimeout(function(){setUpdate(!update)}, 5000)
      }else{
        if(!patient.isRegister){
          Alert.alert(t.do("error"),t.do("invalid_patient"));
        }
        else if(_.isEmpty(patient.sensors)) {
          Alert.alert(t.do("error"),t.do("enable_ble"));
        }else
          Alert.alert(t.do("info"), t.do("record_synced_msg"))
      }
    }
    else
      nav.showBleConnErr();
  }

  const showProfile = ()=>{
    nav.showProfile();
  }

  const disconnectDevice =()=>{
    if(bluetooth.connected && bluetooth.connectedId && !(bluetooth.gatewayMode && patient.isRegister))
      bluetooth.disconnectDevice(bluetooth.connectedId)
  }
  
  return (
    <View style={styles.topContainer}>
      <Image style={styles.profile} source={Images.COMPANY_ICON}/>
      <Text style={styles.text}>Respiree Respiration Trace</Text>

       {/*   <TouchableOpacity onPress={disconnectDevice} style={{backgroundColor:(!(bluetooth.gatewayMode && patient.isRegister)&&bluetooth.connected)?colors.main:colors.very_light_grey, paddingLeft:ms(12,0.5), paddingVertical:ms(8,0.5), paddingRight:ms(8,0.5), borderTopLeftRadius:ms(15, 0.5), borderBottomLeftRadius:ms(15, 0.5)}}>
          <Text style={{fontFamily:'karla_regular', fontSize:ms(12,0.8), color:(!(bluetooth.gatewayMode && patient.isRegister)&&bluetooth.connected)?'white':colors.brownGrey}}>{t.do("disconnect")}</Text>
        </TouchableOpacity>   */}
         <View /* onPress={disconnectDevice} */ style={{backgroundColor:colors.main, paddingLeft:ms(12,0.5), paddingVertical:ms(8,0.5), paddingRight:ms(8,0.5), borderTopLeftRadius:ms(15, 0.5), borderBottomLeftRadius:ms(15, 0.5)}}>
          <Text style={{fontFamily:'karla_regular', fontSize:ms(12,0.8), color:"white"}}>{"RR (BPM)"}</Text>
          <Text style={{fontFamily:'karla_regular', fontSize:ms(26,0.8), color:"white"}}>{props.liveRR}
           {'  '}<Icon name="lungs" size={15} color="white"/>
          </Text>
        </View>         
        {/* <Text>RR</Text> */}
    </View>
  )
}


const _styles = (theme: ThemeType) => ScaledSheet.create({
    topContainer:{
        flex: 1,
        alignItems:'center',
        backgroundColor: theme.colors.bg,
        justifyContent:'space-between',
        flexDirection:'row',
    
    },
    syncImg:{
      height: 30,
      width: 98,
      backgroundColor:theme.colors.bg
    },
    profile:{
        height: 30,
        width:30
    },
    text: {
        fontSize: 12,
        margin: ms(theme.sizes.s, 0.8),
        textAlign: 'center',
        color: theme.colors.text,
    },
});

export default TopBar;