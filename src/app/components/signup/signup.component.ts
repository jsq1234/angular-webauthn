import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { WebauthnService } from '../../services/webauthn.service';
import { signUp } from 'aws-amplify/auth';

@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './signup.component.html',
  styleUrl: './signup.component.css',
})
export class SignupComponent {
  userData = {
    username: '',
    email: '',
    password: '',
  };

  constructor(private webAuthnService: WebauthnService) {}

  onSubmit() {
    this.webAuthnService
      .createCredentials({
        name: this.userData.username,
        email: this.userData.email,
        username: this.userData.username,
      })
      .then(async (cred) => {
        const publicKeyCred = btoa(JSON.stringify(cred));

        console.log(publicKeyCred);

        try{
          const { isSignUpComplete, nextStep, userId}  = await signUp({
            username: this.userData.username,
            password: this.userData.password,
            options: {
              userAttributes: {
                email: this.userData.email,
                'custom:publicKeyCred': publicKeyCred,
              },
            },
          });

          console.log(isSignUpComplete);
          console.log(nextStep);
          console.log(userId);
        }catch(e){
          console.log(e);
        }

      });
  }
}
