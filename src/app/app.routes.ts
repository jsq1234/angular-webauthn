import { Routes } from '@angular/router';
import { SignupComponent } from './components/signup/signup.component';
import { SigninComponent } from './components/signin/signin.component';
import { ConfirmSignupComponent } from './components/confirm-signup/confirm-signup.component';
import { HomeComponent } from './components/home/home.component';

export const routes: Routes = [
    { path: '', redirectTo: 'signup', pathMatch: 'full'},
    {
        path: 'signup',
        component: SignupComponent,
    },
    {
        path: 'signin',
        component: SigninComponent,
    },
    {
        path: 'confirm-signup',
        component: ConfirmSignupComponent
    },
    {
        path: 'home',
        component: HomeComponent
    }
];
