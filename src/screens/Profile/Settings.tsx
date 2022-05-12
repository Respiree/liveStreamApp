import React, {useState, useEffect} from 'react';
import { View, Text, TextInput, Image, ScrollView, FlatList, TouchableOpacity, TouchableHighlight, Alert, Switch, Platform, Animated} from 'react-native';
import { observer } from 'mobx-react';
import { useStores } from 'src/stores';
import useStyles from 'src/hooks/useStyles';
import { ButtonTitle, ButtonFontAwesomeIcon } from 'src/components/Button';
import { ScaledSheet, s, vs, ms, mvs } from 'react-native-size-matters';
import { useServices } from 'src/services';
import useConstants from 'src/hooks/useConstants';
import Images from 'src/global/Images';
import { BleCallback, ErrType, SuccessType, BleSensorConstant, ModeType } from 'src/stores/bluetooth';
import Toast from 'react-native-simple-toast';
import _ from 'lodash';
import Icon from 'react-native-vector-icons/Ionicons';
import { useNavigationComponentDidAppear } from 'react-native-navigation-hooks/dist/hooks';
import { ButtonIcon } from 'src/components/Button';

type SpaceProps = {
  width?:number,
  height?:number
}

let sendRecord = false;
let savedTotReceived = 0;
let reconnecting = false;
let mStartDate = null;
let mLastUpdateSec = -1;

const DEFAULT_PATIENT_ID = 888;
const SETTINGS_DISPLAY_UPDATE_SEC = 2;
const COMPONENT_TAG = "Settings"

