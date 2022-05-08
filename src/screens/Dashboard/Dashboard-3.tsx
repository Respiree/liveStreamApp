import React, {useEffect, useState} from 'react';
import {
  RefreshControl,
    Text,
    View,
    ScrollView,
    AppState,
    Alert,
    processColor,
    Dimensions
} from 'react-native';
import { observer } from 'mobx-react';
import TopBar from 'src/components/TopBar';
import { NavigationFunctionComponent, Navigation } from 'react-native-navigation';
import Images from 'src/global/Images';
import { useStores } from 'src/stores';
import { useServices } from 'src/services';
import useStyles from 'src/hooks/useStyles';
import { screens } from 'src/services/navigation/screens';
import { ScaledSheet, s, vs, ms, mvs } from 'react-native-size-matters';
import { ButtonTitle } from 'src/components/Button';
import moment from 'moment';
import useConstants from 'src/hooks/useConstants';
import { generateShadow } from 'src/utils/helpMethods';
import CardItem from 'src/components/CardItem';
import Toast from 'react-native-simple-toast';
import {getDashboard} from 'src/stores/api';
import _ from 'lodash';
import { useNavigationComponentDidAppear } from 'react-native-navigation-hooks/dist/hooks';
import { BleCallback, convertToHexString, ErrType, numberToString, SuccessType, BleSensorConstant } from 'src/stores/bluetooth';
import {
  useQuery,
  useQueryClient,
  QueryClient,
  QueryClientProvider,
} from "react-query";
import axios from 'axios';
const queryClient = new QueryClient();
import Svg,{
  Circle,
  Text as SvgText,
  Defs,
  LinearGradient,
  RadialGradient,
  Stop,
} from 'react-native-svg';

let getStatus = false;
let isUploading = false;
const mGatewayModeCountdownSec = 3 * 60;
let mSecTimer = null;
let isSuspend = false;
let globalCountDown = 0;
let mGlobalTimer = null;

