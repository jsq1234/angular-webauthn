import { Injectable } from '@angular/core';
import {
  AuthenticationDetails,
  CognitoUser,
  CognitoUserPool,
  CognitoUserAttribute,

} from 'amazon-cognito-identity-js';
import { User } from '../interfaces/user';
import { PublicKeyCred } from '../interfaces/public-key-cred';
import { toBase64 } from 'js-base64';

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

  signUp(user: User, publicKeyCred: PublicKeyCred) : Promise<CognitoUser | undefined>{
    return new Promise((resolve, reject) => {

      const publickKeyCredBase64 = toBase64(JSON.stringify(publicKeyCred));

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
          Value: publickKeyCredBase64,
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

  async confirmSignUp(code: string) : Promise<Boolean> {
    return new Promise((resolve, reject) => {
      if(!this.cognitoUser){
        console.log('No user to confirm');
        alert('No user to confirm');
        reject('No user to confirm');
        return ;
      }
  
      this.cognitoUser.confirmRegistration(code, true, (err, result) => {
        if (err) {
          console.log(err.message || JSON.stringify(err));
          reject('failed');
          return;
        }
        console.log('call result: ' + result);
        resolve(true);
      });
    })
  }
  
}
