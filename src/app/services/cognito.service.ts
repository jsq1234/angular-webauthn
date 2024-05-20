import { Injectable } from '@angular/core';
import {
  AuthenticationDetails,
  CognitoUser,
  CognitoUserPool,
  CognitoUserAttribute,
  IAuthenticationCallback,
} from 'amazon-cognito-identity-js';
import { User } from '../interfaces/user';
import { PublicKeyCred } from '../interfaces/public-key-cred';
import { AuthTokens } from '../interfaces/auth-tokens';
import { Buffer } from 'buffer';
import { toBase64url } from './utils';
import { WebauthnService } from './webauthn.service';

window.Buffer = Buffer;

@Injectable({
  providedIn: 'root',
})
export class CognitoService {
  userPool = new CognitoUserPool({
    UserPoolId: 'ap-south-1_56x5jYGm4',
    ClientId: '7lp0md7u0r5ljrct3lvcoctj3d',
  });

  cognitoUser: CognitoUser | undefined;

  constructor(private webauthnService: WebauthnService) {}

  signUp(
    user: User,
    publicKeyCred: PublicKeyCred
  ): Promise<CognitoUser | undefined> {
    return new Promise((resolve, reject) => {

      /* Store the public key credential (base64url encoded) in the user's attributes. */
      const publickKeyCredBase64url = toBase64url(
        JSON.stringify(publicKeyCred)
      );

      console.log('publicKeyCred(Base64url): ', publickKeyCredBase64url);

      let attributeList: CognitoUserAttribute[] = [];

      attributeList.push(
        new CognitoUserAttribute({
          Name: 'email',
          Value: user.email,
        })
      );

      /* 
        You need to create a custom attribute in the Cognito User Pool called 'publicKeyCred'
        when you create your new user pool. 
      */
      attributeList.push(
        new CognitoUserAttribute({
          Name: 'custom:publicKeyCred',
          Value: publickKeyCredBase64url,
        })
      );

      this.userPool.signUp(
        user.username,
        user.password,
        attributeList,
        [],
        (err, result) => {
          if (err) {
            console.log(err.message || JSON.stringify(err));
            reject(err);
            return;
          }

          this.cognitoUser = result?.user;

          console.log('user name is ' + this.cognitoUser?.getUsername());

          resolve(result?.user);
        }
      );
    });
  }

  async confirmSignUp(username: string, code: string): Promise<Boolean> {
    return new Promise((resolve, reject) => {
      const cognitoUser = new CognitoUser({
        Username: username,
        Pool: this.userPool,
      });

      cognitoUser.confirmRegistration(code, true, (err, result) => {
        if (err) {
          console.log(err.message || JSON.stringify(err));
          reject('failed');
          return;
        }
        resolve(true);
      });
    });
  }

  signIn(username: string, password: string, useBiometric: boolean, usePassword: boolean): Promise<AuthTokens> {
    return new Promise((resolve, reject) => {
      const authenticationDetails = new AuthenticationDetails({
        Username: username,
        Password: password,
      });

      const cognitoUser = new CognitoUser({
        Username: username,
        Pool: this.userPool,
      });

      const authCallback: IAuthenticationCallback = {
        onSuccess: function (result) {
          let accessToken = result.getAccessToken().getJwtToken();
          let idToken = result.getIdToken().getJwtToken();
          let refreshToken = result.getRefreshToken().getToken();
          let expiresIn = result.getAccessToken().getExpiration();

          resolve({
            accessToken,
            idToken,
            refreshToken,
            expiresIn,
          });
        },
        onFailure: function (err) {
          console.log(err.message || JSON.stringify(err));
          reject(err);
        },
        customChallenge: async (challengeParameters) => {
          console.log('Custom challenge from Cognito: ');
          console.log(challengeParameters);

          const { credId, challenge } = challengeParameters;
          
          if(!credId|| !challenge){
            throw new Error("Missing credentialId or challenge!");
          };

          const challengeAnswer = await this.webauthnService.getCredentials(credId, challenge);

          console.log('challengeAnswer: ', challengeAnswer);

          cognitoUser.sendCustomChallengeAnswer(
            JSON.stringify(challengeAnswer),
            authCallback
          );
        },
      };

      if(usePassword && !useBiometric){
        cognitoUser.authenticateUser(authenticationDetails, authCallback);
      }else if(useBiometric && !usePassword){
        cognitoUser.setAuthenticationFlowType('CUSTOM_AUTH');
        cognitoUser.initiateAuth(authenticationDetails, authCallback);
      }else if(useBiometric && usePassword){
        cognitoUser.setAuthenticationFlowType('CUSTOM_AUTH');
        cognitoUser.authenticateUser(authenticationDetails, authCallback);
      }else{
        throw new Error("Must specify at least one way to authenticate!");
      }
    });
  }
}
