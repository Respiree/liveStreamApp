import React, {useState, useEffect} from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, processColor, RefreshControl, SafeAreaView, Button, Switch} from 'react-native';
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
import TopBar from 'src/components/TopBar';
import { useNavigationComponentDidAppear } from 'react-native-navigation-hooks/dist/hooks';
import calculate_rr from 'src/utils/rr_conversion/rr';
import { Platform, StatusBar} from 'react-native';
import ToggleSwitch from 'toggle-switch-react-native'
import RNBeep from 'react-native-a-beep';
import { Thread } from 'react-native-threads';
import { zScorePeakDetect } from '../respiree-app-src-20220427/pkdetection';
import RNFetchBlob from 'react-native-fetch-blob';
/* import zScorePeakDetect from '../respiree-app-src-20220427/pkdetection'; */


let sensor1:number[] = [];
let sensor2:number[] = [];
let newDataLength = 0;
let prevDataLength = 0;
let rawArr:any[]=[];
let inputData:any[]=[];
let chartInited = false;
let mLastUpdateMsec = -1;
let mStartDate = null;
let mIsLiveMode = false;
let values = []
let resultConversion = 0;
let rr_flag = 0;
let timer = 2;


const DISPLAY_UPDATE_MSEC = 250;
const MIN_RECORDS = 25;
//const MAX_RECORDS = MIN_RECORDS * 15;//20;
const MAX_RECORDS = MIN_RECORDS * 15;//20;
const MAX_X_VALUE = MAX_RECORDS;
const MAX_Y_VALUE = 21*1024;//2*1024;
const MIN_SENSOR_VALUE = 0;
const ANIMATION_X_DURATION = 0;
const ANIMATION_Y_DURATION = 0;
//const MOVING_AVERAGE_SIZE = 15
//const BUFFERED_RECORD_SIZE = MAX_RECORDS+MOVING_AVERAGE_SIZE;

//raw signal to respiratory rate
const MIN_RECORD_SIZE = 2098

const params = {
    sampling_time: 0.06, // seconds,
    window_mva: 15,
    window_bl: 250,
    window_art_mva: 83,
    window_art_bl: 667,
    window_smooth_output: 9,
    th_prepro: 3,
    lag: 2,
    coef_A: 0.8,
    coef_B: 0.5,
    val_min: 1.0,
    val_max: 30,
    window_size: 1083,
    window_shift: 16*1 
}

const sqa_bandpass_rr = [0.05, 1.167]


const RR_CONVERSION_STATUS = {
  PROCESSING: 'Processing',
  PROCESSED: 'Processed'
}

const workerThread = new Thread('index.thread.js');

