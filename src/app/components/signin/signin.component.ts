import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink, RouterModule } from '@angular/router';
import { toUint8Array, fromUint8Array } from 'js-base64';
import { signIn, confirmSignIn, } from 'aws-amplify/auth';
import { CognitoService } from '../../services/cognito.service';
import { CustomCheckoutComponent } from '../common/custom-checkout/custom-checkout.component';

@Component({
  selector: 'app-signin',
  standalone: true,
  imports: [FormsModule, CommonModule, RouterLink, CustomCheckoutComponent],
  templateUrl: './signin.component.html',
  styleUrl: './signin.component.css',
})
export class SigninComponent {
  userData = {
    username: '',
    password: ''
  };

  userVerified = false;
  invalidUser = false;
  usePassword = false;
  useBiometric = true;

  constructor(private router: Router, private cognitoService: CognitoService) {}

  navigateToSignUp() {
    this.router.navigate(['/signup']);
  }

  addPasswordField(){
  }


  async onSubmit() {
    try{
      const authTokens = await this.cognitoService.signIn(this.userData.username, this.userData.password, this.useBiometric, this.usePassword);
      console.log('authTokens', authTokens);
      this.userVerified = true;
    }catch(e){
      console.log(e);
      this.invalidUser = true;
      this.userVerified = false;
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
