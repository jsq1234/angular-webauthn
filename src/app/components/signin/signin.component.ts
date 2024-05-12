import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink, RouterModule } from '@angular/router';
import { toUint8Array, fromUint8Array } from 'js-base64';
import { signIn, confirmSignIn, } from 'aws-amplify/auth';

@Component({
  selector: 'app-signin',
  standalone: true,
  imports: [FormsModule, CommonModule, RouterLink],
  templateUrl: './signin.component.html',
  styleUrl: './signin.component.css',
})
export class SigninComponent {
  userData = {
    username: '',
  };

  userVerified = false;

  constructor(private router: Router) {}

  navigateToSignUp() {
    this.router.navigate(['/signup']);
  }

  async onSubmit() {
    // navigator.credentials
    //   .get({
    //     publicKey: {
    //       challenge: new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8]),
    //       userVerification: 'required',
    //       rpId: window.location.hostname,
    //       allowCredentials: [
    //         {
    //           id: toUint8Array(localStorage.getItem('credentialId') ?? ''),
    //           type: 'public-key',
    //         },
    //       ],
    //     },
    //   })
    //   .then((assertion) => {
    //     console.log('Got assertion', assertion);
    //     const response = (assertion as any)
    //       .response as AuthenticatorAssertionResponse;

    //     console.log('Response', response);

    //     const clientData = JSON.parse(
    //       new TextDecoder().decode(response.clientDataJSON)
    //     );
    //     const authenticatorData = new Uint8Array(response.authenticatorData);
    //     const signature = new Uint8Array(response.signature);
    //     const userHandle = new Uint8Array(
    //       response.userHandle ?? new Uint8Array(0)
    //     );

    //     console.log('Client Data', clientData);
    //     console.log('Authenticator Data', authenticatorData);
    //     console.log('Signature', signature);
    //     console.log('User Handle', userHandle);

    //     this.verifyAssertion(response).then((result) => {
    //       this.userVerified = result;
    //     });
    //   });

    const { isSignedIn, nextStep } = await signIn({
      username: this.userData.username,
      options: {
        authFlowType: 'CUSTOM_WITHOUT_SRP',
      },
    });

    if(!isSignedIn && nextStep.signInStep === "CONFIRM_SIGN_IN_WITH_CUSTOM_CHALLENGE"){
      console.log('custom!');
    }
  }

  async verifyAssertion(assertion: AuthenticatorAssertionResponse) {
    const signature = assertion.signature;
    const rawAuthnrData = assertion.authenticatorData;
    const rawClientData = assertion.clientDataJSON;

    const clientDataHash = await crypto.subtle.digest('SHA-256', rawClientData);

    const dataToVerify = new Uint8Array(
      rawAuthnrData.byteLength + clientDataHash.byteLength
    );
    dataToVerify.set(new Uint8Array(rawAuthnrData), 0);
    dataToVerify.set(new Uint8Array(clientDataHash), rawAuthnrData.byteLength);

    console.log('dataToVerify', fromUint8Array(dataToVerify));

    try {
      const publicKey = await crypto.subtle.importKey(
        'spki',
        toUint8Array(localStorage.getItem('publicKey') ?? ''),
        {
          name: 'ECDSA',
          namedCurve: 'P-256',
          hash: { name: 'SHA-256' },
        },
        false,
        ['verify']
      );
      console.log('publicKey(spki)', publicKey);

      const result = await crypto.subtle.verify(
        {
          name: 'ECDSA',
          hash: { name: 'SHA-256' },
        },
        publicKey,
        this.convertASN1toRaw(signature),
        dataToVerify
      );

      if (result) {
        console.log('Signature is valid');
      } else {
        console.log('Signature is invalid');
      }
      return result;
    } catch (e) {
      console.log(e);
      return false;
    }
  }

  convertASN1toRaw(signatureBuffer: ArrayBuffer) {
    // Convert signature from ASN.1 sequence to "raw" format

    const usignature = new Uint8Array(signatureBuffer);

    const rStart = usignature[4] === 0 ? 5 : 4;

    const rEnd = rStart + 32;

    const sStart = usignature[rEnd + 2] === 0 ? rEnd + 3 : rEnd + 2;

    const r = usignature.slice(rStart, rEnd);

    const s = usignature.slice(sStart);

    return new Uint8Array([...r, ...s]);
  }
}
