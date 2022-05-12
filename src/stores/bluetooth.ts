import { observable, action, makeObservable, configure } from 'mobx';
import { persist } from 'mobx-persist';
import { HydratedStore } from 'src/utils/classes';
import { NativeEventEmitter, NativeModules, Platform, PermissionsAndroid, EmitterSubscription } from 'react-native';
import { Buffer } from 'buffer';
import BleManager,{ AdvertisingData } from 'react-native-ble-manager';
import _ from 'lodash';
import moment from 'moment';
import Toast from 'react-native-simple-toast';

configure({enforceActions:"never"})

const DEBUG = true;

const printOut = (...args: any[]) => {
    if (DEBUG) console.log("Bluetooth====>",args);
 };

const BleManagerModule = NativeModules.BleManager;
const bleManagerEmitter = new NativeEventEmitter(BleManagerModule);

const SERVICE_NOTIFY_WRITE_READ = "ffe0"
const NOTIFY_WRITE_READ_CHARACTERISTIC = "ffe1";

let mBleTimer = null;
let mBleSensorPackedFormat = false;

export interface BleCallback {
  ( error?: any, result?: any ) : void;
}

class BleCbType {
  id: string ;
  cb: BleCallback;
  constructor(id:string, cb: BleCallback){
    this.id = id;
    this.cb = cb;
  }
}

class Record{
  @persist @observable userID:string="";
  @persist @observable datetime:string="";
  @persist @observable battery = 0;
  @persist @observable sensorID="";
  @persist @observable packetNumber = 1;
  @persist @observable totalPacket = 1;
  @persist @observable dataColName="";
  @persist @observable sensorMode="";
  @persist @observable mode="";
  @persist @observable recordCollectedBySensor=0;
  @persist @observable recordReceivedByGateway=0;
  @persist('list') @observable data:Array<string>=[];
}

export enum ModeType{
  GW_MODE = 301,
  LIVE_MODE,
  PULL_MODE,
}

export enum ErrType {
  Scan_Fail = 101,
  Notification_Fail,
  Disconnect_Fail,
  Connect_Fail,
  Write_Fail,
}

export enum SuccessType {
  Notification_Started =1,
  Write_Success,
  Discover_Success,
  Ble_State_Changed,
  Ble_Status_Changed,
  Ble_Received_Data,
  Ble_Syncing_Record,
  Ble_Single_Sensor_Data,
  Disconnected,
}

export enum BleSensorConstant {
    BLE_SENSOR_COMMAND_START_BYTE                 = 0x40,
    BLE_SENSOR_COMMAND_END_BYTE                   = 0x25,
    BLE_SENSOR_RECORD_START_BYTE                  = 0x24,

    BLE_SENSOR_COMMAND_REQ_GET_DEVICE_TIME        = 0x1,
    BLE_SENSOR_COMMAND_REQ_SET_DEVICE_TIME        = 0x3,
    BLE_SENSOR_COMMAND_REQ_GET_DEVICE_STATUS      = 0x5,
    BLE_SENSOR_COMMAND_REQ_REGISTER_PATIENT_ID    = 0x7,
    BLE_SENSOR_COMMAND_REQ_DEREGISTER_PATIENT_ID  = 0x9,
    BLE_SENSOR_COMMAND_REQ_RESET_DATA             = 0xB,
    BLE_SENSOR_COMMAND_REQ_SEND_ALL_RECORDS       = 0xD,
    BLE_SENSOR_COMMAND_REQ_SEND_LIVE_RECORDS      = 0xF,
    BLE_SENSOR_COMMAND_REQ_SEND_LIVE_PACKED       = 0x11,

    BLE_SENSOR_COMMAND_RES_GET_DEVICE_TIME        = 0x2,
    BLE_SENSOR_COMMAND_RES_SET_DEVICE_TIME        = 0x4,
    BLE_SENSOR_COMMAND_RES_GET_DEVICE_STATUS      = 0x6,
    BLE_SENSOR_COMMAND_RES_REGISTER_PATIENT_ID    = 0x8,
    BLE_SENSOR_COMMAND_RES_DEREGISTER_PATIENT_ID  = 0xA,
    BLE_SENSOR_COMMAND_RES_RESET_DATA             = 0xC,
    BLE_SENSOR_COMMAND_RES_SEND_ALL_RECORDS       = 0xE,
    BLE_SENSOR_COMMAND_RES_SEND_LIVE_RECORDS      = 0x10,
    BLE_SENSOR_COMMAND_RES_SEND_LIVE_PACKED       = 0x12,

    BLE_SENSOR_RESPONSE_SUCCESS                   = 0x4b,

