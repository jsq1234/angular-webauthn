import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule, NgForm, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { confirmSignUp } from 'aws-amplify/auth';

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
  userId = '';
  constructor(private router: Router, private activeRoute: ActivatedRoute) {}

  ngOnInit(): void {
    this.activeRoute.queryParams.subscribe((params) => {
      this.userId = params['userId'];
      console.log(this.userId);
    });
  }

  confirmSignup(form: NgForm) {
    if(!form.invalid){
      console.log('Confirming signup');
      const { verificationCode } = form.value;

      confirmSignUp({
        username: this.userId,
        confirmationCode: verificationCode,
      }).then((value) => {
        const { isSignUpComplete, nextStep } = value;
        if(nextStep.signUpStep === 'DONE'){
          console.log('Account confirmed.');
          this.router.navigate(['/signin']);
        }else{
          console.log('Account not confirmed.');
          this.isInvalidCode = true;
        }
      })
    }
  }
}