const Settings: React.FC = observer(({
    componentId,
  }) => {
    const { colors } = useConstants();
    const { styles } = useStyles(_styles);
    const { nav, t} = useServices();
    const { patient, bluetooth} = useStores();
    const [pwd, setPwd] = useState("")
    const [currDevice, setCurrDevice] = useState("")
    const [session, setSession] = useState("")
    const [interval, setTimeInterval] = useState(0) //useState(1)
    const [noEvent, setNoEvent] = useState(100)
    const [restriction, setRestriction] = useState(false)
    const [scanDevices, setScanDevices] = useState([])
    const [bleConnecting, setBleConnecting] = useState("")
    const [updateUI, setUpdateUI] = useState(false)
    const [receiveTot, setReceiveTot] = useState(0);
    const timeoutRef = React.useRef(null);
    const [syncDone, setSyncDone] = useState(false);
    const [sensorRecords, setSensorRecords] = useState(0);
    const [currRecordCount, setCurrRecordCount] = useState(0);
    const [totalReceived, setTotalReceived] = useState(0);
    const [postCount, setPostCount] = useState(0);
    const [lapsedSec, setLapsedSec] = useState(0);

    const settingsBleCb:BleCallback = (err:any, result:any)=>{

      if(!err){
        if(result){
          if(result === SuccessType.Ble_State_Changed){
            //console.log("Settings====", err, "Ble state change");
            if(bluetooth.isOn && patient.sensors.length>0){//patient has register sensor before

            }else if(!bluetooth.isOn){
              Toast.show(t.do("ble_off"), Toast.SHORT);
              //console.log("updateUI",updateUI);
              setUpdateUI(!updateUI)
            }
          }
          else if(result.type && result.type === SuccessType.Ble_Status_Changed){
            //console.log("Settings====", err, "Ble status change");
            if(result.syncDone){
              setSyncDone(true);
              reconnecting = false

              bluetooth.setMode(0);
            }
            if(!bluetooth.connected){
              reconnecting = false;
              sendRecord = false;
              setBleConnecting("")
              Toast.show(t.do("ble_disconnected"), Toast.SHORT);
              setUpdateUI(!updateUI)
            }
          }
          else if(result.type && result.type === SuccessType.Ble_Syncing_Record){
            console.log("result=====", result)
            if(result.noRecords <= 0){
              Alert.alert("Info", "No records to pull")
            }
            else if(result.noRecords > 0){
              //startTimeout();
            }
            else if(result.remaingRecords > 0){
              console.log("remaing records==============",result.remaingRecords)
              sendRecord = true;
              reconnecting = true;
            }
          }
          else if(result.type && result.type === SuccessType.Ble_Received_Data){

              let value = result.data.value;
              if(value[0] == BleSensorConstant.BLE_SENSOR_COMMAND_START_BYTE && value[1] == BleSensorConstant.BLE_SENSOR_COMMAND_RES_REGISTER_PATIENT_ID){ //Register patient response
                console.log("patient register response",value)
                if(value[4] == BleSensorConstant.BLE_SENSOR_RESPONSE_SUCCESS){
                  if(bluetooth.connected && bluetooth.connectedId){
                      //patient.registerOk(true);
                      Toast.show(t.do("patient_registered"), Toast.SHORT)
                      console.log("patient.id==========",patient.id)

                      bluetooth.sendCurrTime(bluetooth.connectedId, patient.id)
                      saveProfile(patient.id+"");
                  }
                  else{
                      Alert.alert(t.do("error"), t.do("patient_not_registered_ble_err"))
                      //Toast.show(t.do("ble_disconnected"), Toast.SHORT);
                  }
                } else {
                    Alert.alert(t.do("error"), t.do("patient_not_registered"))
                    //Toast.show(t.do("patient_not_registered"), Toast.SHORT);
                }
              }
              else if(value[0] == BleSensorConstant.BLE_SENSOR_COMMAND_START_BYTE && value[1] == BleSensorConstant.BLE_SENSOR_COMMAND_RES_SET_DEVICE_TIME){ //Register patient response
                console.log("set current time response: ",value)
                if(value[2] == 0xff && value[3] == 0xff){
                    Alert.alert(t.do("error"), t.do("patient_not_registered"))
                    //Toast.show(t.do("time_set_failed"), Toast.SHORT)
                } else {

                    let fIdx = _.findIndex(scanDevices, {id: bluetooth.connectedId})
                    console.log("Fidx", fIdx);
                    if(fIdx >= 0){
                      patient.addSensor(bluetooth.connectedId, scanDevices[fIdx].name, 15);
                      let dev = scanDevices;
                      dev.splice(fIdx, 1);
                      setScanDevices(dev);
                    }


                    Toast.show(t.do("time_set"), Toast.SHORT)

                    bluetooth.disconnectDevice(bluetooth.connectedId)
                }
              }

            // if(result.receive){
            //   updatePrgress(result.receive)
            // }
            //console.log("Ble_Received_Data==============" + bluetooth.currRecordCount + ", received: " + result.receive)

            /*if(result.receive && result.receive > 0) {
                savedTotReceived += result.receive;
            } else {
                savedTotReceived++;
            }

            if(mStartDate) {
                let skipDraw = true;

                const start = mStartDate;
                const end   = new Date();
                let diff = Math.abs(end-start) / 1000;
                let diffSec = parseInt(diff);

                if(mLastUpdateSec == -1 || (diffSec - mLastUpdateSec) >= SETTINGS_DISPLAY_UPDATE_SEC) {
                    skipDraw = false;
                }

                //console.log("mLastUpdateSec: " + mLastUpdateSec + " diffSec: " + diffSec)
                if(!skipDraw) {
                    setLapsedSec(parseInt(diffSec));
                    setCurrRecordCount(bluetooth.currRecordCount);
                    setSensorRecords(bluetooth.sensorRecords);
                    setTotalReceived(savedTotReceived);
                    setPostCount(bluetooth.postCount);

                    mLastUpdateSec = diffSec;
                }

            } else {
                mStartDate = new Date();
            }*/

          }
          else if(result.type && result.type === SuccessType.Discover_Success){
            //console.log("Ble callback 22222====", err, "Ble discover success", result.deviceId, result.deviceName);
            if (timeoutRef.current !== null) {
              clearTimeout(timeoutRef.current);
              timeoutRef.current = null;
            }
            let dev = scanDevices;
            let found = true;
            if(!_.isEmpty(dev)){
              let foundIdx = _.findIndex(dev, {id: result.deviceId})
              if(foundIdx < 0)
                found = false;
            }else{
              found = false;
            }
            if(patient.sensors.length>0){
              console.log("deviceId===",result.deviceId);
              let foundIdx = _.findIndex(patient.sensors, function(s){
                console.log("sensor id",s.id, result.deviceId)
                let sId = s.id.toString().toLowerCase().trim();
                let dId = result.deviceId.toString().toLowerCase().trim();
                return sId == dId;
              })
              if(foundIdx >= 0)
                found = true;
            }
            if(!found)
              dev.push({id: result.deviceId, name:result.deviceName, status: t.do("not_connected")})
            //console.log("dev",dev);
            setScanDevices(dev);
          }
          else if(result === SuccessType.Notification_Started){
            console.log("device connected!!!!!!!!!", bluetooth.connected, bluetooth.connectedId, "sendRecord",sendRecord);
            setBleConnecting("")
            if(bluetooth.connected && bluetooth.connectedId && !bluetooth.isScanning){
              sendRecord = false;
              //if(bluetooth.saveRecord()){
                bluetooth.setNewRecord(patient.id);
                bluetooth.registerPatient(bluetooth.connectedId, patient.id ? patient.id : DEFAULT_PATIENT_ID);
                //setSyncDone(false);
                //bluetooth.sendAllRecords(bluetooth.connectedId, patient.id)
              //}else{
                //Alert.alert(t.do("error"),t.do("upload_sensor_fail"));
              //}
            }
            else if(bluetooth.connected && bluetooth.connectedId && scanDevices.length>0){
              let fIdx = _.findIndex(scanDevices, {id: bluetooth.connectedId})
              console.log("Fidx", fIdx);
              if(fIdx >= 0){
                patient.addSensor(bluetooth.connectedId, scanDevices[fIdx].name, 15);
                let dev = scanDevices;
                dev.splice(fIdx, 1);
                setScanDevices(dev);
              }
            }
            else{
              setUpdateUI(!updateUI)
            }
          }
        }
      }else{
        if(err === ErrType.Connect_Fail || err === ErrType.Notification_Fail || err === ErrType.Scan_Fail){
          console.log("receive err===",err);
          setBleConnecting("")
          let msg = `${t.do("ble_disconnected")}`
          Toast.show(msg, Toast.SHORT);
          setUpdateUI(!updateUI)
          if (timeoutRef.current !== null) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
          }
          bluetooth.setMode(0);
        }
      }
    }

    const startTimeout = ()=>{
      if (timeoutRef.current !== null) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(()=> {
        timeoutRef.current = null;
        setBleConnecting("")
        setScanDevices([])
        bluetooth.stopScan();
        bluetooth.setMode(0);
      },10000);
    }

    useNavigationComponentDidAppear(() => {
      bluetooth.init();
    }, componentId);

    useEffect(() => {
      bluetooth.addBluetoothCallback(COMPONENT_TAG,settingsBleCb);
      return () => bluetooth.removeBluetoothCallback(COMPONENT_TAG);
    },[]);

    useEffect(()=>{
      if(!_.isEmpty(patient.sensors)){
        if(bluetooth.connected && bluetooth.connectedId){
          let foundIdx = _.findIndex(patient.sensors, function(s){
            let sId = s.id.toString().toLowerCase().trim();
            let dId = bluetooth.connectedId!.toString().toLowerCase().trim();
            return sId == dId;
          });
          console.log("found connected device",foundIdx)
          if(foundIdx>=0){
            var name = `${patient.sensors[foundIdx].id}`
            var session = `${patient.sensors[foundIdx].session} ${t.do("minutes")}`
            setCurrDevice(name);
            setSession(session)
          }
        }
      } else {
          setBleConnecting("")
      }
      if(patient.timeInterval)
        setTimeInterval(patient.timeInterval)
      setRestriction(patient.restriction)
      if(patient.noEvents)
        setNoEvent(patient.noEvents)
    }, [updateUI])

    const disablePwd = true;

    const collectData = ()=>{
      if(bluetooth.isScanning)
        return;
      if(bluetooth.gatewayMode && patient.isRegister){
        return;
      }
      if(!patient.isRegister){
          Alert.alert(t.do("error"),t.do("invalid_patient"));
        return;
      }
      if(!bluetooth.isOn){
          Alert.alert(t.do("error"),t.do("ble_off"));
        return;
      }
      if(_.isEmpty(patient.sensors)) {
          Alert.alert(t.do("error"),t.do("enable_ble"));
        return;
      }
      if(bluetooth.isBusy){
        Alert.alert(t.do("error"), t.do("ble_busy"));
        return;
      }
      if(bluetooth.savedRecords && bluetooth.savedRecords.recordCollectedBySensor > 0){
        Alert.alert(t.do("error"), t.do("existing_records"));
        return;
      }

      if(patient.sensors.length>0 && patient.sensors[0].id){
        if(bluetooth.isOn && bluetooth.connected && bluetooth.connectedId == patient.sensors[0].id)
        {
          //if(bluetooth.saveRecord()){
            bluetooth.setMode(ModeType.PULL_MODE)
            bluetooth.setNewRecord(patient.id);
            //bluetooth.sendAllRecords(bluetooth.connectedId, patient.id)
          //}else{
        //    Alert.alert(t.do("error"),t.do("upload_sensor_fail"));
          //}
        }
        else{
          console.log("connect device!!!!!!!!")
          sendRecord =true
          bluetooth.connectDevice(patient.sensors[0].id);
        }
      }
    }
    const flushData = ()=>{
      if(bluetooth.isBusy){
        Toast.show(t.do("ble_busy"), Toast.SHORT);
      }else{
        bluetooth.clearRecord();
        Alert.alert(t.do("info"), t.do("flush_msg"))
      }
    }

    const BottomSpace: React.FC<SpaceProps> = ({
      width,
      height
    })=>{
      return (
        <View style={{height:ms(height?height:16,0.5)}}/>
      )
    }

    const itemSelected = (item:any)=>{
      if(!_.isEmpty(bleConnecting)){
        return;
      }
      if(bluetooth.isBusy){
        Alert.alert(t.do("error"), t.do("ble_busy"));
        return;
      }
      setBleConnecting(item.id)
      bluetooth.stopScan();
      bluetooth.connectDevice(item.id);
    }

    const completed =()=>{
      console.log("complete!!!!");
      setSyncDone(false)
      bluetooth.setMode(0);
    }

    const cancelSyncing = ()=>{
      console.log("cancel!!!!!!!!!!!!!!!!!")
      reconnecting = false;
      sendRecord = false;
      bluetooth.cancelUploading();
      setBleConnecting("")
      bluetooth.setMode(0);
    }

    const scanBle = ()=>{
      if(bluetooth.isBusy){
        Alert.alert(t.do("error"), t.do("ble_busy"));
        return;
      }
      if(!_.isEmpty(bleConnecting)){
        return;
      }
      if(bluetooth.isOn){
        console.log("scan ble!!")
        setCurrDevice("")
        setSession("");
        setScanDevices([])
        setUpdateUI(!updateUI)
        bluetooth.scan();
        startTimeout();
      }else{
        Alert.alert(t.do("ble_off"))
      }
    }

    const connectDevice = (item:any)=>{
      if(!_.isEmpty(bleConnecting))
        return;
      if(bluetooth.isBusy){
        Alert.alert(t.do("error"), t.do("ble_busy"));
        return;
      }
      console.log("set connnecting id====",item.id)
      setBleConnecting(item.id);
      bluetooth.stopScan();
      bluetooth.connectDevice(item.id);
    }

    const updateInterval = (text:string)=>{
        let intval = 0;
        if(!_.isEmpty(text)){
          try{
            intval = Number.parseInt(text);
          }catch(err){
            intval = 0;
          }
          setTimeInterval(intval);
          patient.setTimeInterval(intval)
        }
    }

    const updateEvent = (text:string)=>{
      let noEvent = 0;
      if(!_.isEmpty(text)){
        try{
          noEvent = Number.parseInt(text);
        }catch(err){
          noEvent = 0;
        }
        setNoEvent(noEvent);
        patient.setNoEvent(noEvent)
      }
    }

    const onLongPress = (item)=>{
      Alert.alert(
        t.do("sensor_list_long_press_alert_title"),
        t.do("sensor_list_long_press_alert_msg"),
        [
          {
            text: t.do("set_default"),
            onPress: () => patient.setDefault(item.id)
          },
          {
            text: t.do("cancel"),
            onPress: () => console.log("Cancel Pressed"),
            style: "cancel"
          },
          { text: t.do("delete"), onPress: () => patient.removeSensor(item.id) }
        ]
      );

    }

    const renderScanItem = ({item})=>(
        <TouchableOpacity onPress={()=>connectDevice(item)}>
          <View style={{flexDirection:'row', marginVertical: ms(12, 0.5), marginHorizontal:ms(15,0.5), alignItems:'center'}}>
            <Icon name='bluetooth-outline' style={{width:'8%', fontSize:ms(14,0.8), color: colors.darkGrey}}/>
            <Text style={styles.listItemText}>{`${item.name}-${item.id}`}</Text>
            <Text style={styles.statusText}>{bleConnecting==item.id?t.do("connecting"):item.status}</Text>
          </View>
        </TouchableOpacity>
    )

    const renderItem = ({ item }) => (
        <TouchableOpacity onPress={()=>itemSelected(item)}  onLongPress={()=>onLongPress(item)}>
          <View style={{flexDirection:'row', marginVertical: ms(12, 0.5), marginHorizontal:ms(15,0.5), alignItems:'center'}}>
            <Icon name='bluetooth-outline' style={{width:'8%', fontSize:ms(14,0.8), color: colors.darkGrey}}/>
            <Text style={styles.listItemText}>{`${item.name}-${item.id}`}</Text>
            <Text style={styles.statusText}>{bluetooth.connected&&item.id==bluetooth.connectedId?t.do("connected"):!bluetooth.connected&&bleConnecting==item.id?t.do("connecting"):t.do("not_connected")}</Text>
          </View>
        </TouchableOpacity>
    );

    if(!bluetooth.isBusy && !syncDone){
      return(
      <ScrollView nestedScrollEnabled style={[styles.container, /* {paddingHorizontal:ms(20,0.5)} */]} contentContainerStyle={{flexGrow:1, paddingBottom: ms(50, 0.5) }}>
        <BottomSpace/>
        {
          !_.isEmpty(currDevice)?(
            <View>
              <Text style={styles.subtitle}>{t.do("product_id")}</Text>
              <BottomSpace height={5}/>
              <TextInput style={styles.edit_input}
                  defaultValue={currDevice}
                  editable={false}
                  underlineColorAndroid={colors.brownGrey}
                  multiline={false}/>
              <BottomSpace/>
              {/* <Text style={styles.subtitle}>{t.do("session_duration")}</Text>
              <BottomSpace height={5}/>
              <TextInput style={styles.edit_input}
                defaultValue={session}
                editable={false}
                underlineColorAndroid={colors.brownGrey}
                multiline={false}/>
              <BottomSpace/> */}
            </View>
          ):null
        }
        {
          !_.isEmpty(patient.sensors)?(
            <View >
            <View style={{alignSelf:'flex-end', backgroundColor:colors.main, marginTop:vs(40), borderTopLeftRadius:ms(15, 0.5), borderBottomLeftRadius:ms(15, 0.5)}}>
         {/*    <ButtonIcon icon={'close'} onPress={()=>nav.dismissAllOverlays()} /> */}

      <ButtonTitle
          btnStyle={{backgroundColor: (colors.main),/*  width:ms(80,0.5) */ borderRadius:ms(15, 0.5), height:40,}}
          textStyle={{fontSize:ms(12,0.8), color: (colors.white )}} title={'Back'} onPress={()=>{ nav.dismissAllOverlays();
      }}/>               
          </View>
              <Text style={styles.subtitle}>{t.do("curr_device")}</Text>
              <BottomSpace height={5}/>
              <View style={{    paddingHorizontal:ms(20,0.5)}}>
              <FlatList
                  nestedScrollEnabled
                  extraData={updateUI}
                  data={patient.sensors}
                  keyExtractor={item => item.id}
                  renderItem={renderItem}
                  style={styles.listStyle}
                  ItemSeparatorComponent={(props)=>{
                    return( <View style={{height:1, backgroundColor:colors.brownGrey}}/>)
                  }}
              />
              </View>
              <BottomSpace/>
            </View>
          ):null
        }
        {
            <View>
              <Text style={styles.subtitle}>{t.do("other_devices")}</Text>
              <BottomSpace height={5}/>
                  <View style={{    paddingHorizontal:ms(20,0.5)}}>
              <FlatList
                  nestedScrollEnabled
                  extraData={updateUI}
                  data={scanDevices}
                  keyExtractor={item => item.id}
                  renderItem={renderScanItem}
                  style={styles.listStyle}
                  ItemSeparatorComponent={(props)=>{
                    return( <View style={{height:1, backgroundColor:colors.brownGrey}}/>)
                  }}
              />
              </View>
            </View>

        }
        <BottomSpace/>
  {/*       <ButtonTitle btnStyle={[styles.buttonScan, {width:'100%', height:ms(40,0.5)}, {backgroundColor:!bluetooth.isScanning&&_.isEmpty(bleConnecting)&&!bluetooth.isBusy?colors.main:colors.very_light_grey}]} textStyle={[styles.buttonText, {fontFamily:bluetooth.isScanning?'karla_regular':'karla_bold'}]} title={t.do("scan_ble")}onPress={scanBle}/> */}
           <View style={{    paddingHorizontal:ms(20,0.5)}}>
        <ButtonTitle
          btnStyle={{backgroundColor:!bluetooth.isScanning&&_.isEmpty(bleConnecting)&&!bluetooth.isBusy?colors.main:colors.very_light_grey,/*  width:ms(80,0.5) */ borderRadius:ms(15, 0.5), height:40,}}
          textStyle={{fontSize:ms(12,0.8), color: (colors.white )}} title={'SCAN BLUETOOTH DEVICE'} onPress={scanBle}/>   
          </View>
        <BottomSpace height={ms(20,0.5)}/>
      </ScrollView>
      )
    }
    else{
      return(
        <View style={[styles.container, {justifyContent:'center',alignItems:'center'}]}>
          <Text style={styles.title}>{reconnecting?t.do("reconnecting"):syncDone?t.do("sync_completed"):t.do("sync_processing").toUpperCase()}</Text>
          <BottomSpace/>
          <Image source={Images.IC_UPLOAD} style={{width:s(125), height:s(100)}}/>
          <BottomSpace/>
          {!(bluetooth.gatewayMode&&patient.isRegister)?
          <>
          <Text style={[styles.subtitle, {fontFamily:'karla_regular'}]}>{`${t.do("receiving")} ${currRecordCount}/${sensorRecords} ${t.do("records")}`}</Text>
          <Text style={[styles.subtitle, {fontFamily:'karla_regular'}]}>{`${t.do("post_count")} ${postCount} (${totalReceived})`}</Text>
          <Text style={[styles.subtitle, {fontFamily:'karla_regular'}]}>{`${lapsedSec} ${t.do("seconds")}`}</Text>
          <BottomSpace/>
          <BottomSpace/>
          <ButtonTitle btnStyle={[styles.button, {width:ms(200, 0.5), height:ms(40,0.5)}]} textStyle={styles.buttonText} title={syncDone?t.do("done"):t.do("cancel")}onPress={()=>syncDone?completed():cancelSyncing()}/>
          </>:null
          }
        </View>
      )
    }
  }
);
export default Settings;

