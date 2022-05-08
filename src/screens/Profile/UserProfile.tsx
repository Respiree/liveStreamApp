import React, {useState, useEffect}from 'react';
import { View, Text, TextInput, Alert, ToastAndroid } from 'react-native';
import { observer } from 'mobx-react';
import { useStores } from 'src/stores';
import useStyles from 'src/hooks/useStyles';
import { ButtonTitle, ButtonFontAwesomeIcon } from 'src/components/Button';
import { ScaledSheet, s, vs, ms, mvs } from 'react-native-size-matters';
import { useServices } from 'src/services';
import useConstants from 'src/hooks/useConstants';
import RadioGroup, {RadioButtonProps} from 'react-native-radio-buttons-group';
import { ScrollView } from 'react-native-gesture-handler';
import { NavigationFunctionComponent } from 'react-native-navigation';
import { BleCallback, SuccessType, BleSensorConstant, ModeType } from 'src/stores/bluetooth';
import Toast from 'react-native-simple-toast';
import { screens } from 'src/services/navigation/screens';
import { Auth } from 'aws-amplify';
import bluetooth from 'src/stores/bluetooth';
import { useNavigationComponentDidAppear } from 'react-native-navigation-hooks/dist/hooks';

type RowProps = {
  leftTitle:string;
  leftVal:string;
  rightTitle?:string;
  rightVal?:string;
}

// type EditRowInputProps = {
//   title:string;
//   val:string;
//   onChange: any;
// }

