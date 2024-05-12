import { Component } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { WebauthnService } from '../../services/webauthn.service';
import { signUp, confirmSignUp } from 'aws-amplify/auth';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { fromUint8Array } from 'js-base64';

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

  constructor(
    private webAuthnService: WebauthnService, 
    private router: Router,
    private formBuilder: FormBuilder) {}

  get email(){
    return this.myForm.controls['email'];
  }

  get username(){
    return this.myForm.controls['username'];
  }

  get password(){
    return this.myForm.controls['password'];
  }

  onSubmit() {
    const { email, password, username } = this.myForm.value;

    const userData = {
      email : email ?? '',
      password: password ?? '',
      username: username ?? '',
    };

    this.webAuthnService
      .createCredentials({
        name: userData.username,
        email: userData.email,
        username: userData.username,
      })
      .then(async (cred) => {

        console.log('Before stringified cred', cred);

        const publicKeyCred = btoa(JSON.stringify(cred));

        console.log('After stringified and btoa\'ed cred: ', publicKeyCred);

        localStorage.setItem('publicKey', cred.publicKey);

        try{
          const { isSignUpComplete, nextStep, userId}  = await signUp({
            username: userData.username,
            password: userData.password,
            options: {
              userAttributes: {
                email: userData.email,
                'custom:publicKeyCred': publicKeyCred,
              },
            },
          });

          if(nextStep.signUpStep === 'CONFIRM_SIGN_UP'){
            this.router.navigate([`/confirm-signup`], { queryParams: { username: userData.username } });
          }
        }catch(e){
          console.log(e);
        }

      });
  }

  navigateToSignIn(){
    this.router.navigate(['/signin']);
  }
}
