import { Injectable } from '@angular/core';
import { User } from '../interfaces/user';
import { convertCOSEtoJwk, parseAuthData, toBase64url } from './utils';
import { fromUint8Array} from 'js-base64';

import CBOR from 'cbor-js';
import { PublicKeyCred } from '../interfaces/public-key-cred';
import base64url from 'base64url';


@Injectable({
  providedIn: 'root',
})
export class WebauthnService {
  constructor() {}

  publicKeyCredential: any;
  clientDataJSON: any;
  attestationObject: any;

  async createCredentials(user: User): Promise<PublicKeyCred> {
    console.log('Calling createCredentials');

    const challenge = crypto.getRandomValues(new Uint8Array(32));

    const cred = (await navigator.credentials.create({
      publicKey: {
        challenge: challenge,
        rp: {
          name: 'Angular WebAuthn',
          id: window.location.hostname,
        },
        pubKeyCredParams: [{ alg: -7, type: 'public-key' }],
        user: {
          id: new TextEncoder().encode(user.username),
          displayName: user.name,
          name: user.username,
        },
        attestation: 'none',
        authenticatorSelection: {
          authenticatorAttachment: 'platform',
          requireResidentKey: false,
          userVerification: 'preferred',
        },
      },
    })) as PublicKeyCredential;

    console.log(cred);

    const authenticatorResponse =
      cred.response as AuthenticatorAttestationResponse;

    const clientDataJSONstr = this.arrayBufferToStr(
      authenticatorResponse.clientDataJSON
    );

    const clientDataJSON = JSON.parse(clientDataJSONstr);

    if (
      clientDataJSON.challenge ===
      base64url.fromBase64(fromUint8Array(challenge))
    ) {
      console.log('Challenge is correct');
    }

    if (clientDataJSON.type === 'webauthn.create') {
      console.log('Type is correct');
    }

    console.log(clientDataJSON);

    this.clientDataJSON = clientDataJSON;

    const attestationObjectBuffer = authenticatorResponse.attestationObject;

    const attestationObject = CBOR.decode(attestationObjectBuffer);

    console.log('attestationObject: ');
    console.log(attestationObject);

    this.attestationObject = attestationObject;

    const authData = authenticatorResponse.getAuthenticatorData();

    console.log('AuthData: ', authData);

    const parsedAuthData = parseAuthData(authData);

    console.log('parsedAuthData: ', parsedAuthData);

    let publicKeyBase64url = undefined;

    if(parsedAuthData.COSEPublicKey){

      console.log('COSEKey(Uint8Array): ', new Uint8Array(parsedAuthData.COSEPublicKey));

      const COSEKeyJSON = CBOR.decode(parsedAuthData.COSEPublicKey);
      const jwkKey = convertCOSEtoJwk(COSEKeyJSON);

      console.log('COSEKey(JSON): ', COSEKeyJSON);
      console.log('JWKKey: ', jwkKey);
      
      publicKeyBase64url = toBase64url(JSON.stringify(jwkKey));
    }

    if(!parsedAuthData.credId){
      throw new Error('Couldn\'t fetch credential ID. Auth data doesn\'t have it');
    }
    const credentialId = parsedAuthData.credId;

    // const credentialIdLength = this.getCredentialIdLength(authData);
    // const credentialId: Uint8Array = authData.slice(
    //   55,
    //   55 + credentialIdLength
    // );

    // console.log('credentialIdLength', credentialIdLength);
    // console.log('credentialId', credentialId);

    // const publicKeyBytes: Uint8Array = authData.slice(55 + credentialIdLength);
    // const publicKeyObject = CBOR.decode(publicKeyBytes.buffer);

    // console.log('publicKeyObject: ');
    // console.log(publicKeyObject);

    // this.publicKeyCredential = publicKeyObject;

    const pubKey = authenticatorResponse.getPublicKey();

    console.log('Algorithm: ', authenticatorResponse.getPublicKeyAlgorithm());
    console.log('Transports: ', authenticatorResponse.getTransports().join(','));

    const pubKeyBase64Url = pubKey ? toBase64url(pubKey) : '';

    return { credentialId, publicKey: publicKeyBase64url ?? '' };
  }

  arrayBufferToStr(buf: ArrayBuffer) {
    return String.fromCharCode(...new Uint8Array(buf));
  }

  getCredentialIdLength(authData: Uint8Array): number {
    // get the length of the credential ID
    const dataView = new DataView(new ArrayBuffer(2));
    const idLenBytes = authData.slice(53, 55);
    idLenBytes.forEach((value, index) => dataView.setUint8(index, value));
    return dataView.getUint16(0);
  }
}
