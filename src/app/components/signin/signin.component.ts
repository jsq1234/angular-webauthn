import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink, RouterModule } from '@angular/router';

@Component({
  selector: 'app-signin',
  standalone: true,
  imports: [FormsModule, CommonModule, RouterLink],
  templateUrl: './signin.component.html',
  styleUrl: './signin.component.css'
})
export class SigninComponent {
  userData = {
    username: ''
  }
  clientData : any = '';
  authenticatorData : any = '';
  signature : any = '';
  userHandle : any = '';

  constructor(private router: Router) {}

  navigateToSignUp(){
    this.router.navigate(['/signup']);
  }

  async onSubmit(){
    navigator.credentials.get({
      publicKey: {
        challenge: new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8]),
        userVerification: 'required',
      }
    }).then((assertion) => {
      console.log('Got assertion', assertion);
      const response = (assertion as any).response;
      console.log('Response', response);
      const clientData = JSON.parse(new TextDecoder().decode(response.clientDataJSON));
      const authenticatorData = new Uint8Array(response.authenticatorData);
      const signature = new Uint8Array(response.signature);
      const userHandle = new Uint8Array(response.userHandle);
      this.authenticatorData = authenticatorData;
      this.clientData = JSON.stringify(clientData);
      this.signature = signature;
      this.userHandle = userHandle;
      console.log('Client Data', clientData);
      console.log('Authenticator Data', authenticatorData);
      console.log('Signature', signature);
      console.log('User Handle', userHandle);
    })
  }
}
