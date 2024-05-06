import { Injectable } from '@angular/core';
import { User } from '../interfaces/user';
//import { Fido2Lib } from 'fido2-lib';
import { coerceToArrayBuffer } from './utils';
import { fromUint8Array, toBase64 } from 'js-base64';

import CBOR from 'cbor-js';

@Injectable({
  providedIn: 'root',
})
export class WebauthnService {
  constructor() {}

  async createCredentials(user: User) {
    console.log("Calling createCredentials");

    const cred = (await navigator.credentials.create({
      publicKey: {
        challenge: coerceToArrayBuffer(
          crypto.getRandomValues(new Uint8Array(32)),
          'challenge'
        ),
        rp: {
          name: 'Angular WebAuthn',
        },
        pubKeyCredParams: [
          { alg: -7, type: 'public-key' },
          { alg: -257, type: 'public-key' },
        ],
        user: {
          id: coerceToArrayBuffer(user.username, 'user_id'),
          displayName: user.name,
          name: user.username,
        },
        attestation: 'direct',
        authenticatorSelection: {
          authenticatorAttachment: 'platform',
          requireResidentKey: false,
          userVerification: 'preferred',
        },
      },
    })) as PublicKeyCredential;

    console.log(cred);

    const authenticatorResponse = cred.response as AuthenticatorAttestationResponse;

    const clientDataJSONstr = this.arrayBufferToStr(
      authenticatorResponse.clientDataJSON
    );

    const clientDataJSON = JSON.parse(clientDataJSONstr);

    console.log(clientDataJSON);

    const attestationObjectBuffer = authenticatorResponse.attestationObject;

    const attestationObject = CBOR.decode(attestationObjectBuffer);

    console.log("attestationObject: ");
    console.log(attestationObject);

    const authData = CBOR.decode(attestationObject.authData.buffer);
    
    console.log(attestationObject.authData);
    console.log(attestationObject.authData.buffer);
    
    console.log("AuthData");
    console.log(authData);
  }

  arrayBufferToStr(buf: ArrayBuffer) {
    return String.fromCharCode(...new Uint8Array(buf));
  }
}
