import { Injectable } from '@angular/core';
import { User } from '../interfaces/user';
import {
  convertCOSEtoJwk,
  parseAuthData,
  parseBase64url,
  toBase64url,
} from './utils';
import { fromUint8Array } from 'js-base64';

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

    /*
      The attestationObject is a CBOR encoded object which contains the following fields:
      - authData: Authenticator data
      - fmt: The attestation statement format
      - attStmt: The attestation statement
    */

    const attestationObject = CBOR.decode(attestationObjectBuffer);

    console.log(attestationObject);

    /*
      Authenticator data is a byte array which contains the following fields:
      - RP ID hash: The hash of the RP ID
      - Flags: Flags that are set in the authenticator
      - Signature counter: The signature counter
      - AAGUID: The AAGUID
      - Credential ID: The credential ID
      - COSE public key: The COSE public key
      Visit https://www.w3.org/TR/webauthn-2/#sctn-attestation for more details.
    */
    const authData = authenticatorResponse.getAuthenticatorData();

    const parsedAuthData = parseAuthData(authData);

    console.log('parsedAuthData: ', parsedAuthData);

    let publicKeyBase64url = undefined;

    /* 
      In authData which is present in the attestation object, there is a COSEPublicKey field (77 bytes)
      on which we can call the CBOR.decode method to get the public key in COSE format.
      We can then convert this COSE format to JWK format using the convertCOSEtoJwk method.
      COSE is converted to JWK so that it can be used in crypto.subtle.importKeys
      which is used to import keys that are encoded in JWK format.
    */
    if (parsedAuthData.COSEPublicKey) {
      const COSEKeyJSON = CBOR.decode(parsedAuthData.COSEPublicKey);
      const jwkKey = convertCOSEtoJwk(COSEKeyJSON);

      console.log('jwkKey: ', jwkKey);
      publicKeyBase64url = toBase64url(JSON.stringify(jwkKey));
    }

    if (!parsedAuthData.credId) {
      throw new Error(
        "Couldn't fetch credential ID. Auth data doesn't have it"
      );
    }

    const credentialId = parsedAuthData.credId;

    /* 
      The credentialId is the credential ID of the newly created credential.
      This credential ID + Public Key will be stored in custom attribute in Cognito.
      The credentialID will be sent back to the client during authentication
      which will be used inside allowCredentials in the navigator.credentials.get method.
    */
    return { credentialId, publicKey: publicKeyBase64url ?? '' };
  }

  async getCredentials(credentialId: any, challenge: any) {
    /*
      challenge here is a randomBytes string sent from CreateAuthChallenge Lambda trigger.
      This challenge prevents replay attacks.
      https://www.w3.org/TR/webauthn-2/#dictionary-assertion-options
    */
    const publicKeyOptions: PublicKeyCredentialRequestOptions = {
      challenge: window.Buffer.from(challenge, 'hex'),
      timeout: 1800000,
      rpId: window.location.hostname,
      userVerification: 'preferred',
      allowCredentials: [
        {
          id: parseBase64url(credentialId),
          type: 'public-key',
          transports: ['internal'],
        },
      ],
    };

    /*
      Get the credentials from the authenticator.
      This will prompt the user to use their biometric. 
    */
    const credentials = (await navigator.credentials.get({
      publicKey: publicKeyOptions,
    })) as PublicKeyCredential;

    const response = credentials.response as AuthenticatorAssertionResponse;

    const challengeAnswer = {
      response: {},
    };

    console.log(
      'clientDataJSON',
      JSON.parse(new TextDecoder().decode(response.clientDataJSON))
    );

    /*
      clientDataJSON, authenticatorData and signature will be used to 
      verify the authentication in VerifyAuthChallenge Lambda trigger.
      The concatenation of authenticatorData + hash-sha256(clientDataJSON)
      will be used to verify the signature using the public key stored in Cognito.
    */
    const clientDataJSON = new Uint8Array(response.clientDataJSON);
    const authenticatorData = new Uint8Array(response.authenticatorData);
    const signature = new Uint8Array(response.signature);
    const userHandle = new Uint8Array(response.userHandle ?? new Uint8Array(0));

    if (response) {
      challengeAnswer.response = {
        clientDataJSON: fromUint8Array(clientDataJSON, true),
        authenticatorData: fromUint8Array(authenticatorData, true),
        signature: fromUint8Array(signature, true),
        userHandle: fromUint8Array(userHandle, true),
      };
    }

    return challengeAnswer;
  }

  arrayBufferToStr(buf: ArrayBuffer) {
    return String.fromCharCode(...new Uint8Array(buf));
  }
}