    BLE_SENSOR_ERROR_INVALID_START_BYTE           = 0xe0,
    BLE_SENSOR_ERROR_INVALID_END_BYTE             = 0xe1,
    BLE_SENSOR_ERROR_INVALID_COMMAND              = 0xe2,
    BLE_SENSOR_ERROR_WRONG_PATIENT_ID             = 0xe3,
    BLE_SENSOR_ERROR_UNKNOWN_FAILURE              = 0xe4,
    BLE_SENSOR_ERROR_ACCESS_DENIED                = 0xe5,
    BLE_SENSOR_ERROR_REGISTER_PATIENT_FAILED      = 0xe6,
    BLE_SENSOR_ERROR_DEREGISTER_PATIENT_FAILED    = 0xe7,
    BLE_SENSOR_ERROR_RESET_FAILED                 = 0xe8,
    BLE_SENSOR_ERROR_SEND_ALL_RECORDS_FAILED      = 0xe9,
};

class BleStore extends HydratedStore {

  constructor() {
    super('BleStore'); // Storage ID

    makeObservable(this);
  }

  //====data to be kept in phone=====
  @persist @observable connectedId  = "";
  @persist @observable gatewayMode = false;
  @persist @observable liveMode = false;
  @persist @observable pullMode = false;
  @persist('object', Record) @observable savedRecords = new Record
  //=================================
  //========to be watched in the app====
  @observable peripherals = new Map()
  @observable isOn = false
  @observable isScanning = false
  @observable scannedList = [];
  @observable connected = false;
  @observable foundDevice = false;
  @observable batteryLevel = -1;
  @observable isBusy = false;
  //===================================

  //============private var and func===============
  initialized = false;
  record = new Record
  dataString:Array<string> = [];
  sensorRecords = 0;
  battery = 0;
  currRecordCount = 0;
  fwVersion = 0;
  postCount = 0;
  bleCallbacks: Array<BleCbType> = new Array<BleCbType>();
  handleState?:EmitterSubscription;
  handlerDiscover?:EmitterSubscription;
  handlerStop?:EmitterSubscription;
  handlerDisconnect?:EmitterSubscription;
  handlerUpdate?:EmitterSubscription;

  //==================================bluetooth callback section=======================================
  handleDiscoverPeripheral(peripheral:any){
    const bytes = peripheral.advertising?.manufacturerData?.bytes ?? [];

    if (/*bytes.length !== 0 &&*/ peripheral.name !== null && peripheral.name !== undefined /*&& peripheral.name.toUpperCase().startsWith("R-")*/) {
      printOut(peripheral.name, "serialNo====",peripheral.id);
      this.callbackToAllListener(null, {type: SuccessType.Discover_Success, deviceId: peripheral.id, deviceName: peripheral.name})
    }
  }

  handleStopScan() {
    this.isScanning = false;
    this.peripherals = new Map();
    this.foundDevice = false;
  }

  handleDisconnectedPeripheral(data:any) {
    console.log("handleDisconnectedPeripheral data=====",data);
    if(data.status > 0)
      return;

    let peripheral = this.peripherals.get(data.peripheral);
    if (peripheral !== undefined) {
      this.peripherals.delete(peripheral.id);
    }
    this.connected = false;
    //console.log("handleDisconnectedPeripheral",this.isBusy, this.sensorRecords);
    console.log("this.record.recordCollectedBySensor " + this.record.recordCollectedBySensor + ", this.sensorRecords: " + this.sensorRecords);
    //if(this.isBusy && this.record && this.record.recordCollectedBySensor > 0 && this.sensorRecords > 0){

    if(this.isBusy && this.sensorRecords > 0){
      console.log("recordReceivedByGateway " + this.record.recordReceivedByGateway + " recordCollectedBySensor " + this.record.recordCollectedBySensor)
      //if(this.record.recordReceivedByGateway < this.record.recordCollectedBySensor){
      if(this.gatewayMode) {
          console.log("Gateway mode, skip reconnect");
          this.isBusy = false;
          this.saveRecord();
          this.clearCurrRecords();
          this.callbackToAllListener(null, {type: SuccessType.Ble_Status_Changed});
      } else {
          if(this.pullMode || this.liveMode) {
              if(this.record.recordReceivedByGateway < this.sensorRecords) {
                //const remaingRecords = this.record.recordCollectedBySensor - this.record.recordReceivedByGateway;
                const remaingRecords = this.sensorRecords - this.record.recordReceivedByGateway;
                if(remaingRecords < 1000){
                  console.log("remaining records < 1000 no need to reconnect")
                  this.isBusy = false;
                  this.saveRecord();
                  this.clearCurrRecords();
                  this.callbackToAllListener(null, {type:SuccessType.Ble_Status_Changed, syncDone: true});
                }else{
                  this.saveRecord();
                  this.clearCurrRecords();
                  this.callbackToAllListener(null, {type: SuccessType.Ble_Syncing_Record, remaingRecords, uploadToServer: this.liveMode?false:true})
                  this.postCount++;
                  const thisble = this;
                  if(mBleTimer) {
                      clearTimeout(mBleTimer);
                      console.log("Clear Timeout!!")
                  }
                  mBleTimer = setTimeout(function(){
                    console.log("retrying to connect device",thisble.connectedId, "isConnected",thisble.connected)
                    if(thisble.connected || thisble.sensorRecords <= 0)
                       return;
                    thisble.connectDevice(thisble.connectedId);
                  }, 2000)
                }
              }else{
                console.log("recordReceivedByGateway >= sensorRecords")
                this.isBusy = false;
                this.callbackToAllListener(null, {type: SuccessType.Ble_Status_Changed});
                this.setMode(0);
              }
          } else {
              this.isBusy = false;
              this.callbackToAllListener(null, {type: SuccessType.Ble_Status_Changed});
          }

      }

    }else{
      this.isBusy = false;
      this.callbackToAllListener(null, {type: SuccessType.Ble_Status_Changed});
    }

  }

