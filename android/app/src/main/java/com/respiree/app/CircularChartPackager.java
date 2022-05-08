package com.respiree.app;

import com.facebook.react.ReactPackage;
import com.facebook.react.bridge.JavaScriptModule;
import com.facebook.react.bridge.NativeModule;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.uimanager.ViewManager;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;

public class CircularChartPackager implements ReactPackage {

    private CirculartChartViewManager chartViewManagerManager;


    @Override
    public List<ViewManager> createViewManagers(ReactApplicationContext reactContext) {
        if (chartViewManagerManager == null) {
            chartViewManagerManager = new CirculartChartViewManager(reactContext);
        }
        return Arrays.<ViewManager>asList(
                chartViewManagerManager
        );
    }

    @Override
    public List<NativeModule> createNativeModules(
            ReactApplicationContext reactContext) {
        if (chartViewManagerManager == null) {
            chartViewManagerManager = new CirculartChartViewManager(reactContext);
        }
        List<NativeModule> modules = new ArrayList<>();

        modules.add(new NativeCircularChart(reactContext,chartViewManagerManager));

        return modules;
    }

}
