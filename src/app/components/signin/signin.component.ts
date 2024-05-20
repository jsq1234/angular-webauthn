import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CognitoService } from '../../services/cognito.service';
import { CheckboxComponent } from '../common/checkbox/checkbox.component';

@Component({
  selector: 'app-signin',
  standalone: true,
  imports: [FormsModule, CommonModule, RouterLink, CheckboxComponent],
  templateUrl: './signin.component.html',
  styleUrl: './signin.component.css',
})
export class SigninComponent {
  userData = {
    username: '',
    password: '',
  };

  userVerified = false;
  invalidUser = false;
  usePassword = false;
  useBiometric = true;

  constructor(private router: Router, private cognitoService: CognitoService) {}

  showPassword: boolean = false;

  toggleShowPassword(event: MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.showPassword = !this.showPassword;
  }

  navigateToSignUp() {
    this.router.navigate(['/signup']);
  }

  async onSubmit(form: NgForm) {
    if(form.invalid){
      alert('Invalid form');
      return ;
    }
    try {
      const authTokens = await this.cognitoService.signIn(
        this.userData.username,
        this.userData.password,
        this.useBiometric,
        this.usePassword
      );
      console.log('authTokens', authTokens);
      this.userVerified = true;
    } catch (e : any) {
      console.error(e);
      alert(e.message || JSON.stringify(e));
      this.invalidUser = true;
      this.userVerified = false;
    }
  }
}
