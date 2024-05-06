import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthServiceService } from '../../services/auth-service.service';

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

  constructor(private authService: AuthServiceService){}

  onSubmit(){
    console.log(this.userData);
    this.authService.createCredentials(this.userData.username, this.userData.password, this.userData.email, this.userData.username);
  }
}
