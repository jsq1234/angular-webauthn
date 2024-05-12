import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule, NgForm, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { confirmSignUp } from 'aws-amplify/auth';
import { CognitoService } from '../../services/cognito.service';

@Component({
  selector: 'app-confirm-signup',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './confirm-signup.component.html',
  styleUrl: './confirm-signup.component.css',
})
export class ConfirmSignupComponent implements OnInit {
  isInvalidCode = false;
  verificationCode = '';
  username = '';
  constructor(private router: Router, 
    private activeRoute: ActivatedRoute,
    private cognitoService: CognitoService) {}

  ngOnInit(): void {
    this.activeRoute.queryParams.subscribe((params) => {
      this.username = params['username'];
    });
  }

  async confirmSignup(form: NgForm) {
    if(!form.invalid){
      console.log('Confirming signup');
      const { verificationCode } = form.value;
      const confirmed = await this.cognitoService.confirmSignUp(this.username, verificationCode);
      if(confirmed){
        console.log('User confirmed!');
        this.router.navigate(['/signin']);
      }
    }
  }
}