const Component: NavigationFunctionComponent = observer(({
  componentId,
}) => {
  const { ui, patient, bluetooth} = useStores();
  const { nav, t} = useServices();
  const { styles } = useStyles(_styles);
  const { colors, sizes ,options } = useConstants();
  const [sedentary, setSedentary] = useState(0)
  const [minorMovement, setMinorMovement] = useState(0)
  const [active, setActive] = useState(0)
  const [calories, setCalories] = useState(0)
  const [stepCount, setStepCount] = useState(0)
  const [battery, setBatteryLevel] = useState(-1)
  const [connectedDevice, setConnectedDevice] = useState("")
  const [updateChart, setUpdateChart] = useState(false);
  const [stressLevel, setStressLevel] = useState(0)
  const [refreshing, setRefreshing] = useState(false);
  const [dateTime, setDateTime] = useState(new Date());
  const [countdownTime, setCountdownTime] = useState(0);
  const [isTimerTriggered, setIsTimerTriggered] = useState(false);
  const [isSecTick, setIsSecTick] = useState(false);
  const [refetchInterval, setRefetchInterval] = useState(-1);
  const [btState, setBtState] = useState("")
  const [isGatewayMode, setIsGatewayMode] = useState(false)

  const onRefresh = React.useCallback(() => {
    setRefreshing(true)
    getDashboardData();
  }, []);

  const dashboardBleCb:BleCallback = (err:any, result:any)=>{

    if(!err){
      if(result){

        if(result === SuccessType.Ble_State_Changed){
          //console.log("Dashboard====", err, "Ble state change");
          if(bluetooth.isOn && patient.sensors.length>0){//patient has register sensor before
          }else if(!bluetooth.isOn){
            Toast.show(t.do("ble_off"), Toast.SHORT);
          }
        }
        else if(result.type && result.type === SuccessType.Ble_Status_Changed){
          //console.log("Dashboard====", err, "Ble status change");
          if(!bluetooth.connected){
            Toast.show(t.do("ble_disconnected"), Toast.SHORT);
            console.log("ble disconnected", "upload to API")
            setConnectedDevice("")
            uploadToServer();
            setBtState("");
            if(bluetooth.gatewayMode && patient.isRegister) {
                setRefetchInterval(mGatewayModeCountdownSec * 1000);
                setCountdownTime(mGatewayModeCountdownSec);
                globalCountDown = mGatewayModeCountdownSec;
                mGlobalTimer = new Date();
            }
          }
        }
        else if(result.type && result.type === SuccessType.Ble_Syncing_Record){
            setBtState(t.do("syncing"));
            bluetooth.saveRecord();
            //uploadToServer();
        }
        else if(result === SuccessType.Notification_Started){
          if(bluetooth.connected && bluetooth.connectedId){
            //console.log("getBattery",getStatus);
            console.log("refetch interval",refetchInterval, "countdown",countdownTime, "global timer",globalCountDown)
            if(getStatus){
              console.log("Dashboard get device status!!!!!!!");
              bluetooth.getDeviceStatus(bluetooth.connectedId, patient.id);
            }else if(bluetooth.gatewayMode && patient.id && patient.isRegister && !bluetooth.isBusy && globalCountDown == -1 ){
              bluetooth.setNewRecord(patient.id);
              bluetooth.sendAllRecords(bluetooth.connectedId, patient.id)
            }
          }
        }
        else if(result.type && result.type === SuccessType.Ble_Received_Data){
          //console.log("Dashboard get received data===",result);
          if(result.data && result.data.value){
            const value = result.data.value;
            if(value[0] == BleSensorConstant.BLE_SENSOR_COMMAND_START_BYTE && value[1] == BleSensorConstant.BLE_SENSOR_COMMAND_RES_GET_DEVICE_STATUS){ //get device status response
              console.log("get device status response",value)
              if(value[12] == BleSensorConstant.BLE_SENSOR_RESPONSE_SUCCESS){

              }else{
                  Toast.show(t.do("invalid_patient"), Toast.SHORT);
                  patient.registerOk(false);
              }
              setBatteryLevel(value[13]);
            }
          }
        }
      }
    }else{
      if(err === ErrType.Connect_Fail || err === ErrType.Notification_Fail || err === ErrType.Scan_Fail){
        let msg = `${t.do("ble_connect_fail_msg")} ${connectedDevice}}`
        Toast.show(msg, Toast.SHORT);
      }
    }
  }

  const handleAppStateChange = (state: any) => {
    //console.log("app state change!!!!!!!!",state, "interval",refetchInterval, "suspend",isSuspend);
    if(state === "inactive"){
      bluetooth.saveRecord();
      bluetooth.uninit();
    }else if(state === "background"){
      console.log("background==> countdownTime",globalCountDown);
      //isSuspend=true;
      bluetooth.saveRecord();
    }else if(state === 'active'){
      console.log("active==> countdownTime",globalCountDown);
      setCountdownTime(globalCountDown);
      /*if(isSuspend){
        //console.log("set refetch",globalCountDown)
        setRefetchInterval(globalCountDown * 1000);
        isSuspend = false;
      }*/
    }
  }

  const uploadToServer = ()=>{
    if(isUploading){
        console.log("uploadToServer skipped");
        return;
    }

    isUploading = true;
    console.log("uploading to server !!!!! recordCollectedBySensor: " + (bluetooth.savedRecords ? bluetooth.savedRecords.recordCollectedBySensor : -1))
    if(bluetooth.savedRecords && bluetooth.savedRecords.recordCollectedBySensor > 0){
      var url = "https://d3seui3i1l9ro8.cloudfront.net/dev/upload";
      //console.log("bluetooth.savedRecords",bluetooth.savedRecords);

      axios.post(url, bluetooth.savedRecords)
      .then(res => {
        isUploading = false;
        if(res && res.data) {
            console.log("response from api==",res.data.body);
        }

        //console.log("uploadToServer>>>>>>>>>>>>>>>>>>>>>",res);

        bluetooth.clearRecord();
        //console.log("uploaded to server clear Record====",bluetooth.savedRecords);

      })
      .catch(err => {
          isUploading = false;
          console.log("upload err",err);
      });
    }else{
      isUploading = false;
    }
  }

  const connectDevice = (enableAlert=true, queryStatus=true)=>{
    //console.log("connect=====","enableAlert",enableAlert, "getStatus",queryStatus);
    if(bluetooth.connected && bluetooth.connectedId){
      bluetooth.setNewRecord(patient.id);
      bluetooth.sendAllRecords(bluetooth.connectedId, patient.id)
      return true;
    }
    getStatus = queryStatus
    if(!patient.isRegister){
      if(enableAlert)
        Alert.alert(t.do("error"),t.do("invalid_patient"));
      return false;
    }
    if(!bluetooth.isOn){
      if(enableAlert)
        Alert.alert(t.do("error"),t.do("ble_off"));
      return false;
    }
    if(_.isEmpty(patient.sensors)) {
      if(enableAlert)
        Alert.alert(t.do("error"),t.do("enable_ble"));
      return false;
    }

    if(patient.sensors.length>0 && patient.sensors[0].id){
      if(bluetooth.isOn && bluetooth.connected && bluetooth.connectedId == patient.sensors[0].id)
        return true;
      if(connectedDevice !== "")
        return false;
      //nav.showSpinner();
      console.log("connect Device!!!")
      setConnectedDevice(patient.sensors[0].name);
      bluetooth.connectDevice(patient.sensors[0].id);
      return true;
    }
  }

  useEffect(() => {
    AppState.addEventListener('change', handleAppStateChange.bind(this));
    return (() => {
      AppState.removeEventListener('change', handleAppStateChange);
    })
  }, []);

  useEffect(() => {
    bluetooth.init();
    bluetooth.addBluetoothCallback(componentId,dashboardBleCb);
    bluetooth.startBle();
  },[]);

  const getDashboardData = async()=>{
    let today = moment.utc().format("YYYY-MM-DDTHH:mm:ss");
    const userId = options.debug?160:patient.id;
    const userIdStr = patient.id;//numberToString(userId);
    const url = `https://u6wawzlr6h.execute-api.ap-southeast-1.amazonaws.com/respiree-api/dev/query/metrics?id=${userIdStr}&date_time=${today}`
    console.log("url===",url);
    fetch(url, {
         method: 'GET'
      })
      .then((response) => response.json())
      .then((responseJson) => {
        setRefreshing(false)
        //console.log("response",responseJson)
        if(responseJson.response){
          //console.log("metric",responseJson.response.metrics)
          //console.log("range",responseJson.response.range)
          const metric = responseJson.response.metrics;
          const range = responseJson.response.range;
          setSedentary(metric.activity_sedentary);
          setMinorMovement(metric.activity_minor);
          setStepCount(metric.activity_step);
          setCalories(metric.activity_calories);
          setActive(metric.activity);
          const stressValue = Number.parseFloat(metric.stress);
          setStressLevel(stressValue < 0 ? 0 : stressValue);
          setUpdateChart(true)
        }
      })
      .catch((error) => {
         console.error(error);
      });
  }

  const { isStale, isSuccess, status } = useQuery("userData", () =>
    {
      console.log("timeout to send record if any","mode",bluetooth.gatewayMode, "isRegistered",patient.isRegister);
      console.log("isStale===",isStale, "success",isSuccess, "status===",status, "countdown",countdownTime, "interval",refetchInterval,"mGatewayModeCountdownSec",mGatewayModeCountdownSec);

      mGlobalTimer = new Date();

      if(bluetooth.gatewayMode && patient.isRegister && refetchInterval != -1) {
        globalCountDown = -1;
        setCountdownTime(-1);
        console.log("connect device==================")
        if(connectDevice(true, false)) {
            setRefetchInterval(-1);
        } else {
            console.log("device not connected")
        }
      }
    }
    ,{
      refetchInterval: refetchInterval,
      refetchIntervalInBackground: true,
      refetchOnMount: false,
      refetchOnReconnect: false,
      enabled: !isSuspend
    }
  );

  React.useEffect(() => {
    if(bluetooth.gatewayMode && patient.isRegister) {
        //console.log("isTimerTriggered!!!",isTimerTriggered)
        if(isTimerTriggered) {
            setDateTime(new Date());
        }
        setIsTimerTriggered(false);
        if(mSecTimer == null) {
            mSecTimer = setInterval(() => {
                setIsSecTick(true);
            }, 1000);
        }
        if(!isGatewayMode) {
            setIsGatewayMode(true);
            console.log("init polling!!!!")
            setCountdownTime(mGatewayModeCountdownSec);
            globalCountDown = mGatewayModeCountdownSec;
            setRefetchInterval(mGatewayModeCountdownSec* 1000);
        }
    } else {
        if(isGatewayMode) {
          console.log("disable polling")
            setCountdownTime(0);
            globalCountDown = 0;
            setIsGatewayMode(false);
            setRefetchInterval(-1);
        }
    }
  }, [bluetooth.gatewayMode, patient.isRegister, isTimerTriggered, isGatewayMode, countdownTime, refetchInterval, isSecTick]);

  React.useEffect(() => {
    if(isSecTick) {
        let curCdTime = globalCountDown;
        if(globalCountDown > 0) {
            if(mGlobalTimer) {
                const start = mGlobalTimer;
                const end   = new Date();
                let diff = Math.abs(end-start) / 1000;
                let diffSec = parseInt(diff);
                let lapsedSec = 0;

                if(diff >= mGatewayModeCountdownSec) {
                    globalCountDown = 0;
                } else {
                    globalCountDown = mGatewayModeCountdownSec - diffSec;
                }
            } else {
                globalCountDown--;
            }
            setCountdownTime(globalCountDown);
        }

        console.log("countdownTime: " + curCdTime + ", adjusted countdownTime: " + globalCountDown);

        if(countdownTime == 0) {
            setIsTimerTriggered(true);
            setCountdownTime(-1);
            globalCountDown = -1;
        }
    }
    setIsSecTick(false);

  }, [isSecTick, countdownTime]);

  useEffect(()=>{
    getDashboardData();
  },[])

  const getStressToStr = (stress:number)=>{
    if(stress < 30){
      return "Low";
    }else if(stress <= 70){
      return "Moderate";
    }else{
      return "High"
    }
  }

  const CircleProgress = ()=>{
    const screenWidth = Dimensions.get('window').width;
    const sqSize = ms(300, 0.2);
    const strokeWidth = ms(55, 0.2);
    const percentage = stressLevel;
    const tot = 100;
    // SVG centers the stroke width on the radius, subtract out so circle fits in square
    const radius = ((sqSize - strokeWidth) / 2) -20;
    const viewBox = `0 0 ${sqSize} ${sqSize}`;

    const dashArray = radius * Math.PI * 2;
    const dashOffset = dashArray - dashArray * percentage / 100;
    const dashOffset2 = dashArray - dashArray * (tot-percentage) / 100;
    const percentageFontSize = ms(26, 0.2);
    const shadowRadius = radius+(strokeWidth/2)+5
    return (
        <Svg
            width={screenWidth}
            height={sqSize}
            viewBox={viewBox}>
            <Defs>
              <LinearGradient id="calmness" x1={0} y1={0} x2={1} y2={0}>
                <Stop offset={0} stopColor='rgb(74, 144, 226)' stopOpacity={0.75} />
                <Stop offset={1} stopColor='rgb(53, 216, 190)'  stopOpacity={1}/>
              </LinearGradient>
              <LinearGradient id="stress" x1={0} y1={0} x2={1} y2={0}>
                <Stop offset={0} stopColor="rgb(74, 144, 226)" stopOpacity={0.75}/>
                <Stop offset={1} stopColor="rgb(64, 89, 243)" stopOpacity={0.85}  />
              </LinearGradient>
              <RadialGradient
                id="top"
                cx="50%"
                cy="50%"
                r="50%"
                fx="50%"
                fy="50%">
                <Stop offset="90%" stopColor='#fff' stopOpacity="0" />
                <Stop offset="100%" stopColor="rgb(64, 89, 243)" stopOpacity="0.1" />
              </RadialGradient>
              <RadialGradient
                id="top"
                cx="50%"
                cy="50%"
                r="50%"
                fx="50%"
                fy="50%">
                <Stop offset="90%" stopColor='#fff' stopOpacity="0" />
                <Stop offset="100%" stopColor="rgb(64, 89, 243)" stopOpacity="0.1" />
              </RadialGradient>
            </Defs>
            <Circle
                fill='url(#top)'
                strokeLinecap='round'
                strokeLinejoin='round'
                cx={sqSize / 2}
                cy={sqSize / 2}
                r={shadowRadius-3}
                strokeWidth={`10px`}/>
            <Circle
                fill='url(#top)'
                cx={sqSize / 2}
                cy={sqSize / 2}
                r={shadowRadius}/>
            <Circle
                fill='none'
                stroke='url(#calmness)'
                strokeLinecap='round'
                strokeLinejoin='round'
                cx={sqSize / 2}
                cy={sqSize / 2}
                r={radius}
                strokeWidth={`${strokeWidth}px`}
                transform={`rotate(-90 ${sqSize / 2} ${sqSize / 2})`}
                style={{
                    strokeDasharray: dashArray,
                    strokeDashoffset: -dashOffset2
                }} />
             <Circle
                fill='none'
                stroke='url(#stress)'
                strokeLinecap='round'
                strokeLinejoin='round'
                cx={sqSize / 2}
                cy={sqSize / 2}
                r={radius}
                strokeWidth={`${strokeWidth}px`}
                // Start progress marker at 12 O'Clock
                transform={`rotate(-90 ${sqSize / 2} ${sqSize / 2})`}
                style={{
                    strokeDasharray: dashArray,
                    strokeDashoffset: dashOffset
                }}
                />
              <Circle
                fill='rgba(53, 216, 190, 0.8)'
                cx={(sqSize/4)}
                cy={sqSize / 2}
                r={sqSize*0.12}/>
              <Circle
                fill='rgba(64, 89, 243, 0.8)'
                cx={(sqSize/4)+(sqSize/2)}
                cy={sqSize / 2}
                r={sqSize*0.12}/>
              <SvgText
                fill="white"
                stroke="none"
                fontSize={percentageFontSize}
                fontFamily="karla_bold"
                x={sqSize/4}
                y={(sqSize+(percentageFontSize/2)) / 2}
                textAnchor="middle">
                {`${tot-percentage}%`}
              </SvgText>
              <SvgText
                fill="white"
                stroke="none"
                fontSize={percentageFontSize}
                fontFamily="karla_bold"
                x={(sqSize/4)+(sqSize/2)}
                y={(sqSize+(percentageFontSize/2)) / 2}
                textAnchor="middle">
                {`${percentage}%`}
              </SvgText>

        </Svg>
    );
  }

  return (

    <View style={{flex:1}}>
      <View style={{flex:.1, marginLeft: sizes.margin}}>
      <TopBar/>
      </View>
      <ScrollView style={styles.contentContainer} contentContainerStyle={{flexGrow:1, paddingBottom: 40, alignItems:'center' }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
          />
        }>
        <Text style={styles.date}>{`${t.do("today").toUpperCase()}, ${moment().format('DD MMMM YYYY').toUpperCase()}`}</Text>
        {
          bluetooth.connected&&bluetooth.batteryLevel>=0?
          (<View style={[styles.batteryView, generateShadow({elevation:1.5})]}>
            <Text style={styles.batteryText}>{t.do("respiree_batt_life").toUpperCase()}</Text>
            <View style={styles.batteryLevels}>
              <View style={bluetooth.batteryLevel<40?styles.batteryRed:styles.batteryGreen}/>
              <View style={bluetooth.batteryLevel>=40?styles.batteryGreen:styles.batteryGrey}/>
              <View style={bluetooth.batteryLevel>=60?styles.batteryGreen:styles.batteryGrey}/>
              <View style={bluetooth.batteryLevel>=80?styles.batteryGreen:styles.batteryGrey}/>
              <View style={bluetooth.batteryLevel>=100?styles.batteryGreen:styles.batteryGrey}/>
            </View>
          </View>):
          (<View style={styles.connectView}>
            <View style={[styles.statusView,generateShadow({elevation:1.5})]}>
              {bluetooth.gatewayMode && patient.isRegister ?
                  (countdownTime >= 0 ?
                      <Text style={styles.statusText}>{`${t.do("gateway_mode").toUpperCase()} - ${countdownTime} ${t.do("seconds")}`}</Text> :
                      <Text style={styles.statusText}>{`${t.do("gateway_mode").toUpperCase()} - ${btState}`}</Text>) :
                  bluetooth.connected&&bluetooth.connectedId?
                  <Text style={styles.statusText}>{`${t.do("connected_to")} ${bluetooth.connectedId}`}</Text>:
                  <Text style={styles.statusText}>{t.do("respiree_not_connected").toUpperCase()}</Text>}
            </View>
            <View style={[ (bluetooth.gatewayMode && patient.isRegister)||bluetooth.connected ? styles.buttonDisabledView : styles.buttonView, generateShadow({elevation:1.5, shadowColor:'rgba(202, 207, 235, 0.3)'})]}>
                <ButtonTitle textStyle={(bluetooth.gatewayMode && patient.isRegister)||bluetooth.connected?[styles.buttonText,{color:colors.brownGrey}]:styles.buttonText} title={t.do('connect').toUpperCase()} onPress={connectDevice}/>
            </View>
          </View>)
        }
        {updateChart?
        <View style={{flex:1}}>
          <Text style={{color:'#35d8be', position: 'absolute',left: ms(30,0.5),top: 0, textAlign:'left', fontSize:ms(16,0.8), fontFamily:'karla_regular'}}>Calmness</Text>
          <View style={{position: 'absolute',right: ms(30,0.5),top: 0}}>
           <Text style={{color:'#4059f3', textAlign:'right', fontSize:ms(16,0.8), fontFamily:'karla_regular'}}>Stress</Text>
           <Text style={{color:'#4059f3', textAlign:'right', fontSize:ms(16,0.8), fontFamily:'karla_bold'}}>{`${getStressToStr(stressLevel)}`}</Text>
          </View>
          {CircleProgress()}
        </View>
        :null}
        <View style={[styles.first_details, generateShadow({elevation:2})]}>
          <View style={styles.first_child}>
            <CardItem title={t.do("sedentary").toUpperCase()} val={sedentary} unit={"%"}/>
          </View>
          <View style={styles.line}/>
          <View style={styles.first_child}>
            <CardItem title={t.do("minor_movement").toUpperCase()} val={minorMovement} unit={"%"}/>
          </View>
          <View style={styles.line}/>
          <View style={styles.first_child}>
            <CardItem title={t.do("active").toUpperCase()} val={active} unit={"%"}/>
          </View>
        </View>
        <View style={styles.details_grab}/>
        <View style={styles.second_details}>
          <View style={[styles.second_child,generateShadow({elevation:2})]}>
            <CardItem title={t.do("calories_burnt").toUpperCase()} val={calories} unit={"CAL"}/>
          </View>
          <View style={[styles.second_child,generateShadow({elevation:2})]}>
            <CardItem title={t.do("step_count").toUpperCase()} val={stepCount} unit={"STEPS"}/>
          </View>
        </View>
      </ScrollView>
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
  date: {
    fontSize: ms(14, 0.8),
    textAlign: 'left',
    color: theme.colors.mainTxt,
    fontFamily: 'karla_bold',
    alignSelf:'flex-start'
  },
  batteryText:{
    width: '50%',
    color: theme.colors.brownGrey,
    fontSize: ms(12, 0.8),
    fontFamily:'karla_bold'
  },
  batteryLevels:{
    width: '50%',
    flexDirection:'row',
    justifyContent:'space-between'
  },
  batteryRed:{
    backgroundColor:'#FF0000',
    width: '18%',
    height: ms(8, 0.5),
    borderBottomStartRadius: 10,
    borderBottomEndRadius: 10,
    borderTopEndRadius: 10,
    borderTopStartRadius: 10
  },
  batteryGreen:{
    width: '18%',
    height: ms(8, 0.5),
    backgroundColor: theme.colors.green,
    borderBottomStartRadius: 10,
    borderBottomEndRadius: 10,
    borderTopEndRadius: 10,
    borderTopStartRadius: 10
  },
  batteryGrey:{
    width: '18%',
    height: ms(8, 0.5),
    backgroundColor: theme.colors.very_light_grey,
    borderBottomStartRadius: 10,
    borderBottomEndRadius: 10,
    borderTopEndRadius: 10,
    borderTopStartRadius: 10
  },
  batteryView:{
    height: vs(40),
    width: '100%',
    flexDirection:'row',
    marginTop: theme.sizes.margin,
    marginBottom: theme.sizes.margin,
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 9,
    alignItems:'center',
    justifyContent:'space-between',
    paddingHorizontal:20
  },
  connectView:{
    height: vs(40),
    width: '100%',
    flexDirection:'row',
    marginTop: theme.sizes.margin,
    marginBottom: theme.sizes.margin,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  statusView:{
    borderTopLeftRadius: 10,
    borderBottomLeftRadius:10,
    height: '100%',
    paddingHorizontal: 20,
    justifyContent:'center',
    width: '75%'
  },
  statusText:{
    color: theme.colors.brownGrey,
    fontFamily: 'karla_bold',
    fontSize: ms(12, 0.8)
  },
  buttonView:{
    width:'25%',
    height: '100%',
    backgroundColor: 'rgba(111, 135, 255, 0.7)',
    justifyContent:'center',
    borderTopRightRadius: 10,
    borderBottomRightRadius:10,
  },
  buttonDisabledView:{
    width:'25%',
    height: '100%',
    backgroundColor: theme.colors.very_light_grey,
    justifyContent:'center',
    borderTopRightRadius: 10,
    borderBottomRightRadius:10,
  },
  buttonText:{
    fontSize: ms(12, 0.8),
    margin: 0,
    width:'100%'
  },
  details_grab:{
    height: vs(10),
    width:'100%'
  },
  first_details:{
    width:'100%',
    borderTopStartRadius:10,
    borderTopEndRadius:10,
    borderBottomStartRadius:10,
    borderBottomRightRadius:11,
    height: vs(90),
    justifyContent:'space-evenly',
    alignItems:'center',
    flexDirection:'row'
  },
  line:{
    height: '70%',
    width: 3,
    backgroundColor:'#D8D8D8'
  },
  second_details:{
    width: '100%',
    height: vs(70),
    flexDirection:'row',
    justifyContent:'space-between'
  },
  first_child:{
    width: '30%',
    height: '100%',
  },
  second_child:{
    width: '49%',
    height: '100%',
    borderTopStartRadius:10,
    borderTopEndRadius:10,
    borderBottomStartRadius:10,
    borderBottomRightRadius:11,
  },
  chartStyle:{
    width: '100%',
    height: ms(300,0.2),
    backgroundColor:'transparent'
  }
});

Component.options = props => screens.dashboard.options();

export const Dashboard = Component;
