import { Component } from '@angular/core';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { WebauthnService } from '../../services/webauthn.service';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { CognitoService } from '../../services/cognito.service';
import { passwordValidator } from './validators';

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
    password: ['', [Validators.required, passwordValidator()]],
  });
  
  showPassword: boolean = false;

  toggleShowPassword(event: MouseEvent){
    event.preventDefault();
    event.stopPropagation();
    this.showPassword = !this.showPassword;
  }

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

  onChange(){
    console.log(this.password.errors);
  }

  
  async onSubmit() {
    if(this.myForm.invalid){
      alert('Invalid form');
      return ;
    }

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

    /* No need to store these, this is only for convenience. */
    localStorage.setItem('PublicKey', publicKeyCred.publicKey);
    localStorage.setItem('CredentialId', publicKeyCred.credentialId);

    const cognitoUser = await this.cognitoService.signUp(
      { name: userData.username, ...userData },
      publicKeyCred
    );

    if (cognitoUser) {
      console.log('User signed up successfully.');
      this.router.navigate(['/confirm-signup'], {
        queryParams: { username: userData.username },
      });
    }

  }

  navigateToSignIn() {
    this.router.navigate(['/signin']);
  }
}
