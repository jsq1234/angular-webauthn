import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { WebauthnService } from '../../services/webauthn.service';

@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './signup.component.html',
  styleUrl: './signup.component.css'
})
export class SignupComponent {
  userData = {
    username: '',
    email: '',
    password: ''
  };

  constructor(private webAuthnService: WebauthnService){}

  onSubmit(){
    console.log(this.userData);
    
  }
}
