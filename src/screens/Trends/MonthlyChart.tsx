import React, {useState, useEffect} from 'react';
import { View, Text, ScrollView, processColor, Platform, RefreshControl} from 'react-native';
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
import { LineChart } from "react-native-charts-wrapper";
import { numberToString } from 'src/stores/bluetooth';

const MonthlyChart: React.FC = observer(({
    componentId,
  }) => {
    const {patient} = useStores();
    const { colors, options, apiUrl } = useConstants();
    const { styles } = useStyles(_styles);
    const { nav, t} = useServices();
    const [monthlyDate, setMonthlyDate] = useState([])
    const [update, setUpdate] = useState(false)
    const [xAxis, setxAxis] = useState([]);
    const [selectedEntry, setSelectedEntry] = useState(null)
    const [lineData, setLineData] = useState([]);
    const [baseData, setBaseData] = useState([]);
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
        if(metrics.listdate.length>0){
          const startDate = moment(metrics.listdate[0], 'YYYY-MM-DD')
          const endDate = moment(metrics.listdate[metrics.listdate.length-1], 'YYYY-MM-DD')
          // const startDate = moment(metrics.listdate[0], 'YYYY-MM-DD')
          // const endDate = moment(metrics.listdate[metrics.listdate.length-1], 'YYYY-MM-DD')
          const dd = [];
          dd.push(startDate);
          dd.push(endDate);
          setMonthlyDate(dd);
          //console.log("saving to monthly", moment(startDate).format("DD/MM/YY"),moment(endDate).format("DD/MM/YY"))
          let axis = [];
          for(let i=0; i<metrics.listdate.length; i++){
              let str = moment.utc(metrics.listdate[i], 'YYYY-MM-DD HH:mm').local().format('D')
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
    const getMonthlyData = (monthly)=>{
      if(monthly.length == 2){
        const startDate = moment(monthly[0]).format("YYYY-MM-DDTHH:mm:ss");
        const endDate = moment(monthly[1]).format("YYYY-MM-DDTHH:mm:ss");
        const type = "monthly"
        const id =  options.debug?160:patient.id;
        //const userIdStr = numberToString(id);
        //console.log("getMonthlyData from",startDate,endDate)
        const url = `${apiUrl.trends}?start_datetime=${startDate}&stop_datetime=${endDate}&id=${id}&resolution=${type}`
        sendRequest(url);
      }
    }

    const last14Days = ()=>{
      if(monthlyDate.length == 2){
        const startDate = moment(monthlyDate[0]);
        const lastWeek = moment(startDate).subtract(2, "w");
        let data = [];
        data.push(lastWeek)
        data.push(startDate)
        setMonthlyDate(data);
        console.log("last 2 week is", lastWeek.format("DD MMM"), startDate.format("DD MMM")) 
        setUpdate(!update)
      }
    }
  
    const next14Days = ()=>{
      if(monthlyDate.length == 2){
        const endDate = moment(monthlyDate[1]).add(1, 'd');
        const nextWeek = moment(endDate).add(2, "w");
        const today = moment()
        const isBefore = nextWeek.isSameOrBefore(today, 'day');
        if(isBefore){
          let data = [];
          data.push(endDate)
          data.push(nextWeek)
          setMonthlyDate(data);
          console.log("next week is", endDate.format("DD MMM"), nextWeek.format("DD MMM"))
          setUpdate(!update)
        }
      }
    }

    const lastWeek =()=>{
      if(monthlyDate.length == 2){
        const startDate = moment(monthlyDate[0]);
        const lastWeek = moment(startDate).subtract(1, "w");
        let weekly = [];
        weekly.push(lastWeek)
        weekly.push(startDate)
        setMonthlyDate(weekly);
        console.log("last week is", lastWeek.format("DD MMM"), startDate.format("DD MMM")) 
        setUpdate(!update)
      }
    }
  
    const nextWeek = ()=>{
      if(monthlyDate.length == 2){
        const endDate = moment(monthlyDate[1]);
        const nextWeek = moment(endDate).add(1, "w");
        const today = moment()
        const isBefore = nextWeek.isSameOrBefore(today, 'day');
        if(isBefore){
          let weekly = [];
          weekly.push(endDate)
          weekly.push(nextWeek)
          setMonthlyDate(weekly);
          console.log("next week is", endDate.format("DD MMM"), nextWeek.format("DD MMM"))
          setUpdate(!update)
        }
      }
    }

    const lastMonth =()=>{
      if(monthlyDate.length == 2){
        const startDate = moment(monthlyDate[0])
        const lastM = moment(startDate).subtract(1, "M");
        let monthly = [];
        monthly.push(lastM)
        monthly.push(startDate)
        setMonthlyDate(monthly);
        console.log("last month is", lastM.format("DD MMM"), startDate.format("DD MMM")) 
        setUpdate(!update)
      }
    }
  
    const nextMonth = ()=>{
      if(monthlyDate.length == 2){
        const endDate = moment(monthlyDate[1])
        const nextM = moment(endDate).add(1, "M");
        const today = moment()
        const isBefore = nextM.isSameOrBefore(today, 'd');
        console.log("curr date time is", monthlyDate[0].format("DD MMM"), monthlyDate[1].format("DD MMM"))
        if(isBefore){
          let monthly = [];
          monthly.push(endDate)
          monthly.push(nextM)
          setMonthlyDate(monthly);
          console.log("next month is", endDate.format("DD MMM"), nextM.format("DD MMM"))
          setUpdate(!update)
        }
      }
    }

    const initView = ()=>{
      let monthly = [];
      var today = moment.utc().set({minute:0,second:0,millisecond:0});
      let startDate = moment(today).subtract(2, 'w')
      let endDate = moment(today)
      monthly.push(startDate);
      monthly.push(endDate);
      setMonthlyDate(monthly);
      getMonthlyData(monthly);
    }

    useEffect(()=>{
      initView();
    },[])

    const handleSelect = (event) =>{
      let entry = event.nativeEvent;
      if (entry == null) {
          setSelectedEntry(null)
      } else {
          setSelectedEntry(JSON.stringify(entry))
      }
  
      //console.log(event.nativeEvent);
    } 

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
              <Text style={styles.subtitle}>{t.do("monthly_graph_subtitle")}</Text>
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
                  enabled: false
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
              visibleRange={{x: {min: 1, max: 8}}}
              dragDecelerationEnabled={true}
              dragDecelerationFrictionCoef={0.99}
              keepPositionOnRotation={false}
              onSelect={handleSelect}
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
                  textSize : ms(12,0.8),
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
              autoScaleMinMaxEnabled={false}
              touchEnabled={true}
              dragEnabled={true}
              scaleXEnabled={true}
              scaleYEnabled={false}
              pinchZoom={true}
              doubleTapToZoomEnabled={true}
              highlightPerTapEnabled={true}
              highlightPerDragEnabled={false}
              visibleRange={{x: {min: 1, max: 8}}}
              dragDecelerationEnabled={true}
              dragDecelerationFrictionCoef={0.99}
              keepPositionOnRotation={false}
              onSelect={handleSelect}
              viewPortOffsets={{bottom:Platform.OS=="android"?vs(200):vs(80), left:Platform.OS=="android"?80:30, right:Platform.OS=="android"?50:20, top:vs(30)}}
              onChange={event => console.log(event.nativeEvent)}
            />
          </View>
          :null}
      </ScrollView>
    )

});

export default MonthlyChart;

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
    paddingHorizontal:10
  },
  chart_container: {
      flex: 1,
  },
  chart: {
      height: vs(300),
      
  },
  hrChart: {
      height: vs(300),
      marginBottom:vs(20)
  },
  bottomTitle:{
      fontSize: ms(18, 0.8),
      fontFamily:'karla_regular',
      marginHorizontal: ms(20, 0.5),
      marginTop: ms(30,0.5)
  }
});