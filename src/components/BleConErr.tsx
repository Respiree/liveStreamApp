import React from 'react';
import { Image, Text, View } from 'react-native';
import { useServices } from 'src/services';
import useStyles from 'src/hooks/useStyles';
import { ScaledSheet, s, vs, ms, mvs } from 'react-native-size-matters';
import useConstants from 'src/hooks/useConstants';
import { ButtonTitle, ButtonIcon } from './Button';
import Images from 'src/global/Images';


const BleConErr: React.FC = ({
  
}) => {
  const { styles } = useStyles(_styles);
  const { colors, sizes } = useConstants();
  const { nav, t} = useServices();
  
  return (
    <View style={styles.root} key={'overlay'}>
        <View style={styles.container}>
          <Text style={styles.title}>{t.do("ble_conn_err")}</Text>
          <View style={styles.msgView}>
            <Text style={styles.msg}>{t.do("ble_err_msg")}</Text>
            <ButtonTitle
                textStyle={styles.buttonText} 
                title={t.do('got_it').toUpperCase()} 
                onPress={()=>nav.dismissAllOverlays()}/>
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
  container: {
    backgroundColor: 'transparent',
    width: '100%',
    height:vs(200),
    alignItems: 'center',
    justifyContent: 'flex-start'
  },
  msgView:{
    backgroundColor:'white',
    width:'100%',
    height: '80%',
    paddingHorizontal:ms(50,0.5)
  },
  title:{
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
  msg:{
    textAlign:'center',
    width: '100%',
    fontFamily:'karla_regular',
    fontSize: ms(14, 0.8),
    color:theme.colors.darkGrey,
    marginVertical: ms(30, 0.5),
  },
  buttonText:{
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
},
})

export default BleConErr;