  handleBluetoothState(res:any){
    if(res.state === "on")
    {
      this.isOn = true;
    }else{
      this.isOn = false;
      this.isScanning = false;
      this.peripherals = new Map();
    }
    this.callbackToAllListener(null, SuccessType.Ble_State_Changed)
  }

  handleUpdateValueForCharacteristic(data:any) {
    //var dataLength = data.value.length;
    //printOut('Received data from ' + data.peripheral + ' characteristic ' + data.characteristic + ' length: ' + dataLength , data.value);
    //var characteristic = data.characteristic.toLowerCase();
    //console.log('characteristic===',characteristic);
    //ignore characterisitic
    //printOut('value---->>>', data.value)
    if(data && data.value && data.value.length > 0){
    if(data.value[0] == BleSensorConstant.BLE_SENSOR_COMMAND_START_BYTE
        && (data.value[1] == BleSensorConstant.BLE_SENSOR_COMMAND_RES_SEND_ALL_RECORDS || data.value[1] == BleSensorConstant.BLE_SENSOR_COMMAND_RES_SEND_LIVE_RECORDS)){ //Send record response
        //&& (data.value[1] == BleSensorConstant.BLE_SENSOR_COMMAND_RES_SEND_ALL_RECORDS || data.value[1] == BleSensorConstant.BLE_SENSOR_COMMAND_RES_SEND_LIVE_PACKED)){ //Send record response
      if(data.value[4] == BleSensorConstant.BLE_SENSOR_ERROR_SEND_ALL_RECORDS_FAILED){
        printOut("no new record");
        this.callbackToAllListener(null, {type:SuccessType.Ble_Syncing_Record, noRecords:0, uploadToServer: this.liveMode?false:true})
      }
      else{
          //printOut('value---->>>', data.value)
        let noRecords = (data.value[8] << 24) | (data.value[9] << 16) | (data.value[10] << 8) | (data.value[11]);
        let fwVersion = ((data.value[6] << 8) | (data.value[7]));
        let batteryLevel = data.value[5];
        let docked = data.value[12];
        if(data.value[13] != 0) {
            mBleSensorPackedFormat = true;
        } else {
            mBleSensorPackedFormat = false;
        }
        this.sensorRecords = noRecords;
        this.battery = batteryLevel;
        this.fwVersion = fwVersion;
        printOut("noRecords " + noRecords + ", battery: " + batteryLevel + ", fwVer:" + fwVersion + ", isPackedFormat: " + mBleSensorPackedFormat);
        this.callbackToAllListener(null, {type: SuccessType.Ble_Syncing_Record, noRecords})
      }
    }
    else if(data.value[0] == BleSensorConstant.BLE_SENSOR_RECORD_START_BYTE && (this.sensorRecords > 0 || this.liveMode)){
      const value = data.value;
      const valueLength = value.length;

      let dataOffset = mBleSensorPackedFormat ? 10 : 16;
      let remainingLength = valueLength;

      const mode = value[1];
      let timestamp = 0, temp = 0, battery = 0;
      let count = 0;
      if(mBleSensorPackedFormat) {
          //timestamp = new Uint8Array([value[2],value[3], value[4], value[5]]);
          //temp = (value[6] << 8) | (value[7]);
          //battery = value[8];

          //if non-live mode, make sure timestamp not 0
          if(!this.liveMode) {
              timestamp = new Uint8Array([value[2],value[3], value[4], value[5]]);
              temp = (value[6] << 8) | (value[7]);
              battery = value[8];
              if(value[2] == 0 && value[3] == 0 && value[4] == 0 && value[5] == 0)
              {
                  remainingLength = 0;
              }
          }
          //console.log("timestamp: ", toHexString(timestamp))
      } else {
          battery = this.battery;
          //if non-live mode, make sure timestamp not 0
          if(!this.liveMode) {
              if(value[14] == 0 && value[15] == 0 && value[16] == 0 && value[17] == 0)
              {
                  remainingLength = 0;
              }
          }
      }
          //console.log("data>> ", value)
      let temperature = 0;

      if(this.liveMode) {
          if(remainingLength < 20) {
              remainingLength = 0;
          }
      }

      if(remainingLength > 0) {
          if(mBleSensorPackedFormat) {
              if(!this.liveMode) {
                  remainingLength -= 12;
              } else {
                  remainingLength -= 4;
                  dataOffset = 4;
                  temperature = (Number(value[3])/10 + 30);

                  console.log("counter: " + value[2] + ", misc: " + value[1] + ", temp: " + temperature)


              }
          } else {
              remainingLength -= 2;
          }

          do {
              let start = count * dataOffset;
              let sensor1 = 0, sensor2 = 0, axl_x = 0, axl_y = 0, axl_z = 0;
              if(mBleSensorPackedFormat) {
                  if(!this.liveMode) {
                      sensor1 = (value[start + 12] << 8) | (value[start + 13]);
                      sensor2 = (value[start + 14] << 8) | (value[start + 15]);
                      axl_x = (value[start + 16] << 8) | (value[start + 17]);
                      axl_y = (value[start + 18] << 8) | (value[start + 19]);
                      axl_z = (value[start + 20] << 8) | (value[start + 21]);
                  } else {
                      sensor1 = (value[start + 4] << 8) | (value[start + 5]);
                      sensor2 = (value[start + 6] << 8) | (value[start + 7]);
                  }
              } else {
                  temp = (value[start + 2] << 8) | (value[start + 3]);
                  sensor1 = (value[start + 4] << 8) | (value[start + 5]);
                  sensor2 = (value[start + 6] << 8) | (value[start + 7]);
                  axl_x = (value[start + 8] << 8) | (value[start + 9]);
                  axl_y = (value[start + 10] << 8) | (value[start + 11]);
                  axl_z = (value[start + 12] << 8) | (value[start + 13]);
                  timestamp = new Uint8Array([value[start + 14],value[start + 15], value[start + 16], value[start + 17]]);
              }

              if(sensor1 == 0 && sensor2 == 0 && axl_x == 0 && axl_y == 0 && axl_z == 0) {
                  console.log("skip null data");
              }
              else {
                  //console.log("timestamp>>>> ", timestamp);
                  this.record!.sensorMode = mode == 5?"HR":"RR"
                  this.record!.mode = mode == 5?"PULSE OXIMETRY":"RESPIRATORY RATE"
                  this.record!.recordCollectedBySensor = this.sensorRecords;
                  this.record!.battery = battery;
                  this.currRecordCount++;
                  this.record!.recordReceivedByGateway = this.currRecordCount;
                  let currData = `${toHexString(timestamp)}${convertToHexString(sensor1, true)}${convertToHexString(sensor2, true)}${convertToHexString(axl_x)}${convertToHexString(axl_y)}${convertToHexString(axl_z)}${convertToHexString(temp)}${mode == 5?"5":"A"}`

                  //don't save for liveMode
                  if(!this.liveMode) {
                      this.dataString.push(currData);
                      this.record!.data=this.dataString;
                  }

                  this.isBusy  = true;
                  if(!(this.currRecordCount % 100)) {
                      console.log("currRecordCount: " + this.currRecordCount);
                      //console.log("currData>>>> ", currData);
                  }
                  if(this.liveMode) {
                      console.log('sensor1', sensor1)
                      this.callbackToAllListener(null, {type:SuccessType.Ble_Single_Sensor_Data, sensor1, sensor2, temperature });
                  }
              }
              count++;

              remainingLength -= dataOffset;
          } while(remainingLength > dataOffset);
          //console.log("receive",this.record);
          this.callbackToAllListener(null, {type:SuccessType.Ble_Received_Data, receive: count, });//receive: this.currRecordCount})
      }
      else {
          console.log("Skip 0 values timestamp")
      }
    }
    else if(data.value[0] == BleSensorConstant.BLE_SENSOR_COMMAND_START_BYTE && data.value[1] == BleSensorConstant.BLE_SENSOR_COMMAND_RES_GET_DEVICE_STATUS){
        this.batteryLevel = data.value[13];
    }
    else
        this.callbackToAllListener(null, {type:SuccessType.Ble_Received_Data, data})
    }
  }

