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
import { fromUint8Array, toBase64, toUint8Array } from 'js-base64';
import { AuthTokens } from '../interfaces/auth-tokens';
import { Buffer } from 'buffer';
import { parseAuthData, parseBase64url, toBase64url } from './utils';

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

  constructor() {}

  signUp(
    user: User,
    publicKeyCred: PublicKeyCred
  ): Promise<CognitoUser | undefined> {
    return new Promise((resolve, reject) => {
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

  signIn(username: string, password: string): Promise<AuthTokens> {
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
        customChallenge: async function (challengeParameters) {
          console.log('Custom challenge from Cognito: ');
          console.log(challengeParameters);

          const publicKeyOptions: PublicKeyCredentialRequestOptions = {
            challenge: window.Buffer.from(challengeParameters.challenge, 'hex'),
            timeout: 1800000,
            rpId: window.location.hostname,
            userVerification: 'preferred',
            allowCredentials: [
              {
                id: parseBase64url(challengeParameters.credId),
                type: 'public-key',
                transports: ['internal']
              },
            ],
          };

          const credentials = (await navigator.credentials.get({
            publicKey: publicKeyOptions,
          })) as PublicKeyCredential;

          console.log('Get credentials: ', credentials);

          const response =
            credentials.response as AuthenticatorAssertionResponse;

          const challengeAnswer = {
            response: {},
          };

          console.log('response: ', response);

          const clientData = JSON.parse(
            new TextDecoder().decode(response.clientDataJSON)
          );

          console.log(clientData);

          const authenticatorData = new Uint8Array(response.authenticatorData);
          const signature = new Uint8Array(response.signature);
          const userHandle = new Uint8Array(
            response.userHandle ?? new Uint8Array(0)
          );

          const parsedAuthData = parseAuthData(authenticatorData);

          console.log('clientDataJSON', clientData);

          console.log(`authenticatorData [${authenticatorData.byteLength}]`, authenticatorData);

          console.log(`signature [${signature.byteLength}]`, signature);

          console.log('parsedAuthData: ', parsedAuthData);

          if (response) {
            challengeAnswer.response = {
              clientDataJSON: fromUint8Array(new Uint8Array(response.clientDataJSON), true),
              authenticatorData: fromUint8Array(authenticatorData, true),
              signature: fromUint8Array(signature, true),
              userHandle: fromUint8Array(userHandle, true),
            };
          }

          console.log('challengeAnswer: ', challengeAnswer);

          cognitoUser.sendCustomChallengeAnswer(
            JSON.stringify(challengeAnswer),
            this
          );
        },
      };

      cognitoUser.setAuthenticationFlowType('CUSTOM_AUTH');
      cognitoUser.initiateAuth(authenticationDetails, authCallback);
    });
  }
}
