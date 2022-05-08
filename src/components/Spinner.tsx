import React from 'react';
import {StyleSheet, View, Text, Dimensions, Button, ActivityIndicator} from 'react-native';

const Spinner : React.FC = ({
  
}) => {

    return (
      <View style={styles.container}>
        <View style={{flex: 5, alignItems:'center', justifyContent:'center'}}>
          <ActivityIndicator
            animating = {true}
            size={'large'}/>
        </View>
      </View>
    );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    height: Dimensions.get('window').height * 0.2,
    backgroundColor: 'transparent',
    borderRadius: 5,
    padding: 16,
  }
});

export default Spinner;