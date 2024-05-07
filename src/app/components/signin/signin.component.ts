import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  selector: 'app-signin',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './signin.component.html',
  styleUrl: './signin.component.css'
})
export class SigninComponent {
  userData = {
    username: ''
  }

  constructor(private router: Router) {}

  navigateToSignUp(){
    this.router.navigate(['/signup']);
  }

  onSubmit(){
    
  }
}
