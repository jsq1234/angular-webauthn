import { AbstractControl, ValidatorFn } from '@angular/forms';

export function passwordValidator(): ValidatorFn {
  return (control: AbstractControl): { [key: string]: any } | null => {
    const password = control.value;

    // Regular expressions to check for at least one lowercase, one uppercase,
    // one special character, and one number
    const lowerCaseRegex = /[a-z]/;
    const upperCaseRegex = /[A-Z]/;
    const specialCharacterRegex = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/;
    const numberRegex = /[0-9]/;

    // Check if the password meets all criteria
    const hasLowerCase = lowerCaseRegex.test(password);
    const hasUpperCase = upperCaseRegex.test(password);
    const hasSpecialCharacter = specialCharacterRegex.test(password);
    const hasNumber = numberRegex.test(password);
    const sufficientLength = password.length >= 8;

       // Create an errors object
       const errors: any = {};

       // Add keys to the errors object for each requirement that is not met
       if (!hasLowerCase) {
         errors['hasLowerCase'] = true;
       }
       if (!hasUpperCase) {
         errors['hasUpperCase'] = true;
       }
       if (!hasSpecialCharacter) {
         errors['hasSpecialCharacter'] = true;
       }
       if (!hasNumber) {
         errors['hasNumber'] = true;
       }
       if (!sufficientLength) {
         errors['sufficientLength'] = true;
       }
   
       // If there are any errors, return the errors object
       // Otherwise, return null (no error)
       return Object.keys(errors).length > 0 ? errors : null;
  };
}
