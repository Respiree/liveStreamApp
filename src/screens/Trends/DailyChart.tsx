import React, {useState, useEffect} from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, processColor, RefreshControl, Platform} from 'react-native';
import { observer } from 'mobx-react';
import { useStores } from 'src/stores';
import useStyles from 'src/hooks/useStyles';
import { ButtonTitle, ButtonFontAwesomeIcon } from 'src/components/Button';
import { ScaledSheet, s, vs, ms, mvs } from 'react-native-size-matters';
import { useServices } from 'src/services';
import useConstants from 'src/hooks/useConstants';
import Toast from 'react-native-simple-toast';
import _ from 'lodash';
import moment from 'moment';
import { LineChart, ECharts } from "react-native-charts-wrapper";
import { numberToString } from 'src/stores/bluetooth';

const DailyChart: React.FC = observer(({
    componentId,
  })=> {
  const {patient} = useStores();
  const { colors, options, apiUrl } = useConstants();
  const { styles } = useStyles(_styles);
  const { nav, t} = useServices();
  const [dailyDate, setDailyDate] = useState([])
  const [updateUI, setUpdateUI] = useState(false)
  const [selectedEntry, setSelectedEntry] = useState(null)
  const [xAxis, setxAxis] = useState([]);
  const [lineData, setLineData] = useState([]);
  const [baseData, setBaseData] = useState([0]);
  const [hrData, setHRData] = useState([]);
  const [rrData, setRRData] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = React.useCallback(() => {
    setRefreshing(true)
    initView();
  }, []);

  const sendRequest = async(url:string)=>{
    console.log("ur===",url)
    fetch(url, {
      method: 'GET'
    })
    .then((response) => response.json())
    .then((responseJson) => {
      setRefreshing(false);
      if(responseJson.response && responseJson.response.metrics){
        //console.log("resp",responseJson.response);
        const band = responseJson.response.band;
        const metrics = responseJson.response.metrics;
        const metrics_SD = responseJson.response.metrics_SD;
        const metrics_overall_mean = responseJson.response.metrics_overall_mean;
        //console.log("url",url);
        //console.log("band",band);
        //console.log("metrics",metrics);
        if(metrics.listtime.length>0){
          const startDate = moment(metrics.listtime[0], 'YYYY-MM-DD HH:mm')
          const endDate = moment(metrics.listtime[metrics.listtime.length-1], 'YYYY-MM-DD HH:mm')
          const dd = [];
          dd.push(startDate);
          dd.push(endDate);
          setDailyDate(dd);
          //console.log("saving to daily utc", moment(startDate).format("DD/MM/YY HH:mm"),moment(endDate).format("DD/MM/YY HH:mm"))
          //console.log("metrics",metrics);
          let axis = [];
          for(let i=0; i<metrics.listtime.length; i++){
              let str = moment.utc(metrics.listtime[i], 'YYYY-MM-DD HH:mm').local().format('hA')
              axis.push(str);
          }
          //console.log("axis",axis)
          setxAxis(axis);
          setLineData(metrics.calmness);
          let baseData = [];
          for(let i=0; i<metrics.calmness.length; i++){
            baseData.push(100)
          }
          setBaseData(baseData);
          setHRData(metrics.HR);
          setRRData(metrics.RR);
        }
        //console.log("metrics SD", metrics_SD);
        //console.log("overall mean", metrics_overall_mean);
      }else{
        //no data
      }
    })
    .catch((error) => {
      setRefreshing(false);
      console.error(error);
    });
  }

  const getDailyData = (daily)=>{
    //console.log("dailyDate.length",dailyDate.length)
    if(daily.length == 2){
      const startDate = moment(daily[0]).format("YYYY-MM-DDTHH:mm:ss");
      const endDate = moment(daily[1]).format("YYYY-MM-DDTHH:mm:ss");
      //console.log("startDate=====",startDate, "endDate",endDate);
      const type = "daily"
      const id = options.debug?160:patient.id;
      //const userIdStr = numberToString(id);
      //console.log("getDailyData from",startDate,endDate)
      const url = `${apiUrl.trends}?start_datetime=${startDate}&stop_datetime=${endDate}&id=${id}&resolution=${type}`
      sendRequest(url);
    }
  }

  const initView = ()=>{
    let daily = [];
    var today = moment.utc().set({minute:0,second:0,millisecond:0});
    let startDate = moment(today).subtract(23, 'hours')
    let endDate = moment(today).add(1, 'hours')
    daily.push(startDate)
    daily.push(endDate);
    setDailyDate(daily);
    getDailyData(daily);
  }

  const last24H =()=>{
    if(dailyDate.length == 2){
      const startDate = moment(dailyDate[0]).subtract(1, "hour");
      const last24 = moment(startDate).subtract(23, "hours");
      let daily = [];
      daily.push(last24)
      daily.push(startDate)
      setDailyDate(daily);
      console.log("last 24H is", last24.format("DD MMM HH:mm:ss"), startDate.format("DD MMM HH:mm:ss"))
      setUpdateUI(!updateUI)
    }
  }

  const next24H = ()=>{
    if(dailyDate.length == 2){
      const endDate = moment(dailyDate[1]).add(1, 'hour');
      const nextH = moment(endDate).add(23, "hours");
      const today = moment()
      const isBefore = nextH.isSameOrBefore(today, 'hour');
      console.log("curr date time is", dailyDate[0].format("DD MMM HH:mm:ss"), dailyDate[1].format("DD MMM HH:mm:ss"))
      if(isBefore){
        let daily = [];
        daily.push(endDate)
        daily.push(nextH)
        setDailyDate(daily);
        console.log("next 24 hour is", endDate.format("DD MMM HH:mm:ss"), nextH.format("DD MMM HH:mm:ss"))
        setUpdateUI(!updateUI)
      }
    }
  }

  const handleSelect = (event) =>{
    let entry = event.nativeEvent;
    if (entry == null) {
        setSelectedEntry(null)
    } else {
        setSelectedEntry(JSON.stringify(entry))
    }

    //console.log(event.nativeEvent);
  }

  useEffect(()=>{
    initView();
  },[])

  return(

    <ScrollView style={styles.container} contentContainerStyle={{flexGrow:1, paddingBottom: ms(20, 0.5) }}
    refreshControl={
      <RefreshControl
        refreshing={refreshing}
        onRefresh={onRefresh}
      />
    }>
        <View style={{flexDirection:'row', alignItems:'center', justifyContent:'space-between'}}>
            <Text style={styles.title}>{t.do("daily_graph_title")}</Text>
            <Text style={styles.subtitle}>{t.do("daily_graph_subtitle")}</Text>
        </View>
        {lineData.length> 0 && xAxis.length>0?
        <View style={styles.chart_container}>
          <LineChart
            style={styles.chart}
            data={{
              dataSets: [
                {
                    values: baseData,
                    label: "",
                    config: {
                      mode: "CUBIC_BEZIER",
                      drawValues: false,
                      lineWidth: 0,
                      drawCircles: false,
                      highlightColor: processColor("transparent"),
                      drawFilled: true,
                      fillGradient: {
                        colors: [processColor('#89cefe'), processColor('#0f80d5')],
                        positions: [0, 0.5],
                        angle: 90,
                        orientation: "TOP_BOTTOM"
                      },
                      fillAlpha: 1000,
                      valueTextSize: 15
                    }
                },
                {
                  values: lineData,
                  label: "",
                  config: {
                    mode: "CUBIC_BEZIER",
                    drawValues: false,
                    lineWidth: 1,
                    drawCircles: true,
                    drawVerticalHighlightIndicator:true,
                    drawHorizontalHighlightIndicator:false,
                    highlightColor: processColor("white"),
                    color: processColor('#56b99a'),
                    drawFilled: true,
                    fillGradient: {
                      colors: [processColor('#aeefe5'), processColor('#56b99a')],
                      positions: [0, 0.5],
                      angle: 90,
                      orientation: "TOP_BOTTOM"
                    },
                    fillAlpha: 1000,
                    valueTextSize: 15
                  }
                }
              ]
            }}
            chartDescription={{ text: "" }}
            legend={{
              enabled: false
            }}
            marker={{
              enabled: true,
              markerColor: processColor("#56b99a"),
              textColor: processColor("white"),
              textSize: 15
            }}
            xAxis={{
              valueFormatter: xAxis,
              textSize: 12,fontFamily: "karla_regular",
              textColor: processColor("gray"),
              granularityEnabled: false,
              granularity: 1,
              drawLimitLinesBehindData: true,
              drawGridLines: false,
              drawLabels:true,
              position: "BOTTOM",
            }}
            yAxis={{
              left: {
                enabled: false,
              },
              right: {
                enabled: false
              }
            }}
            animation={{
              durationX: 0,
              durationY: 1500,
              easingY: "EaseInOutQuart"
            }}
            drawGridBackground={false}
            drawBorders={false}
            autoScaleMinMaxEnabled={true}
            touchEnabled={true}
            dragEnabled={true}
            scaleEnabled={true}
            scaleXEnabled={true}
            scaleYEnabled={true}
            pinchZoom={true}
            doubleTapToZoomEnabled={true}
            highlightPerTapEnabled={true}
            highlightPerDragEnabled={false}
            visibleRange={{x: {min: 1, max: 8}, y: {min: 0, max: 100}}}
            dragDecelerationEnabled={true}
            dragDecelerationFrictionCoef={0.99}
            keepPositionOnRotation={false}
            onSelect={handleSelect}
            onChange={event => console.log(event.nativeEvent)}
          />
        </View>
        :null}
        {hrData.length> 0 && rrData.length>0 && xAxis.length>0?
        <View style={styles.chart_container}>
           <Text style={styles.bottomTitle}>{t.do("heart_respiratory_rate")}</Text>
          <LineChart
            style={styles.hrChart}
            data={{
              dataSets: [
                {
                    values: hrData,
                    label: "",
                    config: {
                      mode: "CUBIC_BEZIER",
                      drawValues: false,
                      lineWidth: 1,
                      drawCircles: true,
                      circleColor:processColor('#9999FF'),
                      drawVerticalHighlightIndicator:true,
                      drawHorizontalHighlightIndicator:false,
                      highlightColor: processColor("#9999FF"),
                      drawFilled: false,
                      color: processColor('#9999FF'),
                    }
                },
                {
                  values: rrData,
                  label: "",
                  config: {
                    mode: "CUBIC_BEZIER",
                    drawValues: false,
                    lineWidth: 1,
                    drawCircles: true,
                    circleColor:processColor('#e99393'),
                    circleHoleColor:processColor('#e99393'),
                    drawVerticalHighlightIndicator:true,
                    drawHorizontalHighlightIndicator:false,
                    highlightColor: processColor("#e99393"),
                    color: processColor('#e99393'),
                    drawFilled: false
                  }
                }
              ]
            }}
            chartDescription={{ text: "" }}
            legend={{
                enabled: true,
                xEntrySpace: 10,
                yEntrySpace: 25,
                formSize :ms(12,0.8),
                textSize : ms(12, 0.8),
                form:'CIRCLE',
                custom:{
                colors:[processColor('#9999FF'), processColor('#e99393')],
                labels:[t.do("heart_legend"),t.do("respiratory_legend")]}
            }}
            marker={{
              enabled: true,
              markerColor: processColor("transparent"),
              textColor: processColor("black"),
              textSize: ms(15, 0.8)
            }}
            xAxis={{
              valueFormatter: xAxis,
              textSize: ms(12,0.8),fontFamily: "karla_regular",
              textColor: processColor("gray"),
              granularityEnabled: false,
              granularity: 1,
              drawLimitLinesBehindData: true,
              drawGridLines: false,
              drawLabels:true,
              position: "BOTTOM",
            }}
            yAxis={{
              left: {
                axisMinimum:0,
                enabled: true,
                zeroLine: {
                  enabled: true
                }
              },
              right: {
                enabled: false
              }
            }}
            animation={{
              durationX: 0,
              durationY: 1500,
              easingY: "EaseInOutQuart"
            }}
            drawGridBackground={false}
            drawBorders={false}
            autoScaleMinMaxEnabled={true}
            touchEnabled={true}
            dragEnabled={true}
            scaleXEnabled={true}
            scaleYEnabled={true}
            pinchZoom={true}
            doubleTapToZoomEnabled={true}
            highlightPerTapEnabled={true}
            highlightPerDragEnabled={false}
            visibleRange={{x: {min: 1, max: 8}, y: {min: 0, max: 240}}}
            dragDecelerationEnabled={true}
            dragDecelerationFrictionCoef={0.99}
            keepPositionOnRotation={false}
            onSelect={handleSelect}
            viewPortOffsets={{bottom:Platform.OS=="android"?vs(200):vs(80), left:Platform.OS=="android"?80:30, right:Platform.OS=="android"?50:20, top:vs(30)}}
          />
        </View>
        :null}
    </ScrollView>
  )


});

export default DailyChart;

const _styles = (theme: ThemeType) => ScaledSheet.create({
    title:{
        fontSize: ms(18, 0.8),
        fontFamily:'karla_regular',
        marginHorizontal: ms(20, 0.5),
        marginTop: ms(20,0.5)
    },
    subtitle:{
        fontSize: ms(12, 0.8),
        fontFamily:'karla_regular',
        marginHorizontal: ms(20, 0.5),
        marginTop: ms(20,0.5)
    },
    container:{
      flex:1,
      backgroundColor:'white',
      paddingHorizontal:5
    },
    chart_container: {
        flex: 1,
    },
    chart: {
        height: vs(300),
    },
    hrChart: {
        height: vs(300),
        marginBottom:vs(20),
    },
    bottomTitle:{
        fontSize: ms(18, 0.8),
        fontFamily:'karla_regular',
        marginHorizontal: ms(20, 0.5),
        marginTop: ms(30,0.5)
    }
});