  //==================================end of bluetooth callback section=======================================

  startBle = ()=>{
    BleManager.start({showAlert: true}).then(() => {
      BleManager.checkState()
    });
  }

  callbackToAllListener = async(error?:any, result?: any)=>{
    if(!_.isEmpty(this.bleCallbacks)){
      this.bleCallbacks.forEach(async (listener) => {
        try{
          if(listener && listener.cb){
            listener.cb(error, result);
          }
        }catch(e){}
      });
    }
  }

  notifyNotificationsAdded = (isError:boolean, error?:any) => {
    if(isError){
       this.isBusy = false;
       this.callbackToAllListener(error, ErrType.Notification_Fail)
    }
    else{
       this.connected = true;
       this.callbackToAllListener(null, SuccessType.Notification_Started);
    }
  }

  addNotificationListeners = (device:string) => {
    const thisble = this;
    BleManager.startNotification(device, SERVICE_NOTIFY_WRITE_READ, NOTIFY_WRITE_READ_CHARACTERISTIC)//notif.service, notif.characteristic)
      .then(() => {
        this.notifyNotificationsAdded(false);
      })
      .catch(error => {
          printOut("addNotificationListeners*******************error: " + error)
          thisble.disconnectDevice(thisble.connectedId)
          this.notifyNotificationsAdded(error, ErrType.Notification_Fail);
      });
  }

