import { Component, OnInit } from '@angular/core';
import { Router, RouterModule, RouterOutlet } from '@angular/router';
import { SignupComponent } from './components/signup/signup.component';
import { Amplify } from 'aws-amplify';

Amplify.configure({
  Auth: {
    Cognito: {
      userPoolId: 'ap-south-1_56x5jYGm4',
      userPoolClientId: '7lp0md7u0r5ljrct3lvcoctj3d',
      signUpVerificationMethod: 'code',
    },
  },
});


@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent implements OnInit{
  title = 'angular-webauthn';

  constructor(private router: Router){}

  ngOnInit(): void {  
  }
}
