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
  username = '';
  constructor(private router: Router, private activeRoute: ActivatedRoute) {}

  ngOnInit(): void {
    this.activeRoute.queryParams.subscribe((params) => {
      this.username = params['username'];
      console.log(this.username);
    });
  }

  confirmSignup(form: NgForm) {
    if(!form.invalid){
      console.log('Confirming signup');
      const { verificationCode } = form.value;

      confirmSignUp({
        username: this.username,
        confirmationCode: verificationCode,
      }).then((value) => {
        const { nextStep } = value;
        if(nextStep.signUpStep === 'DONE'){
          console.log('Account confirmed.');
          this.router.navigate(['/signin']);
        }else{
          console.log('Account not confirmed.');
          this.isInvalidCode = true;
        }
      }).catch((e) => {
        console.log('Error confirming signup.');
        console.log(e.message);
        this.isInvalidCode = true;
      })
    }
  }
}
