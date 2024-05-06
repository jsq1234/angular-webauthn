import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { WebauthnService } from '../../services/webauthn.service';
import {
  CognitoUserPool,
  CognitoUserAttribute,
} from 'amazon-cognito-identity-js';

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

  userPool = new CognitoUserPool({
    UserPoolId: 'ap-south-1_56x5jYGm4',
    ClientId: '7lp0md7u0r5ljrct3lvcoctj3d',
  });

  constructor(private webAuthnService: WebauthnService) {}

  onSubmit() {
    this.webAuthnService
      .createCredentials({
        name: this.userData.username,
        email: this.userData.email,
        username: this.userData.username,
      })
      .then((cred) => {
        const publicKeyCred = btoa(JSON.stringify(cred));

        var attributeList = [];
        var dataEmail = { Name: 'email', Value: this.userData.email };
        var dataName = { Name: 'name', Value: this.userData.username };
        var dataPublicKeyCred = {
          Name: 'custom:publicKeyCred',
          Value: publicKeyCred,
        };

        var attributeEmail = new CognitoUserAttribute(dataEmail);

        var attributePublicKeyCred = new CognitoUserAttribute(
          dataPublicKeyCred 
        );

        var attributeName = new CognitoUserAttribute(dataName);

        attributeList.push(attributeEmail);
        attributeList.push(attributePublicKeyCred);
        attributeList.push(attributeName);

        this.userPool.signUp(
          this.userData.username,
          this.userData.password,
          attributeList,
          [],
          function (err, result) {
            if (err) {
              console.log(err);
            } else {
              console.log(result);
            }
          }
        );
      });
  }
}
