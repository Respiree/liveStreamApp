import React , {useState} from 'react';
import {
    ScrollView,
    Text,
    View,
    Image,
    TouchableWithoutFeedback,
    Dimensions,
    Platform
} from 'react-native';
import { observer } from 'mobx-react';
import { NavigationFunctionComponent } from 'react-native-navigation';

import { useStores } from 'src/stores';
import { useServices } from 'src/services';
import useStyles from 'src/hooks/useStyles';
import { screens } from 'src/services/navigation/screens';
import { ScaledSheet, s, vs, ms, mvs } from 'react-native-size-matters';
import TopBar from 'src/components/TopBar';
import useConstants from 'src/hooks/useConstants';
import Images from 'src/global/Images';

const Component: NavigationFunctionComponent = observer(({
  componentId,
}) => {
  const [play, setPlay] = useState(false)
  const { styles } = useStyles(_styles);
  const { nav, t} = useServices();
  const { colors, sizes } = useConstants();
  return (
    <View style={{flex:1}}>
      <View style={{flex:.1, marginLeft: sizes.margin, marginTop: Platform.OS==="android"?0:40}}>
        <TopBar/>
      </View>
      <ScrollView style={styles.contentContainer} contentContainerStyle={{flexGrow:1, paddingBottom: 40 }}>
        <Text style={styles.text}>{t.do("breathing_msg")}</Text>
        <TouchableWithoutFeedback onPress={()=>setPlay(!play) }>
        {
            play?(<Image style={styles.img} source={Images.BREATH_GIF}/>):
            ( <Image style={styles.img} source={Images.BREATH_PNG}/>)
        }
        </TouchableWithoutFeedback>
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
  text: {
    fontSize: ms(16, 0.8),
    marginHorizontal: ms(20, 0.5),
    textAlign: 'center',
    color: theme.colors.brownGrey,
    fontFamily: 'karla_regular',
    marginTop:ms(40,0.5)
  },
  img:{
    marginVertical: ms(50, 0.5),
    alignSelf: 'center',
    width: 0.7*Dimensions.get('window').width,
    height:0.7*Dimensions.get('window').width
  }
});

Component.options = props => screens.breathing.options();

export const Breathing = Component;