const UserProfile: React.FC = observer(({
    componentId
  }) => {
    const [edit, setEdit] = useState(false);
    const [patientId, setPatientId] = useState("")
    const [firstName, setFirstName] = useState("")
    const [lastName, setLastName] = useState("")
    const [age, setAge] = useState("")
    const [height, setHeight] = useState("")
    const [weight, setWeight] = useState("")
    const [fev, setFev] = useState("")
    const [blood, setBlood] = useState("")
    const [gender, setGender] = useState("")
    const { colors } = useConstants();
    const { styles } = useStyles(_styles);
    const { nav, t} = useServices();
    const { patient, bluetooth} = useStores();
    const [ethnic, setEthnic] = useState("");

    const GenderGroup: RadioButtonProps[] = [{
        id: 'male', // acts as primary key, should be unique and non-empty string
        label: t.do("male"),
        value: 'male',
        color: colors.main,
        size: ms(20, 0.5),
        labelStyle:styles.radio_text
    }, {
        id: 'female',
        label: t.do("female"),
        value: 'female',
        color: colors.main,
        size: ms(20, 0.5),
        labelStyle:styles.radio_text
    }]

    const EthnicityGroup: RadioButtonProps[] = [{
        id: 'chinese', // acts as primary key, should be unique and non-empty string
        label: t.do("chinese"),
        value: 'chinese',
        color: colors.main,
        size: ms(20, 0.5),
        labelStyle:styles.radio_text
    }, {
        id: 'malay',
        label: t.do("malay"),
        value: 'malay',
        color: colors.main,
        size: ms(20, 0.5),
        labelStyle:styles.radio_text
    },{
      id: 'indian',
      label: t.do("indian"),
      value: 'indian',
      color: colors.main,
      size: ms(20, 0.5),
      labelStyle:styles.radio_text
    },{
      id: 'other',
      label: t.do("other"),
      value: 'other',
      color: colors.main,
      size: ms(20, 0.5),
      labelStyle:styles.radio_text
    }]

    const [genderBtn, setGenderButtons] = useState<RadioButtonProps[]>(GenderGroup)
    const [ethnicityBtn, setEthnicityBtn] = useState<RadioButtonProps[]>(EthnicityGroup)

    const bleCb:BleCallback = (err:any, result:any)=>{
      if(!err){
        //console.log("UserProfile bleCb==== result====",result);
        if(result){
          if(result.type && result.type === SuccessType.Ble_Received_Data){
            //console.log("data",result.data)
            let value = result.data.value;
            if(value[0] == BleSensorConstant.BLE_SENSOR_COMMAND_START_BYTE && value[1] == BleSensorConstant.BLE_SENSOR_COMMAND_RES_REGISTER_PATIENT_ID){ //Register patient response
              console.log("patient register response",value)
              if(value[4] == BleSensorConstant.BLE_SENSOR_RESPONSE_SUCCESS){
                if(bluetooth.connected && bluetooth.connectedId){
                    patient.registerOk(true);
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
                  Toast.show(t.do("time_set"), Toast.SHORT)
              }
            }
          }
        }
      }
    }

    useNavigationComponentDidAppear(() => {
      bluetooth.init();
    }, componentId);

    useEffect(()=>{
      bluetooth.addBluetoothCallback("userProfile", bleCb);
      return () => bluetooth.removeBluetoothCallback("userProfile");
    },[])

    useEffect(() => {
      setPatientId(patient.id+"")
      setFirstName(patient.firstName+"")
      setLastName(patient.lastName+"")
      if(patient.age)
        setAge(patient.age+"")
      if(patient.height)
        setHeight(patient.height+"")
      if(patient.weight)
        setWeight(patient.weight+"")
      if(patient.blood)
        setBlood(patient.blood+"")
      if(patient.fev)
        setFev(patient.fev+"")
      if(patient.gender){
        const newList = genderBtn.map(g => {
          if (g.value?.toLowerCase() !== patient.gender) return g;
          return { ...g, selected: true};
        });
        setGenderButtons(newList);
        setGender(patient.gender)
      }
      if(patient.ethnic){
        const newList = ethnicityBtn.map(g => {
          if (g.value?.toLowerCase() !== patient.ethnic) return g;
          return { ...g, selected: true};
        });
        setEthnicityBtn(newList);
        setEthnic(patient.ethnic)
      }
      if(!patient.isRegister){
        setEdit(true);
      }
    },[]);

    function onPressGenderButton(radioButtonsArray: RadioButtonProps[]) {
      for(var i=0; i<radioButtonsArray.length; i++){
        if(radioButtonsArray[i].selected)
        {
          setGender(radioButtonsArray[i]!.value+"");
        }
      }
      setGenderButtons(radioButtonsArray);
    }
    
    function onPressEthnicityButton(radioButtonsArray: RadioButtonProps[]) {
      for(var i=0; i<radioButtonsArray.length; i++){
        if(radioButtonsArray[i].selected)
        {
          setEthnic(radioButtonsArray[i]!.value+"");
        }
      }
      setEthnicityBtn(radioButtonsArray);
    }

    const register = ()=>{

      if(bluetooth.isBusy){
        Alert.alert(t.do("error"), t.do("ble_busy"));
        return;
      }

      let pId;
      try{
        pId = Number.parseInt(patientId)
      }catch(e){pId = 0}
      if(pId > 0){
        if(bluetooth.isOn && bluetooth.connected && bluetooth.connectedId){
          patient.setId(pId);
          bluetooth.registerPatient(bluetooth.connectedId, pId);
        }else{
          Alert.alert(t.do("error"),t.do("enable_ble"));
        }
      }else{
        Alert.alert(t.do("error"),t.do("ivalid_id"));
      }
    }

    const viewLiveData=()=>{
      // if(patient.isRegister && bluetooth.isOn && bluetooth.connected && bluetooth.connectedId){
      //   nav.push(componentId, screens.live_data.id)
      // }else{
      //   Alert.alert(t.do("error"),t.do("enable_ble"));
      // }
    }

    const signOut = async()=>{
      nav.dismissAllOverlays();
      Auth.signOut()
       .then(data => {
         console.log('sign out data',data)
         nav.initialize();
       })
       .catch(err => console.log('sign out err',err));

    }

    const enableGatewayMode = ()=>{
      console.log("ble mode===",bluetooth)
      if(patient.isRegister)
      {
        if(bluetooth.gatewayMode){
          bluetooth.setMode(0)
        }else{
          bluetooth.setMode(ModeType.GW_MODE)
        }
      }
      else{
        Alert.alert(t.do("error"),t.do("enable_ble"));
      }
    }

    const calibrateSensor = ()=>{
      if(patient.isRegister && bluetooth.isOn && bluetooth.connected && bluetooth.connectedId){

      }else{
        Alert.alert(t.do("error"),t.do("enable_ble"));
      }
    }

    const saveProfile = (myId:string)=>{
      console.log("myId====",myId);
      let pId, ageNo, heightNo, weightNo, fevNo, bloodNo;

      try{
        pId = Number.parseInt(myId?myId:patientId)
      }catch(e){pId = 0}
      try{
        ageNo = Number.parseInt(age)
      }catch(e){ageNo = 0}
      try{
        heightNo = Number.parseInt(height)
      }catch(e){heightNo = 0}
      try{
        weightNo = Number.parseInt(weight)
      }catch(e){weightNo = 0}
      try{
        fevNo = Number.parseInt(fev)
      }catch(e){fevNo = 0}
      try{
        bloodNo = Number.parseInt(blood)
      }catch(e){bloodNo = 0}
      console.log("patient id======",pId, patientId);
      patient.setProfile(pId, firstName, lastName, ageNo, ethnic?ethnic.toLowerCase():"", heightNo, weightNo, fevNo, bloodNo, gender?gender.toLowerCase():"");
      setEdit(false);
    }

    const RowView: React.FC<RowProps> = ({
      leftTitle,
      leftVal,
      rightTitle,
      rightVal,
    })=>{
      return (
        <View style={styles.row_view}>
          <View style={styles.column1_view}>
            <Text style={styles.title}>{leftTitle}</Text>
            <Text style={styles.val}>{leftVal}</Text>
          </View>
          <View style={styles.column2_view}>
            <Text style={styles.title}>{rightTitle}</Text>
            <Text style={styles.val}>{rightVal}</Text>
          </View>
        </View>
      )
    }

    const ViewProfile = ()=>{
      //console.log("patient==",patient)
      return (
        <ScrollView style={styles.container} contentContainerStyle={{flexGrow:1, paddingBottom: ms(150, 0.5) }}>
            <View style={styles.header_view}>
              <Text style={styles.name}>{`${patient.firstName} ${patient.lastName}`}</Text>
              <View style={{width:'15%', alignItems:'flex-end'}}>
                <ButtonFontAwesomeIcon iconStyle={styles.buttonIcon} icon={'edit'} onPress={()=>setEdit(true)} />
              </View>
            </View>
            <RowView leftTitle={t.do("patient_id")} leftVal={patient.id+""} />
            <RowView leftTitle={t.do("age")} rightTitle={t.do("gender")} leftVal={patient.age?patient.age+"":""} rightVal={patient.gender}/>
            <RowView leftTitle={t.do("ethnicity")} leftVal={patient.ethnic+""} />
            <RowView leftTitle={t.do("height")} rightTitle={t.do("weight")} leftVal={patient.height?patient.height+"":""} rightVal={patient.weight?patient.weight+"":""}/>
            <RowView leftTitle={t.do("fev")} rightTitle={t.do("blood_data")} leftVal={patient.fev?patient.fev+"%":""} rightVal={patient.blood?patient.blood+"":""}/>
            <View style={{height:ms(30,0.5)}}/>
            <View style={styles.button_view}>
              <ButtonTitle btnStyle={styles.button} textStyle={styles.buttonText} title={t.do('sign_out').toUpperCase()} onPress={signOut}/>
              <View style={{height:ms(10,0.5)}}/>
              <ButtonTitle btnStyle={styles.button} textStyle={styles.buttonText} title={bluetooth.gatewayMode?t.do('disable_gw_mode'):t.do("enable_gw_mode")} onPress={enableGatewayMode}/>
              <View style={{height:ms(30,0.5)}}/>
            </View>
        </ScrollView>
      )
    }

    const EditProfile = ()=>{
      return (
        <ScrollView style={styles.container} contentContainerStyle={{flexGrow:1, paddingBottom: ms(200, 0.5) }}>
            <Text style={styles.edit_text}>{t.do("edit_profile")}</Text>
            <View style={{marginBottom:ms(10,0.5)}}>
              <Text style={styles.edit_row_title}>{t.do("patient_id")}</Text>
              <TextInput style={styles.edit_input}
                onChangeText={
                  (text)=>setPatientId(text)
                }
                keyboardType={"numeric"}
                defaultValue={patientId+""}
                maxLength={4}
                underlineColorAndroid={colors.brownGrey}
                multiline={false}
                editable={false}
                autoCapitalize={'words'}/>
            </View>
            <View style={{marginBottom:ms(10,0.5)}}>
              <Text style={styles.edit_row_title}>{t.do("first_name")}</Text>
              <TextInput style={styles.edit_input}
                onChangeText={
                  (text)=>setFirstName(text)
                }
                defaultValue={firstName}
                maxLength={20}
                underlineColorAndroid={colors.brownGrey}
                multiline={false}
                autoCapitalize={'words'}/>
            </View>
            <View style={{marginBottom:ms(10,0.5)}}>
              <Text style={styles.edit_row_title}>{t.do("last_name")}</Text>
              <TextInput style={styles.edit_input}
                onChangeText={
                  (text)=>setLastName(text)
                }
                defaultValue={lastName}
                maxLength={20}
                underlineColorAndroid={colors.brownGrey}
                multiline={false}
                autoCapitalize={'words'}/>
            </View>
            <View style={{marginBottom:ms(10,0.5)}}>
              <Text style={styles.edit_row_title}>{t.do("age")}</Text>
              <TextInput style={styles.edit_input}
                onChangeText={
                  (text)=>setAge(text)
                }
                keyboardType={"number-pad"}
                defaultValue={age+""}
                maxLength={2}
                underlineColorAndroid={colors.brownGrey}
                multiline={false}
                autoCapitalize={'words'}/>
            </View>
            {/* <EditRowInput title={t.do("first_name")} val={firstName} onChange={(text) => setFirstName(text)}/>
            <EditRowInput title={t.do("last_name")} val={lastName} onChange={(text) => setLastName(text)}/>
            <EditRowInput title={t.do("age")} val={age} onChange={(text) => setAge(text)}/> */}
            <View style={{width:'55%', marginBottom:ms(10,0.5), paddingLeft:ms(5,0.5)}}>
              <Text style={styles.edit_row_title}>{t.do("gender")}</Text>
              <View style={{height:ms(5,0.5)}}/>
              <RadioGroup
                  layout={'row'}
                  radioButtons={genderBtn}
                  onPress={onPressGenderButton}
              />
            </View>
            <View style={{width:'30%', marginTop:ms(10,0.5), marginBottom:ms(10,0.5), paddingLeft:ms(5,0.5)}}>
              <Text style={styles.edit_row_title}>{t.do("ethnicity")}</Text>
              <View style={{height:ms(5,0.5)}}/>
              <RadioGroup
                  layout={'column'}
                  radioButtons={ethnicityBtn}
                  onPress={onPressEthnicityButton}
              />
            </View>
            <View style={{flexDirection:'row', marginTop:ms(10,0.5)}}>
              <View style={{width: '45%'}}>
                <View style={{marginBottom:ms(10,0.5)}}>
                  <Text style={styles.edit_row_title}>{`${t.do("height")} (CM)`}</Text>
                  <TextInput style={styles.edit_input}
                    onChangeText={
                      (text)=>setHeight(text)
                    }
                    keyboardType={"number-pad"}
                    defaultValue={height.toString()}
                    maxLength={3}
                    underlineColorAndroid={colors.brownGrey}
                    multiline={false}
                    autoCapitalize={'words'}/>
                </View>
                {/* <EditRowInput title={`${t.do("height")} (CM)`} val={height.toString()} onChange={(text) => setHeight(Number.parseInt(text))}/> */}
              </View>
              <View style={{width:ms(20,0.5)}}/>
              <View style={{width: '45%'}}>
                <View style={{marginBottom:ms(10,0.5)}}>
                    <Text style={styles.edit_row_title}>{`${t.do("weight")} (KG)`}</Text>
                    <TextInput style={styles.edit_input}
                      onChangeText={
                        (text)=>setWeight(text)
                      }
                      keyboardType={"number-pad"}
                      defaultValue={weight.toString()}
                      maxLength={3}
                      underlineColorAndroid={colors.brownGrey}
                      multiline={false}
                      autoCapitalize={'words'}/>
                  </View>
                {/* <EditRowInput title={`${t.do("weight")} (KG)`} val={weight.toString()} onChange={(text) => setWeight(Number.parseInt(text))}/> */}
              </View>
            </View>
            <View style={{flexDirection:'row'}}>
              <View style={{width: '45%'}}>
                  <View style={{marginBottom:ms(10,0.5)}}>
                    <Text style={styles.edit_row_title}>{`${t.do("fev")} (%)`}</Text>
                    <TextInput style={styles.edit_input}
                      onChangeText={
                        (text)=>setFev(text)
                      }
                      keyboardType={"number-pad"}
                      defaultValue={fev.toString()}
                      maxLength={3}
                      underlineColorAndroid={colors.brownGrey}
                      multiline={false}
                      autoCapitalize={'words'}/>
                  </View>
                {/* <EditRowInput title={`${t.do("fev")} (%)`} val={fev.toString()} onChange={(text) => setFev(Number.parseInt(text))}/> */}
              </View>
              <View style={{width:ms(20,0.5)}}/>
              <View style={{width: '45%'}}>
                  <View style={{marginBottom:ms(10,0.5)}}>
                    <Text style={styles.edit_row_title}>{`${t.do("blood_data")}`}</Text>
                    <TextInput style={styles.edit_input}
                      onChangeText={
                        (text)=>setBlood(text)
                      }
                      keyboardType={"number-pad"}
                      defaultValue={blood.toString()}
                      maxLength={3}
                      underlineColorAndroid={colors.brownGrey}
                      multiline={false}
                      autoCapitalize={'words'}/>
                  </View>
                {/* <EditRowInput title={`${t.do("blood_data")}`} val={blood.toString()} onChange={(text) => setBlood(Number.parseInt(text))}/> */}
              </View>
            </View>
            <View style={styles.button_done}>
              <ButtonTitle btnStyle={styles.button} textStyle={styles.buttonText} title={t.do('register_patient').toUpperCase()} onPress={register}/>
              <View style={{width:'100%', height:ms(10,0.5)}}/>
              <ButtonTitle btnStyle={styles.button} textStyle={styles.buttonText} title={t.do('done').toUpperCase()} onPress={()=>saveProfile(patientId)}/>
              <View style={{width:'100%', height:ms(20,0.5)}}/>
            </View>
        </ScrollView>
      )
    }

    if(edit)
      return EditProfile();
    else
      return ViewProfile();

});
export default UserProfile;

const _styles = (theme: ThemeType) => ScaledSheet.create({
  container:{
    flex:1,
    backgroundColor:'white',
    paddingVertical: ms(30, 0.5),
    paddingHorizontal: ms(40,0.5)
  },
  //Profile
  header_view:{
    flexDirection:'row',
    width:'100%',
    marginBottom:ms(20,0.5)
  },
  name:{
    fontSize:ms(26,0.5),
    fontFamily:'karla_regular',
    color:theme.colors.darkGrey,
    width:'85%'
  },
  buttonIcon: {
    fontSize: ms(25, 0.8),
    color: theme.colors.main,
  },
  row_view:{
    flexDirection:'row',
    marginVertical:ms(10,0.5)
  },
  column1_view:{
    width: '40%'
  },
  column2_view:{
    width: '50%'
  },
  title:{
    color:theme.colors.brownGrey,
    fontSize: ms(12, 0.5),
    fontFamily: 'karla_bold'
  },
  val: {
    color:theme.colors.darkGrey,
    fontSize: ms(18, 0.5),
    fontFamily: 'karla_regular'
  },
  button_view:{
    position: 'absolute',
    width:'100%',
    justifyContent:'center',
    bottom:0,
    marginVertical:ms(30,0.5),
  },
  button:{
    borderRadius:50,
    backgroundColor:theme.colors.main,
    height:ms(45, 0.5),
    alignItems:'center',
    justifyContent:'center',
  },
  buttonText:{
    fontSize: ms(16, 0.5),
    margin: 0,
    width:'100%',
    fontFamily:'karla_bold',
    color:'white',
    textAlign:'center'
  },
  //EDIT
  edit_text:{
    fontSize: ms(18,0.5),
    fontFamily: 'karla_bold',
    color: theme.colors.darkGrey,
    marginBottom:ms(20,0.5),
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
    paddingHorizontal:ms(5,0.5)
  },
  radio_text:{
    fontSize: ms(14,0.5),
    color: theme.colors.brownGrey,
    fontFamily:'karla_regular'
  },
  button_done:{
    position: 'absolute',
    width:'100%',
    justifyContent:'center',
    bottom:0,
    marginVertical:ms(30,0.5)
  },
});
