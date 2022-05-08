package com.respiree.app;

import android.util.Log;

import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.uimanager.SimpleViewManager;
import com.facebook.react.uimanager.ThemedReactContext;
import com.facebook.react.uimanager.annotations.ReactProp;

public class CirculartChartViewManager extends SimpleViewManager<CalmnessStressCircularChartView> {

    public static final String REACT_CLASS = "CircularChartView";

    private CalmnessStressCircularChartView chartViewInstance;

    public CirculartChartViewManager(ReactApplicationContext reactContext) {
        super();
    }

    @Override
    public String getName() {
        return REACT_CLASS;
    }

    @Override
    protected CalmnessStressCircularChartView createViewInstance(ThemedReactContext reactContext) {
        Log.d("CircularChart","init 111111111");
        chartViewInstance = new CalmnessStressCircularChartView(reactContext);
        return chartViewInstance;
    }

    public CalmnessStressCircularChartView getChartViewInstance() { // <-- returns the View instance
        return chartViewInstance;
    }

    @ReactProp(name="stress")
    public void setStress(CalmnessStressCircularChartView myView, float stress){
        myView.setStress(stress, true, 0.7f, 0.3f);
    }
}
