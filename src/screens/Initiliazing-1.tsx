import React from 'react';
import { StyleSheet, View } from 'react-native';

import useStyles from 'src/hooks/useStyles';
import { useServices } from 'src/services';
import { AuthState, onAuthUIStateChange } from '@aws-amplify/ui-components';
import Amplify, { Auth } from 'aws-amplify';
import { ButtonTitle } from 'src/components/Button';
import { Hub } from 'aws-amplify';
import { withAuthenticator } from 'aws-amplify-react-native'
import { useStores } from 'src/stores';
import useConstants from 'src/hooks/useConstants';

const Initializing: React.FC = () => {
  const { styles } = useStyles(_styles);
  const { nav, t} = useServices();
  const [authState, setAuthState] = React.useState();
  const [user, setUser] = React.useState();
  const {apiUrl } = useConstants();
  const {patient} = useStores();

  Hub.listen('auth', (data) => {
    switch (data.payload.event) {
      case 'signIn':
          console.log('user signed in');
          break;
      case 'signUp':
          console.log('user signed up');
          break;
      case 'signOut':
          console.log('user signed out');
          break;
      case 'signIn_failure':
          console.log('user sign in failed');
          break;
      case 'configured':
          console.log('the Auth module is configured');
    }
  });

  React.useEffect(() => {
    Auth.currentAuthenticatedUser().then((user)=>{
      console.log("user authenticated",user.username);
      const url = `${apiUrl.authentication}?username=${user.username}`
      console.log("url==",url);
      fetch(url, {
        method: 'GET'
      })
      .then((response) => response.json())
      .then((responseJson) => {
        console.log("response",responseJson)

        if(responseJson.response && responseJson.statusCode == 200){
            console.log("response 200")
            if(responseJson.response && responseJson.response.userid){
              patient.setId(responseJson.response.userid);
            }
            goToApp();
          //response {"response": {"userid": []}, "statusCode": 200}
          //console.log("userId===",responseJson.response.userid);
          /*const getUserIdUrl = "https://3rc2x11t5g.execute-api.ap-southeast-1.amazonaws.com/dev/query/getid?username=ctuser1"//+user.username;
          console.log(getUserIdUrl)
          fetch(getUserIdUrl, {
            method: 'GET'
          })
          .then((response) => response.json())
          .then((responseJson) => {
            console.log("getUserId resp",responseJson)
            if(responseJson.response && responseJson.response.userid){
              patient.setId(responseJson.response.userid);
            }
            goToApp();
          })
          .catch((error) => {
            goToApp();
          });*/
        } else {
            console.error("No valid response");
            goToApp();
        }
      })
      .catch((error) => {
          console.error(error);
          goToApp();
      });

    }).catch(e=>{
      console.log("not authenticated")
    })
  }, []);

  const goToApp = ()=>{
    nav.startApp();
  }

  const signOut = async()=>{
    await Auth.signOut()
     .then(data => console.log('sign out data',data))
     .catch(err => console.log('sign out err',err));
  }

  return <View style={styles.container}>
    {/* <ButtonTitle btnStyle={[styles.button, {width:150, height:40}]} textStyle={styles.buttonText} title={"Sign out"}onPress={signOut}/>
    <View style={{height:20}}/>
    <ButtonTitle btnStyle={[styles.button, {width:150, height:40}]} textStyle={styles.buttonText} title={"go to App"}onPress={goToApp}/>  */}
    </View>;
}

const _styles = (theme: ThemeType) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.bg,
    justifyContent:'center',
    alignItems:'center'
  },
  button:{
    borderRadius:50,
    backgroundColor:theme.colors.main,
    height:45,
    alignItems:'center',
    justifyContent:'center'
  },
  buttonText:{
    fontSize: 16,
    margin: 0,
    width:'100%',
    fontFamily:'karla_bold',
    color:'white',
    textAlign:'center'
  },
});


