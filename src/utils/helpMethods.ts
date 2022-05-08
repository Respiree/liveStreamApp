import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'mobx-persist';
import { ViewStyle } from 'react-native';

export const hydrateMobX = create({ storage: AsyncStorage, debounce: 500, });

export const generateShadow = (p?: GenerateShadowProps): ViewStyle => ({
  shadowColor: p?.shadowColor || 'rgba(0, 0, 0, 0.1)',
  shadowRadius: p?.shadowRadius || 15,
  elevation: p?.elevation,
  shadowOpacity: p?.shadowOpacity || 0.8,
  shadowOffset: {
    width: p?.shadowOffsetW || 1,
    height: p?.shadowOffsetH || 13,
  },
})