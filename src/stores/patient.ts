import { observable, action, makeObservable } from 'mobx';
import { persist } from 'mobx-persist';
import { HydratedStore } from 'src/utils/classes';
import _ from 'lodash';

export class Sensor{
  @persist @observable id:string;
  @persist @observable  name:string;
  @persist @observable session:number;
  constructor(id:string, name:string, session:number){
    this.id = id;
    this.name = name;
    this.session = session;
  }
}

class PatientStore extends HydratedStore {
  constructor() {
    super('PatientStore'); // Storage ID

    makeObservable(this);
  }

  //====data to be kept in phone=====
  @persist @observable id = 888;
  @persist @observable firstName? = "";
  @persist @observable lastName? = "";
  @persist @observable age? = 0;
  @persist @observable gender? = "";
  @persist @observable ethnic? = "";
  @persist @observable height? = 0;
  @persist @observable weight? = 0;
  @persist @observable fev? = 0;
  @persist @observable blood? = 0;
  @persist @observable password = "123456";
  @persist @observable timeInterval = 1;
  @persist @observable noEvents = 100;
  @persist @observable restriction = false;
  @persist @observable isRegister = false;
  @persist('list', Sensor) @observable sensors = new Array<Sensor>()
  //=================================


  @action setId = (id:number) => {
    this.id = id;
  }

  @action registerOk = (status:boolean)=>{
    this.isRegister = status;
  }

  @action setProfile = (id:number, fName?:string, lName?:string, age?:number, ethnic?:string, height?:number, weight?:number, fev?:number, blood?:number, gender?:string) => {
    this.id = id;
    this.firstName = fName;
    this.lastName = lName;
    this.age = age;
    this.ethnic = ethnic;
    this.height = height;
    this.weight = weight;
    this.fev = fev;
    this.blood = blood;
    this.gender = gender;
  }

  @action addSensor = (id:string, name:string, session:number)=>{
    if(_.findIndex(this.sensors, {id: id}) < 0){
      let s = new Sensor(id, name, session);
      this.sensors.push(s);
    }
  }

  @action removeSensor = (macAddr: string)=>{
    const found = _.findIndex(this.sensors, {id:macAddr});
    if( found >= 0){
      this.sensors.splice(found, 1);
    }
  }

  @action removeAllSensors = ()=>{
    this.sensors.splice(0, this.sensors.length)
  }

  @action setTimeInterval = (interval: number)=>{
    this.timeInterval = interval;
  }

  @action setNoEvent = (noEvent: number)=>{
    this.noEvents = noEvent;
  }

  @action setRestriction = (enable: boolean)=>{
    this.restriction = enable;
  }

  @action setDefault = (id:string)=>{
    let sensors = this.sensors;
    sensors.forEach(function(item,i){
      if(item.id === id){
        sensors.splice(i, 1);
        sensors.unshift(item);
      }
    });
    this.sensors = sensors;
  }
}

export default new PatientStore();
