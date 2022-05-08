import React, {useState, useEffect} from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, processColor, RefreshControl, SafeAreaView} from 'react-native';
import { observer } from 'mobx-react';
import { useStores } from 'src/stores';
import useStyles from 'src/hooks/useStyles';
import { ButtonTitle, ButtonFontAwesomeIcon } from 'src/components/Button';
import { ScaledSheet, s, vs, ms, mvs } from 'react-native-size-matters';
import { useServices } from 'src/services';
import useConstants from 'src/hooks/useConstants';
import Toast from 'react-native-simple-toast';
import _ from 'lodash';
import { BleCallback, ErrType, SuccessType } from 'src/stores/bluetooth';
import moment from 'moment';
import { LineChart, ECharts } from "react-native-charts-wrapper";
import { numberToString, ModeType } from 'src/stores/bluetooth';

let now = moment(new Date());
let xVal:string[] = [];
let sensor1:number[] = [];
let sensor2:number[] = [];
let chartInited = false;
let mLastUpdateMsec = -1;
let mStartDate = null;

const DISPLAY_UPDATE_MSEC = 10;
const MIN_RECORDS = 25;//8;
const MAX_RECORDS = MIN_RECORDS * 10;
const MAX_X_VALUE = MAX_RECORDS;//64*1024;
const MAX_Y_VALUE = 2*1024;
const MIN_SENSOR_VALUE = 0;
const ANIMATION_X_DURATION = 0;
const ANIMATION_Y_DURATION = 0;