  retrieveServices(deviceId:string)
  {
      printOut("retrieve service",deviceId);
      BleManager.retrieveServices(deviceId)
        .then((peripheralInfo) => {
            // Success code
            //printOut("peripheralInfo",peripheralInfo);
            this.connectedId = deviceId;
            this.addNotificationListeners(deviceId)
        }).catch((error) =>{
            console.log("retrieve service err==",error)
            this.notifyNotificationsAdded(true, error);
        });
  }

  requestMtu(deviceId: string, mtuSize: number) {
      printOut("requestMtu",deviceId);
      BleManager.requestMTU(deviceId, mtuSize)
        .then((mtu) => {
            // Success code
            console.log("MTU size changed to " + mtu + " bytes");
            this.retrieveServices(deviceId);
        })
        .catch((error) => {
            // Failure code
            console.log(error);
        });
  }

  @action init = () => {

    if(this.initialized)
      return;
    this.initialized = true;
    this.handleDiscoverPeripheral = this.handleDiscoverPeripheral.bind(this);
    this.handleStopScan = this.handleStopScan.bind(this);
    this.handleDisconnectedPeripheral = this.handleDisconnectedPeripheral.bind(this);
    this.handleBluetoothState = this.handleBluetoothState.bind(this);
    this.handleUpdateValueForCharacteristic = this.handleUpdateValueForCharacteristic.bind(this);

    this.handleState = bleManagerEmitter.addListener('BleManagerDidUpdateState', this.handleBluetoothState );
    this.handlerDiscover = bleManagerEmitter.addListener('BleManagerDiscoverPeripheral', this.handleDiscoverPeripheral );
    this.handlerStop = bleManagerEmitter.addListener('BleManagerStopScan', this.handleStopScan );
    this.handlerDisconnect = bleManagerEmitter.addListener('BleManagerDisconnectPeripheral', this.handleDisconnectedPeripheral );
    this.handlerUpdate = bleManagerEmitter.addListener('BleManagerDidUpdateValueForCharacteristic', this.handleUpdateValueForCharacteristic );

    if(!this.isOn){
      this.foundDevice = false;
      if (Platform.OS === 'android' && Platform.Version >= 23) {
        /*PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION).then(
           result => {
              if (result) {
                 printOut('Permission is OK');
                 this.startBle();
              } else {
                 PermissionsAndroid.request(
                    PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION,
                 ).then(res => {
                    if (res) {
                      this.startBle();
                    } else {
                      Toast.show('Permission rejected by user',Toast.SHORT)
                    }
                 });
              }
           },
       );*/
       PermissionsAndroid.check(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
      ).then(result => {
        if (result) {
          console.log('Permission is OK');
          this.startBle();
        } else {
          PermissionsAndroid.requestPermission(
            PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
          ).then(result => {
            if (result) {
              console.log('User accept');
              this.startBle();
            } else {
              console.log('User refuse');
            }
          });
        }
      });
      }
      else{
        this.startBle();
      }
    }
  }

