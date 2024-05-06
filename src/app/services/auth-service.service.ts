import { Injectable } from '@angular/core';
import { Factor, Fido2Lib } from 'fido2-lib';
import { arrayBufferToBase64, coerceToArrayBuffer, coerceToBaseUrl64 } from './utils';
import base64url from 'base64url';
import base64 from 'js-base64';
@Injectable({
  providedIn: 'root'
})
export class AuthServiceService {

  f2l: Fido2Lib = new Fido2Lib({
    timeout: 30*1000*60,
    rpName: "WebAuthn with Cognito",
    challengeSize: 32,
    cryptoParams: [-7]
  });

  encoder: TextEncoder = new TextEncoder();

  constructor() { 

  }

  async createCredentials(username: string, password: string, email: string, name: string) {
    try {

      const credentials = await this.f2l.attestationOptions();
      
      credentials.user = {
        displayName: name,
        id: ,
        name: name
      }

      credentials.pubKeyCredParams = [];
      const params = [-7, -257];

      for(let param of params){
        credentials.pubKeyCredParams.push({ type: 'public-key', alg: param });
      }

      credentials.attestation = 'none';

      credentials.authenticatorSelection = {
        authenticatorAttachment: 'platform',
        userVerification: 'preferred',
        requireResidentKey: false
      }

      credentials.challenge = this.encoder.encode('challenge');

      const cred = await navigator.credentials.create({
        publicKey: credentials
      }) as PublicKeyCredential;

      const clientDataJSON = (cred.response as AuthenticatorAttestationResponse).clientDataJSON;
      const attestationObject = (cred.response as AuthenticatorAttestationResponse).attestationObject;

      const attestationResponse = {
        id: coerceToArrayBuffer(cred.id),
        rawId: cred.rawId,
        response: {
          clientDataJSON: arrayBufferToBase64(clientDataJSON),
          attestationObject: arrayBufferToBase64(attestationObject),
        },
        type: cred.type,
      };

      const attestationExpectation = {
        challenge: arrayBufferToBase64(credentials.challenge),
        origin: `${window.location.protocol}//${window.location.host}`,
        factor: 'either' as Factor,
      }

      const regResult = await this.f2l.attestationResult(attestationResponse, attestationExpectation);

    }catch(e){
      console.log(e);
    }
  }

}
