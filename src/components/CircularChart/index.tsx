import { NativeModules } from 'react-native';

export * from './CircularChart';

const {NativeCircularChart} = NativeModules;

export default NativeCircularChart;