  @action uninit = () => {
    printOut("uninit bluetooth");
    bleManagerEmitter.removeAllListeners("BleManagerDidUpdateState");
    bleManagerEmitter.removeAllListeners("BleManagerDiscoverPeripheral");
    bleManagerEmitter.removeAllListeners("BleManagerStopScan");
    bleManagerEmitter.removeAllListeners("BleManagerDisconnectPeripheral");
    bleManagerEmitter.removeAllListeners("BleManagerDidUpdateValueForCharacteristic");
    if(this.connectedId){
      BleManager.disconnect(this.connectedId);
    }
    this.initialized = false;
  }

  @action scan = () => {
    this.foundDevice = false;
    this.connectedId = null;
    if (!this.isScanning) {
         printOut('Scan is started');
         this.peripherals = new Map();
         BleManager.scan([], 10, true, {matchMode: 1, scanMode: 2}).then((results) => {
             this.isScanning = true;
         }).catch(error => {
           this.isScanning = false;
           this.callbackToAllListener(error, ErrType.Scan_Fail)
          });
     }else{
      printOut('Scan is still scanning');
     }
  }

  @action stopScan = () => {
    this.foundDevice = false;
    this.isScanning = false;
    BleManager.stopScan()
     .then(() => {
       printOut('Scan stopped');
    });
  }

  @action disconnectDevice = (deviceId:string) => {
    BleManager.disconnect(deviceId)
    .then(() => {
      printOut('Disconnected');
      this.connected = false;
      this.callbackToAllListener(null, SuccessType.Disconnected)
    })
    .catch((error) => {
      printOut(error);
      this.callbackToAllListener(error, ErrType.Disconnect_Fail)
    });
  }

  @action connectDevice = (deviceId:string) => {
    console.log("connectDevice",deviceId)
    BleManager.connect(deviceId).then(() => {
        printOut(deviceId + " is connected!!!!!");
        if(Platform.OS === "android"){
          this.requestMtu(deviceId, 256);
        }else{
          this.retrieveServices(deviceId);
        }
    }).catch((error) => {
        printOut('Connection error', error);
        this.isBusy = false;
        this.callbackToAllListener(error, ErrType.Connect_Fail);
    });
   }

  @action addBluetoothCallback = (id:string, callback:BleCallback)=>{
      console.log(">>>>>>>>>>>. addBluetoothCallback " + id + ", callback ", callback)
    let idx = _.findIndex(this.bleCallbacks, {id: id});
    if(id && idx < 0){
      const listener = new BleCbType(id, callback);
      this.bleCallbacks.push(listener)
    }
  }

  @action removeBluetoothCallback = (id:string)=>{
    let foundIdx = _.findIndex(this.bleCallbacks, {'id': id});
    if(foundIdx >= 0){
      this.bleCallbacks.splice(foundIdx, 1);
    }
  }

  @action setConnectedId = async (id:string) => {
    this.connectedId = id;
  }

  @action setMode = async (mode:number) => {
      console.log("setMode>>>>>>>>>>> " + mode)
    if(mode == ModeType.GW_MODE){
      this.gatewayMode = true;
      this.liveMode = false;
      this.pullMode = false;
    } else if(mode == ModeType.LIVE_MODE){
      this.gatewayMode = false;
      this.liveMode = true;
      this.pullMode = false;
    } else if(mode == ModeType.PULL_MODE){
      this.gatewayMode = false;
      this.liveMode = false;
      this.pullMode = true;
    } else{
      this.gatewayMode = false;
      this.liveMode = false;
      this.pullMode = false;
    }
  }

  @action getMode = ()=>{
    if(this.gatewayMode)
      return ModeType.GW_MODE;
    else if(this.liveMode)
      return ModeType.LIVE_MODE;
    else if(this.pullMode) {
      return ModeType.PULL_MODE;
    }
      return 0;
  }

  @action getAscii = (byteArray:Uint8Array) => {
    var name = toHexString(byteArray);
    var ascii = hex_to_ascii(name);
    return ascii;
  }

  @action registerPatient = (deviceId: string, patientId: number) =>{
    let pbytes = [];
    pbytes[0] = BleSensorConstant.BLE_SENSOR_COMMAND_START_BYTE;
    pbytes[1] = BleSensorConstant.BLE_SENSOR_COMMAND_REQ_REGISTER_PATIENT_ID;
    pbytes[2] = ((patientId >> 8) & 0xff);
    pbytes[3] = (patientId & 0xff);
    var idx = 4;
    var len = 15;
    for(var i=0; i<len; i++){
       pbytes[idx+i] = 0x0
    }
    pbytes[idx+15] = BleSensorConstant.BLE_SENSOR_COMMAND_END_BYTE;
    printOut("register patient",pbytes);
    BleManager.write(
       deviceId,
       SERVICE_NOTIFY_WRITE_READ,
       NOTIFY_WRITE_READ_CHARACTERISTIC,
       pbytes,
    )
    .then(() => {
      this.callbackToAllListener(null, SuccessType.Write_Success)
    })
    .catch(error => {
      printOut('Error', error);
      this.callbackToAllListener(error, ErrType.Write_Fail)
    });
  }

