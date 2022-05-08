import React ,{useEffect, useState}from 'react';
import { Image, Text, View } from 'react-native';
import { useServices } from 'src/services';
import useStyles from 'src/hooks/useStyles';
import { ScaledSheet, s, vs, ms, mvs } from 'react-native-size-matters';
import useConstants from 'src/hooks/useConstants';
import { ButtonTitle, ButtonIcon } from './Button';
import Images from 'src/global/Images';
import { useStores } from 'src/stores';
import axios from 'axios';

const SyncModal: React.FC = ({

}) => {
  const { styles } = useStyles(_styles);
  const { colors, sizes, apiUrl } = useConstants();
  const { nav, t} = useServices();
  const { ui, patient, bluetooth} = useStores();
  const [msg, setMsg] = useState("");
  const [isDone, setDone] = useState(false);
  const [isErr, setErr] = useState(false);
  const [title, setTitle] = useState("")

  const cancel = ()=>{
    nav.dismissAllOverlays();
  }

  const uploadToServer = ()=>{
    if(bluetooth.savedRecords && bluetooth.savedRecords.recordCollectedBySensor > 0){
     
      axios.post(apiUrl.upload, bluetooth.savedRecords)
      .then(res => {
        console.log("response from api==",res);
        bluetooth.clearRecord();
        console.log("clear Record====",bluetooth.savedRecords);
        if(bluetooth.connectedId)
          bluetooth.disconnectDevice(bluetooth.connectedId);
        setDone(true)
      })
      .catch(err => {
          console.log("upload err",err);
          setErr(true)
          setTitle(t.do("internet_conn_err"))
          setMsg(t.do("conn_err_msg"))
          if(bluetooth.connectedId)
            bluetooth.disconnectDevice(bluetooth.connectedId);
      });
    }else{
      setDone(true)
    }
  }

  useEffect(() => {
    uploadToServer();
  },[]);

  if(isErr)
  return(
    <View style={styles.root} key={'overlay'}>
        <View style={styles.err_container}>
          <Text style={styles.errTitle}>{msg}</Text>
          <View style={styles.msgView}>
            <Text style={styles.errMsg}>{t.do("ble_err_msg")}</Text>
            <ButtonTitle
                textStyle={styles.errBtn}
                title={t.do('got_it').toUpperCase()}
                onPress={()=>nav.dismissAllOverlays()}/>
          </View>
        </View>
    </View>
  )
  else
  return (
    <View style={styles.root} key={'overlay'}>
        <View style={styles.alert}>
            <View style={{borderRadius:50, backgroundColor:'white', marginBottom:vs(10)}}>
                <ButtonIcon icon={'close'} onPress={()=>nav.dismissAllOverlays()} />
            </View>
            <View style={styles.container}>
                <Text style={styles.title}>{isDone?t.do("done").toUpperCase():t.do("sync_processing").toUpperCase()}</Text>
                <Image source={Images.IC_UPLOAD} style={{width:s(125), height:s(100)}}/>
                {/* <Text style={styles.msg}>{isDone?t.do("no_survey_to_sync")}</Text> */}
                <View style={{width:'100%', alignItems:'center'}}>
                    <ButtonTitle
                    textStyle={styles.buttonText}
                    title={t.do('cancel').toUpperCase()}
                    onPress={cancel}/>
                </View>
            </View>
        </View>
    </View>
  )
}

const _styles = (theme: ThemeType) => ScaledSheet.create({
  root: {
    position: 'absolute',
    backgroundColor: 'rgba(0,0,0,0.7)',
    alignItems: 'center',
    justifyContent:'flex-end',
    height: '100%',
    width:'100%',
    bottom:0,
    left: 0,
    right: 0,
    flex:1,
  },
  err_container:{
    backgroundColor: 'transparent',
    width: '100%',
    height:vs(200),
    alignItems: 'center',
    justifyContent: 'flex-start'
  },
  alert: {
    alignItems: 'center',
    width: '100%',
    height: vs(400),
    alignSelf:'flex-end',
    backgroundColor:'transparent',
    justifyContent:'flex-end'
  },
  container: {
    backgroundColor: '#ffffff',
    width: '100%',
    height:'80%',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    alignItems: 'center',
    justifyContent: 'space-around'
  },
  buttonText:{
      width: s(250),
      height: 50,
      fontFamily:'karla_bold',
      fontSize: ms(16, 0.8),
      color:'white',
      textAlign:'center',
      textAlignVertical:'center',
      backgroundColor: theme.colors.brownGrey,
      borderTopLeftRadius: 40,
      borderTopRightRadius: 40,
      borderBottomLeftRadius: 40,
      borderBottomRightRadius: 40,
  },
  title:{
    textAlign:'center',
    width: '100%',
    fontFamily:'karla_bold',
    fontSize: ms(18, 0.8),
    color:'black',
    marginVertical: ms(18, 0.5),
  },
  msg:{
    textAlign:'center',
    width: '100%',
    fontFamily:'karla_regular',
    fontSize: ms(12, 0.8),
    color:theme.colors.darkGrey,
    marginVertical: ms(18, 0.5),
  },

  errTitle:{
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    backgroundColor:theme.colors.very_light_grey,
    textAlignVertical:'center',
    textAlign:'center',
    width: '100%',
    height: '20%',
    fontFamily:'karla_bold',
    fontSize: ms(18, 0.8),
    color:'white',
  },
  msgView:{
    backgroundColor:'white',
    width:'100%',
    height: '80%',
    paddingHorizontal:ms(50,0.5)
  },
  errMsg:{
    textAlign:'center',
    width: '100%',
    fontFamily:'karla_regular',
    fontSize: ms(14, 0.8),
    color:theme.colors.darkGrey,
    marginVertical: ms(30, 0.5),
  },
  errBtn:{
    alignSelf:'center',
    width: '90%',
    height: 50,
    fontFamily:'karla_bold',
    fontSize: ms(16, 0.8),
    color:'white',
    textAlign:'center',
    textAlignVertical:'center',
    backgroundColor: theme.colors.main,
    borderTopLeftRadius: 50,
    borderTopRightRadius: 50,
    borderBottomLeftRadius: 50,
    borderBottomRightRadius: 50,
  }
})

export default SyncModal;
