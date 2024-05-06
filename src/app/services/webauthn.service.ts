import { Injectable } from '@angular/core';
import { User } from '../interfaces/user';
import { Fido2Lib } from 'fido2-lib';
import { coerceToArrayBuffer } from './utils';
import { fromUint8Array, toBase64 } from 'js-base64';

@Injectable({
  providedIn: 'root',
})
export class WebauthnService {
  f2l: Fido2Lib = new Fido2Lib({
    timeout: 30 * 1000 * 60,
    rpName: 'WebAuthn with Cognito',
    challengeSize: 32,
    cryptoParams: [-7],
  });

  globalRegisteredCredentialsJSON: { credId: any, publicKey: any } | undefined;

  globalRegisteredCredentials: string | undefined;

  constructor() {}

  async createCredentials(user: User) {
    try {
      const attestationOptions = await this.f2l.attestationOptions();

      attestationOptions.user = {
        displayName: user.name,
        id: coerceToArrayBuffer(user.username, 'username'),
        name: user.username,
      };

      attestationOptions.pubKeyCredParams = [];

      const params = [-7, -257];
      for (let param of params) {
        attestationOptions.pubKeyCredParams.push({
          type: 'public-key',
          alg: param,
        });
      }

      attestationOptions.authenticatorSelection = {
        authenticatorAttachment: 'platform',
        userVerification: 'preferred',
        requireResidentKey: false,
      };

      let challenge = coerceToArrayBuffer(toBase64(user.username), 'challenge');
      attestationOptions.challenge = challenge;

      const cred = (await navigator.credentials.create({
        publicKey: attestationOptions,
      })) as PublicKeyCredential;

      const credentials = {
        id: coerceToArrayBuffer(cred.id, 'credentials_id'),
        rawId: cred.rawId,
        type: cred.type,
        challenge: challenge,
        response: {
          clientDataJSON: fromUint8Array(
            new Uint8Array(
              (cred.response as AuthenticatorAttestationResponse).clientDataJSON
            )
          ),
          attestationObject: fromUint8Array(
            new Uint8Array(
              (
                cred.response as AuthenticatorAttestationResponse
              ).attestationObject
            )
          ),
        },
      };

      const attestationResult = await this.f2l.attestationResult(credentials, {
        challenge: fromUint8Array(new Uint8Array(challenge)),
        origin: `${window.location.protocol}://${window.location.origin}`,
        factor: 'either',
      });

      console.log(attestationResult);

      this.globalRegisteredCredentialsJSON = {
        credId: attestationResult.authnrData.get('credId'),
        publicKey: attestationResult.authnrData.get('credentialPublicKeyPem'),
      };

      this.globalRegisteredCredentials = JSON.stringify(this.globalRegisteredCredentialsJSON);

      console.log(this.globalRegisteredCredentialsJSON);
      console.log(this.globalRegisteredCredentials);

    } catch (e: any) {
      console.error(e);
    }
  }
}