/*
authenticated user json data
{
  "Session": null,
  "attributes": {
    "email": "belinda@astralink.com.sg",
    "email_verified": true,
    "phone_number": "+65111111,
    "phone_number_verified": false,
    "sub": "a1ababf0-4b0c-41c9-aa19-030d96de7804"
  },
  "authenticationFlowType": "USER_SRP_AUTH",
  "client": {
    "endpoint": "https://cognito-idp.ap-southeast-1.amazonaws.com/",
    "fetchOptions": {

    }
  },
  "keyPrefix": "CognitoIdentityServiceProvider.3lc5372sgsav4nu3av7f1g38tu",
  "pool": {
    "advancedSecurityDataCollectionFlag": true,
    "client": {
      "endpoint": "https://cognito-idp.ap-southeast-1.amazonaws.com/",
      "fetchOptions": [
        Object
      ]
    },
    "clientId": "3lc5372sgsav4nu3av7f1g38tu",
    "storage": [
      FunctionMemoryStorage
    ],
    "userPoolId": "ap-southeast-1_yjXyh6PvV",
    "wrapRefreshSessionCallback": [
      Functionanonymous
    ]
  },
  "preferredMFA": "NOMFA",
  "signInUserSession": {
    "accessToken": {
      "jwtToken": "eyJraWQiOiIwdnVlMHFaaUN2bWxsS1dtMVpRVDNPSGtRV0FsTTNLdkhWT1ZmOVpcLzBUdz0iLCJhbGciOiJSUzI1NiJ9.eyJzdWIiOiJhMWFiYWJmMC00YjBjLTQxYzktYWExOS0wMzBkOTZkZTc4MDQiLCJldmVudF9pZCI6ImZiYTIzZjk4LWVmNDYtNDM0ZC1iYWZiLTMwNTA4N2QxNDNhYSIsInRva2VuX3VzZSI6ImFjY2VzcyIsInNjb3BlIjoiYXdzLmNvZ25pdG8uc2lnbmluLnVzZXIuYWRtaW4iLCJhdXRoX3RpbWUiOjE2MTU1MjQ0NTYsImlzcyI6Imh0dHBzOlwvXC9jb2duaXRvLWlkcC5hcC1zb3V0aGVhc3QtMS5hbWF6b25hd3MuY29tXC9hcC1zb3V0aGVhc3QtMV95alh5aDZQdlYiLCJleHAiOjE2MTU1MjgwNTYsImlhdCI6MTYxNTUyNDQ1NywianRpIjoiMDc4ODA4MjktMzkyZi00NWQ0LWIwMDAtMDA5MzczYWYzOTU5IiwiY2xpZW50X2lkIjoiM2xjNTM3MnNnc2F2NG51M2F2N2YxZzM4dHUiLCJ1c2VybmFtZSI6ImJlbGluZGEifQ.VVTCpthW_nXKqFkxtKFpX20JnlQGInmY-mzt_9qIJ8NDWeM3LtcXOrJeZ0mEM7Fwsx3oAq94wSewcMKy8c_UDDacHNQ8x38thtPc7XLYftbMZSwEgauI2Z5RlOPZyQyHX_tESciEkKzEFAEEom93Y4Cmbobgaop1Cb01nnrcxP_t8_mFn1YThrzSSPZISDcWKJAvKK64I9R0TV-RPpmMeLhINeXzsSrrBNDBr7mHVhPFenZTW7ALuFhHiUcTcEA6o-1659nFGSI_x1akRkOAX05X_nkoXuMxnV4TtDhzdrNJGRN2F6HJmnJ_tUWwrOYAqkhoQP_oQXOk9nm3Y5SlSg",
      "payload": [
        Object
      ]
    },
    "clockDrift": 2,
    "idToken": {
      "jwtToken": "eyJraWQiOiJxb01BWFFDYkllN0t6YXBuY3NJVE5lT05Cd2h6blZXeHI1VGtvRlkwSDdJPSIsImFsZyI6IlJTMjU2In0.eyJzdWIiOiJhMWFiYWJmMC00YjBjLTQxYzktYWExOS0wMzBkOTZkZTc4MDQiLCJlbWFpbF92ZXJpZmllZCI6dHJ1ZSwiaXNzIjoiaHR0cHM6XC9cL2NvZ25pdG8taWRwLmFwLXNvdXRoZWFzdC0xLmFtYXpvbmF3cy5jb21cL2FwLXNvdXRoZWFzdC0xX3lqWHloNlB2ViIsInBob25lX251bWJlcl92ZXJpZmllZCI6ZmFsc2UsImNvZ25pdG86dXNlcm5hbWUiOiJiZWxpbmRhIiwiYXVkIjoiM2xjNTM3MnNnc2F2NG51M2F2N2YxZzM4dHUiLCJldmVudF9pZCI6ImZiYTIzZjk4LWVmNDYtNDM0ZC1iYWZiLTMwNTA4N2QxNDNhYSIsInRva2VuX3VzZSI6ImlkIiwiYXV0aF90aW1lIjoxNjE1NTI0NDU2LCJwaG9uZV9udW1iZXIiOiIrNjU5MzU3NjQ4NyIsImV4cCI6MTYxNTUyODA1NiwiaWF0IjoxNjE1NTI0NDU3LCJlbWFpbCI6ImJlbGluZGFAYXN0cmFsaW5rLmNvbS5zZyJ9.VPJKr3UKwJgP6g27EX9r03wnTNu8Zg72TQlxkKIiFb_t-CSTyGxeuy80FTbE8K1eO0FeFDjqsJzwFOXQr7d2MNjSFSmv0UYv0_MEtPrwGQxfwW4z2APhA6nzv9ljy471RbpzcCvZphR7G9VBHRgTMjodgZRBgmXq2dW1_Zs9B5HrSkwJ7vZLTFH2BfzyxNVs4TuvA6IS9Rm1fG70miBaTguW_Sd4BcE4q-Fha_ayAc8u2DhGPpdNgr0Tnc6KSS28OkHSD0zaY7-79Eh8oiNyhWx_W1GQQaKaZxWAl2bVS6ClYs7MLwMAzwQhuZ2Fb7comUyhpO4bYozkwGLvM2Lppw",
      "payload": [
        Object
      ]
    },
    "refreshToken": {
      "token": "eyJjdHkiOiJKV1QiLCJlbmMiOiJBMjU2R0NNIiwiYWxnIjoiUlNBLU9BRVAifQ.0bvs_YN132z8CTNtn8uVIuiTEiCxtBJiPYozk-ycQuq-sqDEfDpdb7OrRyZ0LAKiuZOpIZS9iJf2OCKHESRa9EPt6xciPVtk7D0ALHCrVVuCf_7VoOxC-42jvM7gRcWESuqnP3V4AbXprVeBcGcnaDk8M9zG5DcN45En9hvB4ff_Xay0etENvuoIZkn_KfqEH0ekKtcPKeWecprdRNM3a8NSPyX7ArDuIMUgsRCkSH-13WWTIRBGaV4EX5Goy9TewKnStIeS-iqww6OgyJpSDbNUwFByHqYUTUUqbjZOxKI2ZCT7qD1gnnJD2Gt9O7vkSXt57Ga0WBI7BBjMnr7TIg.3bR60-rob6ehVHgZ.jWksBhr0TjqYcMYh-4jN-0F8EBhCtk93kgLgL9K06qCyTIG8Kuv4LS1K8VqaCIUeo6a0YAa27MiUJOWZ9vPuC_gTQNr2JrjC77jksb9m5548q6D-7RNvAqz-rW3_qzjHda2Qdan0NbrEfv-MtvDCK6o-WKZf4ovnXTPO-B9OzmakluhimOiMduqhKixYE01KYksQZyI19xtAFH5adHjKTu211CP6N8IF4KdofjFz8pJRUAlpXdNyCfsbOyjt1knXUElEPFT6Nz039iY2RUVExuQPeBSBoP0QXfNY7dq70OWGG2buTwEEd8kTdQJHJ2Hhaz46KrOcW0i7h8zrCPv4PyC93hbdzMz4_LfIsIFoUBQGQdg-9ZWr2TdXlq7wOlwOnfI1vr11PrPtQRxDCLSqmBuU5b6-zqLmvKuePnsyHa2uk9zztuPj0HZnBeOVa3KsZGdQ5tdGe7G27dHvoc5_vE3WO5TZ1ZNPMbcWpNDbuWIyWlZxt2-hgUpaY1zBf_tRkstP5yv1p8SmpOKsoL7TwGUL_Rm3l3pSK6NMyJes7mNwDyhAkIi7jXxDpC60RpA298EiPlJzwIlv1RZZ8LT27aFmr259in0sCTMMAbLcIyhd_9yZ64-a5f2y-kq3NQGdfMflfqyS1_pytHYuGrt7QY_cLXz0gW6p18ClNkRDpBzy1wJ87AKHIztOYQGIjSw1AuzEXUsB_eLyMimvmGbiOsIE9jKQCNqZqPD_4MtKp5enW_q8SG4QEbdV5xXMSLSyLDP8TVID3bZpIUiMcMhn40aRNRKN_454-vEYeE3OMiQfNg5RkzMeR3rEpS9QFbRPUB7jPW0BXK-JJwhf0ACcCadzIkK5ABMvnUN5rAVII86Wm21FL7FZ-c3bx-AXDiqWnbBq8_xjH_ZYsO8s5VmJ2zD5MJykKujBx3tcrT2o3n2UpIRuBYx3cII_uaJonWTWwD9gnv7U1cYB6HIrLS0pZwR9leChBlxtuvLm7DLMrB9TAiNvAum1fpOoPRP-ojvncI3jHkGonzZ2rvNSMJofcPf30zfe8x26DgNJ_HaU6Kg_KN6Gx0qVcIo04nw3HpKWz7FLxUPdVZRXGACKYOe2N7TYavUKD-2Aw9rnJ2qB5svecoDpTi92hJOMe_Qxx-s-9zPus8Vr_M_7uaz1JdPUfNhgPCCO0_yUGyUT7aPQWB2nmWSQwTaQVGj0Ms4cvATbDx78-55JlkDhAu7lUrqqBRCsKElydbxOgZ8YsiltlGrfAbz6txnHhd9uG585ua_QILr9yfoQVD6TsZ9RrSDo9cB4XQ.m4yNNv1YhgUuhBe5pxUVXA"
    }
  },
  "storage": [
    FunctionMemoryStorage
  ],
  "userDataKey": "CognitoIdentityServiceProvider.3lc5372sgsav4nu3av7f1g38tu.belinda.userData",
  "username": "belinda"
}

currentSession
{
  "accessToken": {
    "jwtToken": "eyJraWQiOiIwdnVlMHFaaUN2bWxsS1dtMVpRVDNPSGtRV0FsTTNLdkhWT1ZmOVpcLzBUdz0iLCJhbGciOiJSUzI1NiJ9.eyJzdWIiOiJhMWFiYWJmMC00YjBjLTQxYzktYWExOS0wMzBkOTZkZTc4MDQiLCJldmVudF9pZCI6ImZiYTIzZjk4LWVmNDYtNDM0ZC1iYWZiLTMwNTA4N2QxNDNhYSIsInRva2VuX3VzZSI6ImFjY2VzcyIsInNjb3BlIjoiYXdzLmNvZ25pdG8uc2lnbmluLnVzZXIuYWRtaW4iLCJhdXRoX3RpbWUiOjE2MTU1MjQ0NTYsImlzcyI6Imh0dHBzOlwvXC9jb2duaXRvLWlkcC5hcC1zb3V0aGVhc3QtMS5hbWF6b25hd3MuY29tXC9hcC1zb3V0aGVhc3QtMV95alh5aDZQdlYiLCJleHAiOjE2MTU1MjgwNTYsImlhdCI6MTYxNTUyNDQ1NywianRpIjoiMDc4ODA4MjktMzkyZi00NWQ0LWIwMDAtMDA5MzczYWYzOTU5IiwiY2xpZW50X2lkIjoiM2xjNTM3MnNnc2F2NG51M2F2N2YxZzM4dHUiLCJ1c2VybmFtZSI6ImJlbGluZGEifQ.VVTCpthW_nXKqFkxtKFpX20JnlQGInmY-mzt_9qIJ8NDWeM3LtcXOrJeZ0mEM7Fwsx3oAq94wSewcMKy8c_UDDacHNQ8x38thtPc7XLYftbMZSwEgauI2Z5RlOPZyQyHX_tESciEkKzEFAEEom93Y4Cmbobgaop1Cb01nnrcxP_t8_mFn1YThrzSSPZISDcWKJAvKK64I9R0TV-RPpmMeLhINeXzsSrrBNDBr7mHVhPFenZTW7ALuFhHiUcTcEA6o-1659nFGSI_x1akRkOAX05X_nkoXuMxnV4TtDhzdrNJGRN2F6HJmnJ_tUWwrOYAqkhoQP_oQXOk9nm3Y5SlSg",
    "payload": {
      "auth_time": 1615524456,
      "client_id": "3lc5372sgsav4nu3av7f1g38tu",
      "event_id": "fba23f98-ef46-434d-bafb-305087d143aa",
      "exp": 1615528056,
      "iat": 1615524457,
      "iss": "https://cognito-idp.ap-southeast-1.amazonaws.com/ap-southeast-1_yjXyh6PvV",
      "jti": "07880829-392f-45d4-b000-009373af3959",
      "scope": "aws.cognito.signin.user.admin",
      "sub": "a1ababf0-4b0c-41c9-aa19-030d96de7804",
      "token_use": "access",
      "username": "belinda"
    }
  },
  "clockDrift": 2,
  "idToken": {
    "jwtToken": "eyJraWQiOiJxb01BWFFDYkllN0t6YXBuY3NJVE5lT05Cd2h6blZXeHI1VGtvRlkwSDdJPSIsImFsZyI6IlJTMjU2In0.eyJzdWIiOiJhMWFiYWJmMC00YjBjLTQxYzktYWExOS0wMzBkOTZkZTc4MDQiLCJlbWFpbF92ZXJpZmllZCI6dHJ1ZSwiaXNzIjoiaHR0cHM6XC9cL2NvZ25pdG8taWRwLmFwLXNvdXRoZWFzdC0xLmFtYXpvbmF3cy5jb21cL2FwLXNvdXRoZWFzdC0xX3lqWHloNlB2ViIsInBob25lX251bWJlcl92ZXJpZmllZCI6ZmFsc2UsImNvZ25pdG86dXNlcm5hbWUiOiJiZWxpbmRhIiwiYXVkIjoiM2xjNTM3MnNnc2F2NG51M2F2N2YxZzM4dHUiLCJldmVudF9pZCI6ImZiYTIzZjk4LWVmNDYtNDM0ZC1iYWZiLTMwNTA4N2QxNDNhYSIsInRva2VuX3VzZSI6ImlkIiwiYXV0aF90aW1lIjoxNjE1NTI0NDU2LCJwaG9uZV9udW1iZXIiOiIrNjU5MzU3NjQ4NyIsImV4cCI6MTYxNTUyODA1NiwiaWF0IjoxNjE1NTI0NDU3LCJlbWFpbCI6ImJlbGluZGFAYXN0cmFsaW5rLmNvbS5zZyJ9.VPJKr3UKwJgP6g27EX9r03wnTNu8Zg72TQlxkKIiFb_t-CSTyGxeuy80FTbE8K1eO0FeFDjqsJzwFOXQr7d2MNjSFSmv0UYv0_MEtPrwGQxfwW4z2APhA6nzv9ljy471RbpzcCvZphR7G9VBHRgTMjodgZRBgmXq2dW1_Zs9B5HrSkwJ7vZLTFH2BfzyxNVs4TuvA6IS9Rm1fG70miBaTguW_Sd4BcE4q-Fha_ayAc8u2DhGPpdNgr0Tnc6KSS28OkHSD0zaY7-79Eh8oiNyhWx_W1GQQaKaZxWAl2bVS6ClYs7MLwMAzwQhuZ2Fb7comUyhpO4bYozkwGLvM2Lppw",
    "payload": {
      "aud": "3lc5372sgsav4nu3av7f1g38tu",
      "auth_time": 1615524456,
      "cognito:username": "belinda",
      "email": "belinda@astralink.com.sg",
      "email_verified": true,
      "event_id": "fba23f98-ef46-434d-bafb-305087d143aa",
      "exp": 1615528056,
      "iat": 1615524457,
      "iss": "https://cognito-idp.ap-southeast-1.amazonaws.com/ap-southeast-1_yjXyh6PvV",
      "phone_number": "+65111111",
      "phone_number_verified": false,
      "sub": "a1ababf0-4b0c-41c9-aa19-030d96de7804",
      "token_use": "id"
    }
  },
  "refreshToken": {
    "token": "eyJjdHkiOiJKV1QiLCJlbmMiOiJBMjU2R0NNIiwiYWxnIjoiUlNBLU9BRVAifQ.0bvs_YN132z8CTNtn8uVIuiTEiCxtBJiPYozk-ycQuq-sqDEfDpdb7OrRyZ0LAKiuZOpIZS9iJf2OCKHESRa9EPt6xciPVtk7D0ALHCrVVuCf_7VoOxC-42jvM7gRcWESuqnP3V4AbXprVeBcGcnaDk8M9zG5DcN45En9hvB4ff_Xay0etENvuoIZkn_KfqEH0ekKtcPKeWecprdRNM3a8NSPyX7ArDuIMUgsRCkSH-13WWTIRBGaV4EX5Goy9TewKnStIeS-iqww6OgyJpSDbNUwFByHqYUTUUqbjZOxKI2ZCT7qD1gnnJD2Gt9O7vkSXt57Ga0WBI7BBjMnr7TIg.3bR60-rob6ehVHgZ.jWksBhr0TjqYcMYh-4jN-0F8EBhCtk93kgLgL9K06qCyTIG8Kuv4LS1K8VqaCIUeo6a0YAa27MiUJOWZ9vPuC_gTQNr2JrjC77jksb9m5548q6D-7RNvAqz-rW3_qzjHda2Qdan0NbrEfv-MtvDCK6o-WKZf4ovnXTPO-B9OzmakluhimOiMduqhKixYE01KYksQZyI19xtAFH5adHjKTu211CP6N8IF4KdofjFz8pJRUAlpXdNyCfsbOyjt1knXUElEPFT6Nz039iY2RUVExuQPeBSBoP0QXfNY7dq70OWGG2buTwEEd8kTdQJHJ2Hhaz46KrOcW0i7h8zrCPv4PyC93hbdzMz4_LfIsIFoUBQGQdg-9ZWr2TdXlq7wOlwOnfI1vr11PrPtQRxDCLSqmBuU5b6-zqLmvKuePnsyHa2uk9zztuPj0HZnBeOVa3KsZGdQ5tdGe7G27dHvoc5_vE3WO5TZ1ZNPMbcWpNDbuWIyWlZxt2-hgUpaY1zBf_tRkstP5yv1p8SmpOKsoL7TwGUL_Rm3l3pSK6NMyJes7mNwDyhAkIi7jXxDpC60RpA298EiPlJzwIlv1RZZ8LT27aFmr259in0sCTMMAbLcIyhd_9yZ64-a5f2y-kq3NQGdfMflfqyS1_pytHYuGrt7QY_cLXz0gW6p18ClNkRDpBzy1wJ87AKHIztOYQGIjSw1AuzEXUsB_eLyMimvmGbiOsIE9jKQCNqZqPD_4MtKp5enW_q8SG4QEbdV5xXMSLSyLDP8TVID3bZpIUiMcMhn40aRNRKN_454-vEYeE3OMiQfNg5RkzMeR3rEpS9QFbRPUB7jPW0BXK-JJwhf0ACcCadzIkK5ABMvnUN5rAVII86Wm21FL7FZ-c3bx-AXDiqWnbBq8_xjH_ZYsO8s5VmJ2zD5MJykKujBx3tcrT2o3n2UpIRuBYx3cII_uaJonWTWwD9gnv7U1cYB6HIrLS0pZwR9leChBlxtuvLm7DLMrB9TAiNvAum1fpOoPRP-ojvncI3jHkGonzZ2rvNSMJofcPf30zfe8x26DgNJ_HaU6Kg_KN6Gx0qVcIo04nw3HpKWz7FLxUPdVZRXGACKYOe2N7TYavUKD-2Aw9rnJ2qB5svecoDpTi92hJOMe_Qxx-s-9zPus8Vr_M_7uaz1JdPUfNhgPCCO0_yUGyUT7aPQWB2nmWSQwTaQVGj0Ms4cvATbDx78-55JlkDhAu7lUrqqBRCsKElydbxOgZ8YsiltlGrfAbz6txnHhd9uG585ua_QILr9yfoQVD6TsZ9RrSDo9cB4XQ.m4yNNv1YhgUuhBe5pxUVXA"
  }
}
*/
export default withAuthenticator(Initializing);
