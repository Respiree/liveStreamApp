import React from 'react';
import {
    SafeAreaView,
    Text,
    View,
} from 'react-native';
import { observer } from 'mobx-react';
import { NavigationFunctionComponent } from 'react-native-navigation';

import { useStores } from 'src/stores';
import { useServices } from 'src/services';
import useStyles from 'src/hooks/useStyles';
import { screens } from 'src/services/navigation/screens';
import { ScaledSheet, s, vs, ms, mvs } from 'react-native-size-matters';
import TopBar from 'src/components/TopBar';

const Component: NavigationFunctionComponent = observer(({
  componentId,
}) => {
  const { } = useStores();
  const { } = useServices();
  const { styles } = useStyles(_styles);

  return (
    <SafeAreaView style={{flex:1}}>
      <TopBar/>
      <View style={styles.contentContainer}>
        <View style={{width:'100%',height:'100%'}}/>
        
      </View>
    </SafeAreaView>
  );
});

const _styles = (theme: ThemeType) => ScaledSheet.create({
  contentContainer: {
    flex: .9,
    padding: ms(theme.sizes.margin),
    flexDirection: 'row',
    width: '100%',
    height:'100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    fontSize: 20,
    margin: ms(theme.sizes.s),
    textAlign: 'center',
    color: theme.colors.text,
  },
});

Component.options = props => screens.event.options();

export const EventData =Component;
