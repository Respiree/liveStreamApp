import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useServices } from 'src/services';
import useStyles from 'src/hooks/useStyles';
import { ScaledSheet, s, vs, ms, mvs } from 'react-native-size-matters';
import useConstants from 'src/hooks/useConstants';

type CardItemProps = {
  title: string;
  val: number;
  unit: string;
}

const CardItem: React.FC<CardItemProps> = ({
  title,
  val,
  unit
}) => {
  const { styles } = useStyles(_styles);
  const { colors, sizes } = useConstants();
  const { nav, t} = useServices();
  return (
    <View style={styles.container}>
        <Text style={styles.title}>{title}</Text>
        <View style={{flexDirection:'row', justifyContent:'space-between', alignItems:'flex-end'}}>
            <Text style={styles.left}>{t.do('avg')}</Text>
            <View style={{flexDirection:"row"}}>
                <Text style={styles.right}>{val>=0?val:""}</Text>
                <Text style={styles.unit}>{` ${unit}`}</Text>
            </View>
        </View>
    </View>
  )
}

const _styles = (theme: ThemeType) => ScaledSheet.create({
  container: {
    flex: 1,
    width:'100%',
    height:'100%',
    paddingTop: 15,
    paddingBottom:10,
    paddingRight:10,
    paddingLeft:10,
    justifyContent:'space-between'
  },

  title: {
    color:theme.colors.brownGrey, 
    fontSize:ms(14, 0.3), 
    fontFamily:"karla_bold"
  },
  left: {
    color:theme.colors.very_light_grey, 
    fontSize:ms(11,0.8),
    fontFamily:"karla_bold"
  },
  right: {
    marginBottom:-2,
    alignSelf:'flex-end',
    color:theme.colors.darkGrey, 
    fontSize:ms(28, 0.8), 
    fontFamily:'karla_regular'
  },
  unit:{
    alignSelf:'flex-end',
    fontSize:ms(11, 0.8),
    fontFamily:"karla_bold"
  }
})

export default CardItem;