const LiveData: React.FC = observer(({
    componentId,
  })=> {
  const {patient, bluetooth} = useStores();
  const { colors, options, sizes } = useConstants();
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
  const [isSensor2On, setIsSensor2On] = useState(false);
  const [isLiveModeStart, setLiveModeStart] = useState(false);
  const [temperature, setTemperature] = useState(0);
  const [liveRR, setLiveRR] = useState(0)
  const [statusRR, setStatusRR] = useState(0)
  const [rrFlag, setRRflag] = useState(0)
  //settings
  const [isEnabled, setIsEnabled] = useState(false);
  const [peakDetectionCounter, setPeakDetectionCounter] = useState(0)
/*   const [newDataLength, setNewDataLength] = useState(0)
  const [prevDataLength, setPrevDataLength] = useState(0) */
  //need to have counter, lets say 15 data points
  /* const [RawConvertArr, setRawConvertArr] = useState<any>([])  */
  let thisInterval;
  
  let processor = zScorePeakDetect()
  const toggleSwitch = () => setIsEnabled(previousState => !previousState);


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
              if(mIsLiveMode) {
                  setDeviceStatus(t.do("reconnecting"))
                  connectDevice();
              } else {
                  setDeviceStatus(`${t.do("respiree_not_connected")}`)
                  setLiveModeStart(false);
              }
          }
        }
        else if(result.type && result.type === SuccessType.Ble_Syncing_Record){
          console.log("live data result=====", result)
          if(result.noRecords <= 0){
            setDeviceStatus('Receiving...') //`${t.do("no_records")}`)
          }
        }
        else if(result.type && result.type === SuccessType.Ble_Single_Sensor_Data){
          /* console.log('result: ', result) */
          if(result.sensor1 >= MIN_SENSOR_VALUE ) {
              if(sensor1.length > (MAX_RECORDS+patient.liveDataMovingAvg)) sensor1.shift();
              sensor1.push(result.sensor1);
              newDataLength++;
             /*  setNewDataLength((prev)=>prev+1); */
          }

    
          
          //raw conversion data buffer
          /***********************/


          if(rawArr.length >= MIN_RECORD_SIZE)
          {
            //console.log(result.sensor1)
            rawArr.shift()
            rawArr.push([0,result.sensor1]) 
            rr_flag = 1
            
          }
          else{
            rawArr.push([0,result.sensor1]) 
          }      

          /***********************/
          if(result.sensor2 >= MIN_SENSOR_VALUE) {
              if(sensor2.length > (MAX_RECORDS+patient.liveDataMovingAvg)) sensor2.shift();
              sensor2.push(result.sensor2);
          }
          //if(sensor1.length == MAX_REC){
          if(sensor1.length >= MIN_RECORDS) {
            //initChart();
            if(result.temperature && result.temperature != temperature) {
                setTemperature(result.temperature)
            }


            chartUpdate();
          }
        }
        else if(result === SuccessType.Notification_Started){
            console.log("Notification_Started>> ", mIsLiveMode)
          if(bluetooth.connected && bluetooth.connectedId){
            setDeviceStatus(`${t.do("get_records")}`)
            if(mIsLiveMode) {
                bluetooth.setNewRecord(patient.id);
                bluetooth.sendAllRecords(bluetooth.connectedId, patient.id)
            }

          }
        }
        else if(result === SuccessType.Disconnected) {
            //nav.popScreen(componentId);
            setDeviceStatus(`${t.do("respiree_not_connected")}`)
            setLiveModeStart(false);
        }
      }
    }else{
      if(err === ErrType.Connect_Fail || err === ErrType.Notification_Fail || err === ErrType.Scan_Fail){
        setDeviceStatus(`${t.do("respiree_not_connected")}`)
        connectDevice()
      }
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

  const connectDevice = ()=>{
    if(bluetooth.connected && bluetooth.connectedId){
      bluetooth.setNewRecord(patient.id);
      bluetooth.sendAllRecords(bluetooth.connectedId, patient.id)
      setDeviceStatus(`${t.do("get_records")}`)
      return true;
    }
    /*if(!patient.isRegister){
      //Alert.alert(t.do("error"),t.do("invalid_patient"));
      setDeviceStatus(`${t.do("respiree_not_connected")}`)
      return false;
    }*/
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

  useNavigationComponentDidAppear(() => {
    bluetooth.init();
  }, componentId);

  useEffect(()=>{
      if(isAddData) {
          if(sensor1.length > 0 && isSensor1On){      
              let sliceLen = sensor1.length > (MAX_RECORDS+patient.liveDataMovingAvg) ? (MAX_RECORDS+patient.liveDataMovingAvg) : sensor1.length;
              let newArray = sensor1.slice(0,sliceLen);     
              let processedArr = fillArray(MAX_RECORDS, newArray);
              //new added length - prev length = new data points to be fed to algo
              let sliceLength = newDataLength - prevDataLength
              console.log('slice', sliceLength)
              setSensor1(processedArr);
              //run peak detection algo
               values.push([sliceLength, processedArr.slice(-sliceLength)])
              if(isEnabled && sliceLength && processedArr){
                processor.updateLagValue( patient.pkLag )
                processor.updateThresholdValue( patient.pkThreshold )
                processor.updateInfluenceValue( patient.pkInfluence )
                let isPeak = processor.toBeep(processedArr.slice(-sliceLength))
                console.log('isPeak', isPeak)
                if(isPeak)RNBeep.beep();
              }

              prevDataLength = newDataLength


          } else {
              setSensor1([]);
          }
          if(sensor2.length > 0 && isSensor2On) {
              let sliceLen = sensor2.length > (MAX_RECORDS+patient.liveDataMovingAvg) ? (MAX_RECORDS+patient.liveDataMovingAvg) : sensor2.length;
              let newArray2 = sensor2.slice(0, sliceLen)
     
              setSensor2(fillArray(MAX_RECORDS, newArray2));
          } else {
              setSensor2([]);
          }
      }

      setIsAddData(false);
  }, [isAddData, sensor1Data, sensor2Data])
/* 
  const startInterval = () => {
    thisInterval = setInterval(function() {
      //addData();
      //setIsAddData(true);
    }, 500);
  }; */

  /*const initChart = () => {
    setSensor1(_.clone(sensor1))
    setSensor2(_.clone(sensor2))
    startInterval();
  };*/


  const fillArray = (arrayLen, values) => {
     /*  console.log(arrayLen, values) */
      var valueLength = values.length;
      var copyLen = valueLength > arrayLen ? arrayLen : valueLength;
      var fillLen = arrayLen > copyLen ? arrayLen - copyLen : 0;

      var array = [];
      var ii = 0;

      for(ii = 0; ii < fillLen; ii++) {
          array.push(0);
          ii++;
      }
      var lastValues = [];
      var averageCount = 0;
      for(ii = 0; ii < copyLen; ii++) {
          var value = values[ii];

          lastValues.push(value);

          if(ii >= (patient.liveDataMovingAvg)-1) {
              var jj = 0, averageSum = 0;
              for(jj = 0; jj < lastValues.length; jj++)
              {
                  averageSum += lastValues[jj]
              }
              value = parseInt(averageSum / lastValues.length);
              lastValues.shift();
              array.push(value);
          }
      }
      return array;
  }

  const chartUpdate = () => {
      if(!chartInited) {
          setSensor1(fillArray(MAX_RECORDS, sensor1));
          setSensor2(fillArray(MAX_RECORDS, sensor2));
          chartInited = true;
          mStartDate = new Date();
      } else {
          if(mStartDate) {
              const start = mStartDate;
              const end   = new Date();
              let diff = Math.abs(end-start);
              let diffMsec = parseInt(diff);

              if(mLastUpdateMsec == -1 || (diffMsec - mLastUpdateMsec) >= DISPLAY_UPDATE_MSEC) {
                  setIsAddData(true);
                  mLastUpdateMsec = diffMsec;
              }
          }

      }
  }

  const toggleSensor1 = () => {
      //console.log("toggle sensor 1>>>" + isSensor1On )
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


/*   	  useEffect(()=>{	
    return () => clearInterval(thisInterval)	
  },[]) */

/*   useEffect(()=>{
    const workerThread = new Thread('../utils/rr_conversion/rr_thread.js');

workerThread.postMessage('hello');

workerThread.onmessage = (message) => console.log(message); 
  }, []) */
/* 
 var testNum = [[0,1], [0,2], [0,3], [0,4], [0,5]]
  useEffect(()=>{
    setInterval(()=>{
      console.log('1',testNum)
      testNum.shift()
      console.log('2', testNum)
      testNum.push([0, 66])
      console.log('3', testNum)
    }, 1000)
  },[]) */



  useEffect(() => {
    bluetooth.addBluetoothCallback("liveData",liveDataBleCb);
    return () => bluetooth.removeBluetoothCallback("liveData");
  },[]);

  useEffect(()=> {
      setInterval(() => {
      let T:number[] = [];
      let V:number[] = [];
      let n = 0;
      let message = {};
      if(rr_flag) 
      {
        for(let i = 0; i <rawArr.length; i++)
        {
          T.push(n);
          V.push(rawArr[i][1]);
          //console.log('in for loop', rawArr[i][1])
          n=n+1;
        }
/*         console.log('T' , T);
        console.log('V', V); */
     
        message = {"read_data": [T,V], "params": params, "sqa_bandpass_rr": sqa_bandpass_rr}
        message = JSON.stringify(message)
        workerThread.postMessage(message)
     /*    resultConversion = calculate_rr([T,V], params, sqa_bandpass_rr); */ 
        /* setLiveRR(resultConversion)  */
      /*   console.log('final result', resultConversion); */
      }  
      else {
        //console.log('not enough data',  rawArr.length)
        //console.log('params', patient.pkInfluence, patient.pkThreshold, patient.pkLag)
      }
      rr_flag = 0;  
    }, 10000);
  }, [])
  
  workerThread.onmessage = (message) => {
    console.log('message', message)
    setLiveRR(parseInt(message))
  } 
  return(

    <SafeAreaView style={styles.container}>
    <View style={{flex:.1, marginTop: Platform.OS==="android"?StatusBar.currentHeight:40}}>
    <TopBar liveRR= {liveRR} deviceStatus={deviceStatus}/>
    </View>
      {
        (sensor1Data && sensor1Data.length > 0) || (sensor2Data && sensor2Data.length >0)?(<><LineChart
          style={styles.chart}
          data={{
            dataSets:
            [{
                values: sensor1Data,          
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
            ]
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
              drawGridLines: false,
              drawLabels: false, 
              enabled: true,
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
        />
      </>
        ):<View/>
      }   
      <View style={{flexDirection:'row',  marginHorizontal:ms(20,0.5), justifyContent:'space-between',  alignItems:'center',}}>
     {/*  <ButtonTitle
          btnStyle={{backgroundColor: (isSensor1On ? colors.main : colors.brownGrey), width:ms(80,0.5)}}
          textStyle={{fontSize:ms(14,0.8), color: (isSensor1On ? colors.white : colors.lightGrey)}} title={t.do('sensor1')} onPress={()=>{
          toggleSensor1();
      }}/>
      <ButtonTitle
          btnStyle={{backgroundColor: (isSensor2On ? colors.main : colors.brownGrey), width:ms(80,0.5)}}
          textStyle={{fontSize:ms(14,0.8), color: (isSensor2On ? colors.white : colors.lightGrey)}} title={t.do('sensor2')} onPress={()=>{
          toggleSensor2();
      }}/> */}
      <ButtonTitle
          btnStyle={{backgroundColor: (colors.main),/*  width:ms(80,0.5) */ borderRadius:ms(15, 0.5), height:40}}
          textStyle={{fontSize:ms(12,0.8), color: (colors.white )}} title={'Settings'} onPress={()=>{ nav.showProfile();
      }}/>     
     <View style={styles.column}>  
      <Text style={{
        fontSize: ms(12,0.8),
        fontFamily:'karla_bold',
        color:colors.black,
      }}>
        Device status:
      </Text>
      <Text style={{
        fontSize: ms(12,0.8),
        fontFamily:'karla_bold',
        color:colors.black,
      }}>
        {deviceStatus}
      </Text>
      </View>
     

      <ToggleSwitch
        isOn={isEnabled}
        onColor={colors.main}
        offColor="gray"
        label="Peak Detection"
        labelStyle={{fontSize: ms(12,0.8),
        fontFamily:'karla_bold',
        color:colors.black, }}
        size="small"
        onToggle={isEnabled => setIsEnabled(isEnabled)}
      />      
               
      <ButtonTitle
        btnStyle={{backgroundColor: colors.main, width:ms(80,0.5), height:40, borderRadius:ms(15, 0.5)}}
        textStyle={{fontSize:ms(12,0.8), color:colors.white}} title={!isLiveModeStart ? t.do('start') : t.do('stop')}
        onPress={()=>
          {
                if(!isLiveModeStart) {
                    bluetooth.setMode(ModeType.LIVE_MODE)
                    if(!bluetooth.connected) {
                        connectDevice();
                    }
                    setLiveModeStart(true);
                    mIsLiveMode = true;
                } else {
                    if(bluetooth.connected) {
                        bluetooth.disconnectDevice(bluetooth.connectedId)
                    }
                    bluetooth.setMode(0);
                    setLiveModeStart(false);
                    mIsLiveMode = false;

                     const headerString = 'newDataLength,newData,\n';
                    const rowString = values.map(d => `${d[0]},${d[1]}\n`).join('');
                    const csvString = `${headerString}${rowString}`;             
                    const pathToWrite = `${RNFetchBlob.fs.dirs.DownloadDir}/data.csv`;     
                    RNFetchBlob.fs
                      .writeFile(pathToWrite, csvString, 'utf8')
                      .then(() => {
                        console.log(`wrote file ${pathToWrite}`);
                        // wrote file /storage/emulated/0/Download/data.csv
                      })
                      .catch(error => console.error(error));               
                }
            //}
          }}/>              
      </View>
    </SafeAreaView>  
  )

});

export default LiveData;

const _styles = (theme: ThemeType) => ScaledSheet.create({
    column:{
      display: 'flex',
      flexDirection: 'column',
      justifyContent:'center',
      alignContent:'center',
      textAlign:'center'
    },
    row:{
      width: 400,
      flexDirection: 'row',
      justifyContent:'flex-start',
      alignContent:'center',
    },
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
      justifyContent:'space-around'
      
    },
    chart_container: {
        flex: 1,
    },
    chart: {
      padding:0,
      marginHorizontal:0,
      height: mvs(90),
    
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