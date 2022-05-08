package com.respiree.app;
import com.facebook.react.bridge.NativeModule;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import android.app.Activity;
import android.util.Log;


//CHANGE LoadingOverlay WITH THE NAME OF YOUR CHOICE
public class NativeCircularChart extends ReactContextBaseJavaModule {

    private CalmnessStressCircularChartView chartViewInstance;

    public NativeCircularChart(ReactApplicationContext reactContext, CirculartChartViewManager chartViewManager) {
        super(reactContext);
        if(chartViewManager != null) {
            Log.d("CircularChart", "chart view manager is not null");
            chartViewInstance = chartViewManager.getChartViewInstance();
        }else{
            Log.d("CircularChart", "chart view manager is  null~~~~");
        }
    }

    @Override
    public String getName() {
        return "NativeCircularChart";
    }

    @ReactMethod
    public void setStress(float stressPercent, boolean display, float stressUpper, float stressLower) {

        if(chartViewInstance != null){
            Log.d("CircularChart", "setStresssss"+stressPercent);
            chartViewInstance.setStress(stressPercent, display, stressUpper, stressLower);
        }else{
            Log.d("CircularChart", "charview is null");
        }

    }
}
