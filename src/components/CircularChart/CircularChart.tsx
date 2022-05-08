import { requireNativeComponent, ViewProps, ViewPropTypes } from 'react-native';
import React from 'react'


export const CircularChartViewRaw = requireNativeComponent<{}>(
    'CircularChartView'
);

type CircularChartViewProps = ViewProps;

export const CircularChart: React.FC<CircularChartViewProps>=(
    props
)=>{
    return <CircularChartViewRaw {...props}/>;
}