const _styles = (theme: ThemeType) => ScaledSheet.create({
  container:{
    flex:1,
    backgroundColor:'white',
    paddingVertical: ms(30, 0.5),
    /* paddingHorizontal: ms(40,0.5) */
  },
  subtitle:{
    fontSize: ms(10,0.8),
    fontFamily: 'karla_bold',
    color: theme.colors.darkGrey,
    paddingHorizontal:ms(20,0.5)
  },
  switchLabel:{
    fontSize: ms(14,0.5),
    fontFamily: 'karla_bold',
    color: theme.colors.brownGrey,
    textAlign:'center'
  },
  listStyle:{
    borderWidth: Platform.OS=="android"?3:1,
    borderColor:theme.colors.brownGrey,
    borderRadius:ms(10,0.5),
    height: ms(75,0.5),
    backgroundColor:'transparent',
    paddingHorizontal:ms(5,0.5)
  },
  listItemText:{
    fontSize: ms(12,0.5),
    fontFamily: 'karla_regular',
    color: theme.colors.darkGrey,
    marginHorizontal:ms(5,0.5),
    width:'52%',
  },
  statusText:{
    width:'40%',
    fontSize:ms(12,0.5),
    fontFamily:'karla_regular',
    color:theme.colors.brownGrey,
    alignSelf:'center',
    textAlign:'right',

  },
  title:{
    fontSize: ms(18,0.5),
    fontFamily: 'karla_bold',
    color: theme.colors.darkGrey,
    alignSelf:'center'
  },
  edit_row_title:{
    fontSize: ms(14, 0.5),
    fontFamily:'karla_bold',
    color: theme.colors.darkGrey,
    marginBottom: ms(2,0.5)
  },
  edit_input:{
    height: ms(35,0.5),
    borderColor: 'black',
    borderWidth: 1,
    fontFamily: 'karla_regular',
    fontSize: ms(14, 0.8),
    color: theme.colors.brownGrey,
    paddingHorizontal: ms(5, 0.5)
  },
  button_enter:{
    alignSelf:'center',
    position: 'absolute',
    width:'100%',
    justifyContent:'center',
    bottom:0,
    marginVertical:ms(30,0.5)
  },
  button:{
    borderRadius:50,
    backgroundColor:theme.colors.main,
    height:ms(45, 0.5),
    alignItems:'center',
    justifyContent:'center'
  },
  buttonText:{
    fontSize: ms(16, 0.1),
    margin: 0,
    width:'100%',
    fontFamily:'karla_bold',
    color:'white',
    textAlign:'center'
  },
  buttonScan:{
    borderRadius:10,
    backgroundColor:theme.colors.main,
    height:ms(45, 0.5),
    alignItems:'center',
    justifyContent:'center',
    
  },
});
