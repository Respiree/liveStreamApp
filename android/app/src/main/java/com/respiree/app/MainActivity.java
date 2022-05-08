package com.respiree.app;

import com.facebook.react.ReactActivityDelegate;
import com.facebook.react.ReactRootView;
import com.reactnativenavigation.NavigationActivity;
import com.swmansion.gesturehandler.react.RNGestureHandlerEnabledRootView;
import expo.modules.ReactActivityDelegateWrapper;


public class MainActivity extends NavigationActivity {

    protected String getMainComponentName() {
        return "Respiree";
    }

 
/*   protected ReactActivityDelegate createReactActivityDelegate() {
    return new ReactActivityDelegateWrapper(this,
      new ReactActivityDelegate(this, getMainComponentName())
    );
  } */

}
