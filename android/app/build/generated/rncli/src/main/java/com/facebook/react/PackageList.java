
package com.facebook.react;

import android.app.Application;
import android.content.Context;
import android.content.res.Resources;

import com.facebook.react.ReactPackage;
import com.facebook.react.shell.MainPackageConfig;
import com.facebook.react.shell.MainReactPackage;
import java.util.Arrays;
import java.util.ArrayList;

// @react-native-async-storage/async-storage
import com.reactnativecommunity.asyncstorage.AsyncStoragePackage;
// @react-native-community/masked-view
import org.reactnative.maskedview.RNCMaskedViewPackage;
// @react-native-community/netinfo
import com.reactnativecommunity.netinfo.NetInfoPackage;
// amazon-cognito-identity-js
import com.amazonaws.RNAWSCognitoPackage;
// expo
import expo.modules.ExpoModulesPackage;
// react-native-a-beep
import com.trietho.RNReactNativeABeepPackage;
// react-native-android-location-services-dialog-box
import com.showlocationservicesdialogbox.LocationServicesDialogBoxPackage;
// react-native-background-timer
import com.ocetnik.timer.BackgroundTimerPackage;
// react-native-ble-manager
import it.innove.BleManagerPackage;
// react-native-charts-wrapper
import com.github.wuxudong.rncharts.MPAndroidChartPackage;
// react-native-device-info
import com.learnium.RNDeviceInfo.RNDeviceInfo;
// react-native-fetch-blob
import com.RNFetchBlob.RNFetchBlobPackage;
// react-native-gesture-handler
import com.swmansion.gesturehandler.react.RNGestureHandlerPackage;
// react-native-localize
import com.zoontek.rnlocalize.RNLocalizePackage;
// react-native-navigation
import com.reactnativenavigation.react.NavigationPackage;
// react-native-permissions
import com.zoontek.rnpermissions.RNPermissionsPackage;
// react-native-reanimated
import com.swmansion.reanimated.ReanimatedPackage;
// react-native-screens
import com.swmansion.rnscreens.RNScreensPackage;
// react-native-svg
import com.horcrux.svg.SvgPackage;
// react-native-vector-icons
import com.oblador.vectoricons.VectorIconsPackage;
// rn-secure-storage
import com.taluttasgiran.rnsecurestorage.RNSecureStoragePackage;

public class PackageList {
  private Application application;
  private ReactNativeHost reactNativeHost;
  private MainPackageConfig mConfig;

  public PackageList(ReactNativeHost reactNativeHost) {
    this(reactNativeHost, null);
  }

  public PackageList(Application application) {
    this(application, null);
  }

  public PackageList(ReactNativeHost reactNativeHost, MainPackageConfig config) {
    this.reactNativeHost = reactNativeHost;
    mConfig = config;
  }

  public PackageList(Application application, MainPackageConfig config) {
    this.reactNativeHost = null;
    this.application = application;
    mConfig = config;
  }

  private ReactNativeHost getReactNativeHost() {
    return this.reactNativeHost;
  }

  private Resources getResources() {
    return this.getApplication().getResources();
  }

  private Application getApplication() {
    if (this.reactNativeHost == null) return this.application;
    return this.reactNativeHost.getApplication();
  }

  private Context getApplicationContext() {
    return this.getApplication().getApplicationContext();
  }

  public ArrayList<ReactPackage> getPackages() {
    return new ArrayList<>(Arrays.<ReactPackage>asList(
      new MainReactPackage(mConfig),
      new AsyncStoragePackage(),
      new RNCMaskedViewPackage(),
      new NetInfoPackage(),
      new RNAWSCognitoPackage(),
      new ExpoModulesPackage(),
      new RNReactNativeABeepPackage(),
      new LocationServicesDialogBoxPackage(),
      new BackgroundTimerPackage(),
      new BleManagerPackage(),
      new MPAndroidChartPackage(),
      new RNDeviceInfo(),
      new RNFetchBlobPackage(),
      new RNGestureHandlerPackage(),
      new RNLocalizePackage(),
      new NavigationPackage(reactNativeHost),
      new RNPermissionsPackage(),
      new ReanimatedPackage(),
      new RNScreensPackage(),
      new SvgPackage(),
      new VectorIconsPackage(),
      new RNSecureStoragePackage()
    ));
  }
}