  @action getDeviceStatus = (deviceId: string, patientId: number) =>{
    let pbytes = [];
    pbytes[0] = BleSensorConstant.BLE_SENSOR_COMMAND_START_BYTE;
    pbytes[1] = BleSensorConstant.BLE_SENSOR_COMMAND_REQ_GET_DEVICE_STATUS;
    pbytes[2] = ((patientId >> 8) & 0xff);
    pbytes[3] = (patientId & 0xff);
    var idx = 4;
    var len = 15;
    for(var i=0; i<len; i++){
       pbytes[idx+i] = 0x0
    }
    pbytes[idx+15] = BleSensorConstant.BLE_SENSOR_COMMAND_END_BYTE;
    printOut("get device status",pbytes);
    BleManager.write(
       deviceId,
       SERVICE_NOTIFY_WRITE_READ,
       NOTIFY_WRITE_READ_CHARACTERISTIC,
       pbytes,
    )
    .then(() => {
      this.callbackToAllListener(null, SuccessType.Write_Success)
    })
    .catch(error => {
      this.callbackToAllListener(error, ErrType.Write_Fail)
    })
  }

  @action sendCurrTime = (deviceId: string, patientId: number) =>{
    let pbytes = [];
    pbytes[0] = BleSensorConstant.BLE_SENSOR_COMMAND_START_BYTE;
    pbytes[1] = BleSensorConstant.BLE_SENSOR_COMMAND_REQ_SET_DEVICE_TIME;
    pbytes[2] = ((patientId >> 8) & 0xff);
    pbytes[3] = (patientId & 0xff);
    let currTime = moment.utc();
    const curTimeinSec = (currTime.valueOf()/1000).toFixed(0);
    const sec = Number.parseInt(curTimeinSec);
    var byteInt = toBytesInt32(sec);
    var j = 4;
    var ii = 0;
    for(var i=0; i<byteInt.length; i++){
       pbytes[j+i] = byteInt[i];
       ii++;
    }
    while(ii < 4){
       pbytes[j+ii] = 0;
       ii++;
    }
    var idx = j+ii;
    var len = 11;
    for(var i=0; i<len; i++){
       pbytes[idx+i] = 0x0
    }
    pbytes[idx+len] = BleSensorConstant.BLE_SENSOR_COMMAND_END_BYTE;
    printOut("sendCurrTime ",pbytes);
    BleManager.write(
       deviceId,
       SERVICE_NOTIFY_WRITE_READ,
       NOTIFY_WRITE_READ_CHARACTERISTIC,
       pbytes,
    )
    .then(() => {
      this.callbackToAllListener(null, SuccessType.Write_Success)
    })
    .catch(error => {
      this.callbackToAllListener(error, ErrType.Write_Fail)
    })
  }

  @action sendAllRecords = (deviceId: string, patientId: number) =>{
    printOut("sendAllRecords is triggered!!!!");
    let pbytes = [];
    pbytes[0] = BleSensorConstant.BLE_SENSOR_COMMAND_START_BYTE;
    pbytes[1] = this.liveMode ? BleSensorConstant.BLE_SENSOR_COMMAND_REQ_SEND_LIVE_RECORDS : BleSensorConstant.BLE_SENSOR_COMMAND_REQ_SEND_ALL_RECORDS;
    pbytes[2] = ((patientId >> 8) & 0xff);
    pbytes[3] = (patientId & 0xff);
    var idx = 4;
    var len = 15;
    for(var i=0; i<len; i++){
       pbytes[idx+i] = 0x0
    }
    pbytes[idx+15] = BleSensorConstant.BLE_SENSOR_COMMAND_END_BYTE;
    printOut("send All records ",pbytes);
    BleManager.write(
       deviceId,
       SERVICE_NOTIFY_WRITE_READ,
       NOTIFY_WRITE_READ_CHARACTERISTIC,
       pbytes,
    )
    .then(() => {
      this.callbackToAllListener(null, SuccessType.Write_Success)
    })
    .catch(error => {
      this.callbackToAllListener(error, ErrType.Write_Fail)
    })
  }

  @action setBattery = (level:number)=>{
    this.batteryLevel = level;
  }

  @action setBusy = (status:boolean)=>{
    this.isBusy = status;
  }