const LiveData: React.FC = observer(({
    componentId,
  })=> {
  const {patient, bluetooth} = useStores();
  const { colors, options } = useConstants();
  const { styles } = useStyles(_styles);
  const { nav, t} = useServices();
  const [dailyDate, setDailyDate] = useState([])
  const [selectedEntry, setSelectedEntry] = useState(null)
  const [xAxis, setxAxis] = useState([""]);
  const [lineData, setLineData] = useState([]);
  const [sensor1Data, setSensor1] = useState([0]);
  const [sensor2Data, setSensor2] = useState([0]);
  const [hrData, setHRData] = useState([]);
  const [rrData, setRRData] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [toggleUI, setToggleUI] = useState(false);
  const [deviceStatus, setDeviceStatus] = useState("")
  const [isAddData, setIsAddData] = useState(false);
  const [isSensor1On, setIsSensor1On] = useState(true);
  const [isSensor2On, setIsSensor2On] = useState(true);
  let thisInterval;

  const liveDataBleCb:BleCallback = (err:any, result:any)=>{

    if(!err){
      if(result){
        if(result === SuccessType.Ble_State_Changed){
          if(!bluetooth.isOn){
            setDeviceStatus(`${t.do("respiree_not_connected")}`)
          }
        }
        else if(result.type && result.type === SuccessType.Ble_Status_Changed){
          //reconnect again
          if(!bluetooth.connected){
            setDeviceStatus(t.do("reconnecting"))
            connectDevice();
          }
        }
        else if(result.type && result.type === SuccessType.Ble_Syncing_Record){
          console.log("ult=====", result)
          if(result.noRecords <= 0){
            setDeviceStatus(`${t.do("no_records")}`)
          }
        }
        else if(result.type && result.type === SuccessType.Ble_Single_Sensor_Data){

          //console.log("receive sensor=======================",parseInt(result.sensor1))
          if(result.sensor1 >= MIN_SENSOR_VALUE) {
              if(sensor1.length > MAX_RECORDS) sensor1.shift();
              sensor1.push(result.sensor1);
          }
          if(result.sensor2 >= MIN_SENSOR_VALUE) {
              if(sensor2.length > MAX_RECORDS) sensor2.shift();
              sensor2.push(result.sensor2);
          }
          //if(sensor1.length == MAX_REC){
          if(sensor1.length >= MIN_RECORDS) {
            //initChart();
            chartUpdate();
          }
        }
        else if(result === SuccessType.Notification_Started){
          if(bluetooth.connected && bluetooth.connectedId){
            setDeviceStatus(`${t.do("get_records")}`)
            bluetooth.setNewRecord(patient.id);
            bluetooth.sendAllRecords(bluetooth.connectedId, patient.id)
          }
        }
        else if(result === SuccessType.Disconnected) {
            nav.popScreen(componentId);
        }
      }
    }else{
      if(err === ErrType.Connect_Fail || err === ErrType.Notification_Fail || err === ErrType.Scan_Fail){
        setDeviceStatus(`${t.do("respiree_not_connected")}`)
        connectDevice()
      }
    }
  }

  const connectDevice = ()=>{
    if(bluetooth.connected && bluetooth.connectedId){
      bluetooth.setNewRecord(patient.id);
      bluetooth.sendAllRecords(bluetooth.connectedId, patient.id)
      setDeviceStatus(`${t.do("get_records")}`)
      return true;
    }
    if(!patient.isRegister){
      Alert.alert(t.do("error"),t.do("invalid_patient"));
      setDeviceStatus(`${t.do("respiree_not_connected")}`)
      return false;
    }
    if(!bluetooth.isOn){
      Alert.alert(t.do("error"),t.do("ble_off"));
      setDeviceStatus(`${t.do("respiree_not_connected")}`)
      return false;
    }
    if(_.isEmpty(patient.sensors)) {
      Alert.alert(t.do("error"),t.do("enable_ble"));
      setDeviceStatus(`${t.do("respiree_not_connected")}`)
      return false;
    }

    if(patient.sensors.length>0 && patient.sensors[0].id){
      console.log("connect Device!!!")
      bluetooth.connectDevice(patient.sensors[0].id);
      setDeviceStatus(`${t.do("connecting")} ${patient.sensors[0].name}`)
      return true;
    }
  }

  const generateRandomData = ()=> {

    var value = Math.random() * 1000;
    value = value + Math.random() * 21 - 10;
    return Math.round(value)
  }

  useEffect(()=>{
      if(isAddData) {
          //console.log("* sensor1: " + sensor1.length + ", sensor2: " + sensor2.length)
          if(sensor1.length > 0 && isSensor1On){
              let sliceLen = sensor1.length > MAX_RECORDS ? MAX_RECORDS : sensor1.length;
              let newArray = sensor1.slice(0,sliceLen);
              //console.log("# sensor1:" + sensor1.length+ " sliceLen: " + sliceLen + ", arrayLen: " + newArray.length);
              setSensor1(fillArray(MAX_RECORDS, newArray));
          } else {
              setSensor1([]);
          }
          if(sensor2.length > 0 && isSensor2On) {
              let sliceLen = sensor2.length > MAX_RECORDS ? MAX_RECORDS : sensor2.length;
              let newArray2 = sensor2.slice(0, sliceLen)
              //console.log("# sensor2:" + sensor2.length + " sliceLen: " + sliceLen + ", arrayLen: " + newArray2.length);
              setSensor2(fillArray(MAX_RECORDS, newArray2));
          } else {
              setSensor2([]);
          }
      }

      setIsAddData(false);
  }, [isAddData, sensor1Data, sensor2Data])

  const startInterval = () => {
    thisInterval = setInterval(function() {
      //addData();
      //setIsAddData(true);
    }, 500);
  };

  /*const initChart = () => {
    setSensor1(_.clone(sensor1))
    setSensor2(_.clone(sensor2))
    startInterval();
  };*/

  const fillArray = (arrayLen, values) => {
      var copyLen = values.length > arrayLen ? arrayLen : values.length;
      var fillLen = arrayLen > copyLen ? arrayLen - copyLen : 0;

      var array = [];
      var ii = 0;

      for(ii = 0; ii < fillLen; ii++) {
          array.push(0);
          ii++;
      }


      var averageSum = 0;
      var averageCount = 0;
      for(ii = 0; ii < copyLen; ii++) {
          array.push(values[ii++]);

          
      }

      //console.log("array>>>>>>>", array)
      return array;
  }

  const chartUpdate = () => {
      if(!chartInited) {
          setSensor1(fillArray(MAX_RECORDS, sensor1));//_.clone(sensor1))
          setSensor2(fillArray(MAX_RECORDS, sensor2));//_.clone(sensor2))
          //startInterval();
          chartInited = true;
          mStartDate = new Date();
      } else {
          if(mStartDate) {
              const start = mStartDate;
              const end   = new Date();
              let diff = Math.abs(end-start);
              let diffMsec = parseInt(diff);

              //if(mLastUpdateMsec == -1 || (diffMsec - mLastUpdateMsec) >= DISPLAY_UPDATE_MSEC) {
                  setIsAddData(true);
                  mLastUpdateMsec = diffMsec;
              //}
          }

      }
  }

  const toggleSensor1 = () => {
      if(isSensor1On) {
          setIsSensor1On(false);
          if(!isSensor2On) {
              setIsSensor2On(true); //either on to be on
          }
      } else {
          setIsSensor1On(true);
      }
  }

  const toggleSensor2 = () => {
      if(isSensor2On) {
          setIsSensor2On(false);
          if(!isSensor1On) {
              setIsSensor1On(true);    //either on to be on
          }
      } else {
          setIsSensor2On(true);
      }
  }

  useEffect(()=>{
    //initChart();
    connectDevice();
    return () => clearInterval(thisInterval)
  },[])


  useEffect(() => {
    bluetooth.addBluetoothCallback("liveData",liveDataBleCb);
    return () => bluetooth.removeBluetoothCallback("liveData");
  },[]);

  return(

    <SafeAreaView style={styles.container}>
      <Text style={{
        alignSelf:'flex-start',
        fontSize: ms(14,0.8),
        fontFamily:'karla_bold',
        color:colors.black,
        marginHorizontal:ms(20,0.5),
        marginBottom:ms(50,0.5)
      }}>
        {deviceStatus}
      </Text>
      {
        (sensor1Data && sensor1Data.length > 0) || (sensor2Data && sensor2Data.length >0)?(<LineChart
          style={styles.chart}
          data={{
            dataSets:
            [{
                values: sensor1Data,
                label: "Sensor 1",
                config: {
                  mode: "CUBIC_BEZIER",
                  drawValues: false,
                  lineWidth: 1,
                  drawCircles: false,
                  highlightColor: processColor("transparent"),
                  drawFilled: false,
                  color: processColor('#3253e2')
                }
            },
            {
              values: sensor2Data,
              label: "Sensor 2",
              config: {
                mode: "CUBIC_BEZIER",
                drawValues: false,
                lineWidth: 1,
                drawCircles: false,
                highlightColor: processColor("transparent"),
                drawFilled: false,
                color: processColor('#0b9fb9')
              }
            }]
          }}
          chartDescription={{ text: "" }}
            legend={{
              enabled: true
            }}
          xAxis={{
            enabled: false,
          }}
          yAxis={{
            left: {
              enabled: true,
              //axisMinimum: 0,
              //axisMaximum: MAX_Y_VALUE
            },
            right: {
              enabled: false
            }
          }}
          animation={{
            durationX: ANIMATION_X_DURATION,
            durationY: ANIMATION_Y_DURATION,
            easingY: "EaseInOutQuart"
          }}
          drawGridBackground={false}
          drawBorders={false}
          autoScaleMinMaxEnabled={true}
          scaleXEnabled={false}
          scaleYEnabled={false}
          touchEnabled={false}
          dragEnabled={false}
          scaleEnabled={false}
          pinchZoom={false}
          doubleTapToZoomEnabled={false}
          highlightPerTapEnabled={false}
          highlightPerDragEnabled={false}
          visibleRange={{y: {left: {min: 0, max: MAX_Y_VALUE}}, x: {min: 0, max: MAX_X_VALUE}}}
          dragDecelerationEnabled={true}
          dragDecelerationFrictionCoef={0.99}
          keepPositionOnRotation={false}
        />):<View/>
      }

      <View style={{flexDirection:'row', marginTop:ms(50,0.5), marginHorizontal:ms(20,0.5), justifyContent:'space-between'}}>
      <ButtonTitle
          btnStyle={{backgroundColor: (isSensor1On ? colors.main : colors.brownGrey), width:ms(80,0.5)}}
          textStyle={{fontSize:ms(14,0.8), color: (isSensor1On ? colors.white : colors.lightGrey)}} title={t.do('sensor1')} onPress={()=>{
          toggleSensor1();
      }}/>
      <ButtonTitle
          btnStyle={{backgroundColor: (isSensor2On ? colors.main : colors.brownGrey), width:ms(80,0.5)}}
          textStyle={{fontSize:ms(14,0.8), color: (isSensor2On ? colors.white : colors.lightGrey)}} title={t.do('sensor2')} onPress={()=>{
          toggleSensor2();
      }}/>
      <ButtonTitle
        btnStyle={{backgroundColor: colors.main, width:ms(80,0.5)}}
        textStyle={{fontSize:ms(14,0.8), color:colors.white}} title={t.do('dismiss')}
        onPress={()=>
          {
            clearInterval(thisInterval)
            if(bluetooth.connected){
              bluetooth.disconnectDevice(bluetooth.connectedId)
            }else{
              nav.popScreen(componentId);
            }
            bluetooth.setMode(0)
          }}/>
      </View>
    </SafeAreaView>
  )

});

export default LiveData;

const _styles = (theme: ThemeType) => ScaledSheet.create({
    title:{
        fontSize: ms(18, 0.8),
        fontFamily:'karla_regular',
        marginHorizontal: ms(20, 0.5),
        marginTop: ms(20,0.5)
    },
    subtitle:{
        fontSize: ms(12, 0.8),
        fontFamily:'karla_regular',
        marginHorizontal: ms(20, 0.5),
        marginTop: ms(20,0.5)
    },
    container:{
      flex:1,
      backgroundColor:'white',
      paddingHorizontal:5,
      justifyContent:'center'
    },
    chart_container: {
        flex: 1,
    },
    chart: {
        height: vs(400),

    },
    hrChart: {
        height: vs(300),
        marginBottom:vs(20)
    },
    bottomTitle:{
        fontSize: ms(18, 0.8),
        fontFamily:'karla_regular',
        marginHorizontal: ms(20, 0.5),
        marginTop: ms(30,0.5)
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
    }
});
