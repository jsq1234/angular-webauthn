import { Component } from '@angular/core';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { WebauthnService } from '../../services/webauthn.service';
import { signUp, confirmSignUp } from 'aws-amplify/auth';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { fromUint8Array, toBase64 } from 'js-base64';
import { CognitoService } from '../../services/cognito.service';
import { parseBase64url, toBase64url } from '../../services/utils';

@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [RouterLink, ReactiveFormsModule, CommonModule],
  templateUrl: './signup.component.html',
  styleUrl: './signup.component.css',
})
export class SignupComponent {
  myForm = this.formBuilder.group({
    username: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
  });

  clientDataJSON: any = '';
  publicKeyCredential: any = '';

  constructor(
    private webAuthnService: WebauthnService,
    private router: Router,
    private formBuilder: FormBuilder,
    private cognitoService: CognitoService
  ) {}

  get email() {
    return this.myForm.controls['email'];
  }

  get username() {
    return this.myForm.controls['username'];
  }

  get password() {
    return this.myForm.controls['password'];
  }

  async onSubmit() {
    const { email, password, username } = this.myForm.value;

    const userData = {
      email: email ?? '',
      password: password ?? '',
      username: username ?? '',
    };

    const publicKeyCred = await this.webAuthnService.createCredentials({
      name: userData.username,
      ...userData,
    });

    console.log('Before stringified publicKeyCred', publicKeyCred);

    localStorage.setItem('PublicKey', publicKeyCred.publicKey);
    localStorage.setItem('CredentialId', publicKeyCred.credentialId);

    const cognitoUser = await this.cognitoService.signUp(
      { name: userData.username, ...userData },
      publicKeyCred
    );

    if (cognitoUser) {
      console.log('User signed up successfully.');
      console.log('Username: ', cognitoUser.getUsername());
      this.router.navigate(['/confirm-signup'], {
        queryParams: { username: userData.username },
      });
    }

  }

  navigateToSignIn() {
    this.router.navigate(['/signin']);
  }
}