  @action setNewRecord = (userId:number)=>{
    this.record = new Record();
    this.record.userID = numberToString(userId);
    this.record.datetime = moment().utc().format("YYYY-MM-DD HH:mm:ss");
    this.record.battery = 0;
    this.record.sensorID = this.connectedId!.replace(/:/g,"");
    this.record.packetNumber = 1;
    this.record.totalPacket = 1;
    this.record.dataColName= "{DDDDDDDDRRRRSSSSXXXYYYZZZTTTM}"
    this.dataString = [];
    this.sensorRecords = 0;
    this.currRecordCount = 0;
    this.fwVersion = 0;
    this.battery = 0;
  }

  @action saveRecord = ()=>{
    if(this.savedRecords && this.savedRecords.recordCollectedBySensor > 0){
      //printOut("there are saved record awaiting to be uploaded")
      return false;
    }else if(this.record && this.record.recordCollectedBySensor > 0){
      //printOut("keep curr record in the phone")
      this.savedRecords = new Record();
      this.savedRecords.userID = this.record?.userID;
      this.savedRecords.battery = this.record?.battery;
      this.savedRecords.datetime = this.record.datetime;
      this.savedRecords.sensorID= this.record.sensorID;
      this.savedRecords.packetNumber = this.record.packetNumber;
      this.savedRecords.totalPacket = this.record.totalPacket;
      this.savedRecords.dataColName= this.record.dataColName;
      this.savedRecords.sensorMode= this.record.sensorMode;
      this.savedRecords.mode= this.record.mode;
      this.savedRecords.recordCollectedBySensor= this.record.recordCollectedBySensor;
      this.savedRecords.recordReceivedByGateway= this.record.recordReceivedByGateway;
      this.savedRecords.data= this.record.data;
      return true;
    }else{
      return true;
    }
  }

  @action cancelUploading = ()=>{
    this.isBusy = false;
    this.sensorRecords = 0;
    this.battery = 0;
    this.record = new Record();
    this.disconnectDevice(this.connectedId)
  }

  @action clearCurrRecords = ()=>{
    this.record = new Record();
  }

  @action clearRecord = ()=>{
    this.savedRecords = new Record();
  }
}

/* helpers */
export function stringToHexByte(str:string) {
  let bufferOne = Buffer.from(str);
  return bufferOne[0];
}

export function stringToHexUInt8(str:Buffer, offset:number) {
  var bufferOne = Buffer.alloc(1);
  str.copy(bufferOne, 0, offset, offset+1);
  return bufferOne.readUInt8(0)
}

export function stringToHexUInt16(str:Buffer, offset:number) {
  var bufferOne = Buffer.alloc(2);
  str.copy(bufferOne, 0, offset, offset+2);
  return bufferOne.readUInt16LE(0)
}

export function toBytesInt32 (num:number) {
  var arr = new Uint8Array([
           (num & 0xff000000) >> 24,
           (num & 0x00ff0000) >> 16,
           (num & 0x0000ff00) >> 8,
           (num & 0x000000ff)
       ]);
  var array = [];
  for (var i = 0; i < arr.byteLength; i++) {
      array[i] = arr[i];
  }
  return array;
}

export function decimal8ToHexStr(d:number) {
  return  ("0"+(Number(d).toString(16))).slice(-2).toUpperCase()
}

export function decimal16ToHexStr(d:number) {
  return  ("0"+(Number(d).toString(16))).slice(-4).toUpperCase()
}

export function decimal32ToHexStr(d:number) {
  return  ("0"+(Number(d).toString(16))).slice(-8).toUpperCase()
}

export function hex_to_ascii(str1:string)
{
  var hex  = str1.toString();
  var str = '';
  for (var n = 0; n < hex.length; n += 2) {
    str += String.fromCharCode(parseInt(hex.substr(n, 2), 16));
  }
  return str;
}

export function toHexString(byteArray: Uint8Array) {
  return Array.from(byteArray, function(byte) {
      return ('0' + (byte & 0xFF).toString(16)).slice(-2);
  }).join('')
}

export function numberToString(aNumber: number): string {
  /*if(aNumber < 10)
      return "000" + aNumber;
  if(aNumber < 100)
      return "00" + aNumber;
  if(aNumber < 1000)
      return "0" + aNumber;*/
  return "" + aNumber;
}

export const convertToHexString= (c:number, fourdigits = false)=>{
  let d = c;
  if(d > 0xFFF)
     d = c & 0xFFF;
  let char = Math.abs(d).toString(16);
  if(fourdigits){
    if(char.length == 1)
     char = "000"+char;
    else if(char.length == 2)
     char = "00"+char;
    else if(char.length == 3)
     char = "0"+char

  } else {
    if(char.length == 1)
     char = "00"+char;
    else if(char.length == 2)
     char = "0"+char

  }
  return char;
}

export default new BleStore();
