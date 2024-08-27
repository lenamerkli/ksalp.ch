import {Component, ViewChild} from '@angular/core';
import {
  AbstractControl,
  FormControl,
  FormsModule,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
  Validators
} from "@angular/forms";
import {MatButton} from "@angular/material/button";
import {MatError, MatFormField, MatHint, MatLabel} from "@angular/material/form-field";
import {MatInput} from "@angular/material/input";
import {Router, RouterLink} from "@angular/router";
import {HttpClient} from "@angular/common/http";
import {merge} from "rxjs";
import {takeUntilDestroyed} from "@angular/core/rxjs-interop";
import {DefaultResponseDto} from "../../type/defaulf-response";
import {MatOption, MatSelect} from "@angular/material/select";
import {MatCheckbox} from "@angular/material/checkbox";
import {zxcvbn} from "@zxcvbn-ts/core";
import {MatDivider} from "@angular/material/divider";
import {Title} from "@angular/platform-browser";

@Component({
  selector: 'app-registrieren',
  standalone: true,
    imports: [
        FormsModule,
        MatButton,
        MatError,
        MatFormField,
        MatInput,
        MatLabel,
        ReactiveFormsModule,
        MatSelect,
        MatOption,
        MatCheckbox,
        RouterLink,
        MatHint,
        MatDivider
    ],
  templateUrl: './registrieren.component.html',
  styleUrl: './registrieren.component.scss'
})
export class RegistrierenComponent {
  @ViewChild('terms') terms!: MatCheckbox;
  @ViewChild('newsletter') newsletter!: MatCheckbox;
  @ViewChild('rating') rating!: MatHint;

  textInputs: string[] = ['name', 'class_', 'grade', 'email', 'password', 'passwordRepeat'];

  name = new FormControl('', [
    Validators.required,
    Validators.pattern(/[A-Z|ÜÖÄ].* [A-Z|ÜÖÄ].*/),
  ]);
  class_ = new FormControl('', [
    Validators.required,
    Validators.pattern(/-|([A-Za-z0-9]+)/),
  ]);
  grade = new FormControl('', [
    Validators.required,
    Validators.pattern(/[1-7]|-/),
  ]);
  email = new FormControl('', [
    Validators.required,
    Validators.email,
    Validators.pattern(/[a-z0-9|_]+@sluz\.ch/),
  ]);
  password = new FormControl('', [
    Validators.required,
    Validators.minLength(8),
  ]);
  passwordRepeat = new FormControl('', [
    Validators.required,
    Validators.minLength(8),
    this.createPasswordRepeatValidator(),
  ]);

  errorMessageName = '';
  errorMessageClass = '';
  errorMessageGrade = '';
  errorMessageEmail = '';
  errorMessagePassword = '';
  errorMessagePasswordRepeat = '';
  errorMessageTerms = '';

  ratingMessage = 'sehr schlecht';

  constructor(
    private router: Router,
    private httpClient: HttpClient,
    private titleService: Title,
  ) {
    this.titleService.setTitle('Registrieren - [ksalp.ch]');
    merge(this.name.statusChanges, this.name.valueChanges)
      .pipe(takeUntilDestroyed())
      .subscribe(() => this.updateErrorMessageName());
    merge(this.class_.statusChanges, this.class_.valueChanges)
      .pipe(takeUntilDestroyed())
      .subscribe(() => this.updateErrorMessageClass());
    merge(this.grade.statusChanges, this.grade.valueChanges)
      .pipe(takeUntilDestroyed())
      .subscribe(() => this.updateErrorMessageGrade());
    merge(this.email.statusChanges, this.email.valueChanges)
      .pipe(takeUntilDestroyed())
      .subscribe(() => this.updateErrorMessageEmail());
    merge(this.password.statusChanges, this.password.valueChanges)
      .pipe(takeUntilDestroyed())
      .subscribe(() => this.updateErrorMessagePassword());
    merge(this.passwordRepeat.statusChanges, this.passwordRepeat.valueChanges)
      .pipe(takeUntilDestroyed())
      .subscribe(() => this.updateErrorMessagePasswordRepeat());
  }

  createPasswordRepeatValidator(): ValidatorFn {
    return (control:AbstractControl) : ValidationErrors | null => {
      const value = control.value;
      const passwordInput = <HTMLInputElement|null>document.getElementById('password')
      const passwordValue = passwordInput?.value;
      if (passwordValue === null){
        return null;
      }
      if (value === passwordValue) {
        return null;
      }
      return {passwordRepeat:true};
    }
  }

  updateErrorMessageName() {
    if (this.name.hasError('required')) {
      this.errorMessageName = 'Sie müssen Ihren Namen angeben.';
    } else if (this.name.hasError('pattern')) {
      this.errorMessageName = 'Bitte geben Sie Ihren Namen so an, wie dieser bei der Schule genutzt wird.';
    } else {
      this.errorMessageName = '';
    }
  }

  updateErrorMessageClass() {
    if (this.class_.hasError('required')) {
      this.errorMessageClass = 'Sie müssen Ihre Klasse angeben oder das Feld mit `-` ausfüllen.';
    } else if (this.class_.hasError('pattern')) {
      this.errorMessageClass = 'Die Klasse und Kursbezeichnungen konnten von unserem System nicht erkannt werden.'
    } else {
      this.errorMessageClass = '';
    }
  }

  updateErrorMessageGrade() {
    if (this.grade.hasError('required')) {
      this.errorMessageGrade = 'Sie müssen Ihre Klassenstufe angeben oder das Feld mit `-` ausfüllen.';
    } else {
      this.errorMessageGrade = '';
    }
  }

  updateErrorMessageEmail() {
    if (this.email.hasError('required')) {
      this.errorMessageEmail = 'Sie müssen Ihre E-Mail angeben.';
    } else if (this.email.hasError('email')) {
      this.errorMessageEmail = 'Dies ist keine valide E-Mail-Adresse.';
    } else {
      this.errorMessageEmail = '';
    }
  }

  updateErrorMessagePassword() {
    console.log(this.password.errors)
    if (this.password.hasError('required')) {
      this.errorMessagePassword = 'Sie müssen ein Passwort festlegen.';
    } else if (this.password.hasError('minlength')) {
      this.errorMessagePassword = 'Ihr Passwort muss mindestens 8 Zeichen lang sein.';
    } else {
      this.errorMessagePassword = '';
    }
  }

  updateErrorMessagePasswordRepeat() {
    if (this.passwordRepeat.hasError('required')) {
      this.errorMessagePasswordRepeat = 'Sie müssen Ihr Passwort wiederholen.';
    } else if (this.password.hasError('minlength')) {
      this.errorMessagePasswordRepeat = 'Ihr Passwort muss mindestens 8 Zeichen lang sein.';
    } else if (this.password.hasError('passwordRepeat') || this.password.hasError('passwordRepeat'.toLowerCase())) {
      this.errorMessagePasswordRepeat = 'Die Passwärter unterscheiden sich.';
    } else {
      this.errorMessagePasswordRepeat = '';
    }
  }

  updateErrorMessageTerms() {
    console.log(this.terms)
    if (!(this.terms && this.terms.checked)){
      this.errorMessageTerms = 'Sie müssen die Nutzungsbedingungen akzeptieren.';
    } else {
      this.errorMessageTerms = '';
    }
  }

  updateRating() {
    let inputs = this.getUserInputs();
    let input: string[] = [];
    for(let i=0; i<this.textInputs.length; i++){
      if(!this.textInputs[i].includes('password')){
        input.push(inputs[this.textInputs[i]]);
      }
    }
    let value = zxcvbn(inputs['password'], input).guessesLog10;
    if (value < 5) {
      this.ratingMessage = 'sehr schlecht';
    } else if (value < 10) {
      this.ratingMessage = 'schlecht';
    } else if (value < 15) {
      this.ratingMessage = 'akzeptabel';
    } else if (value >= 15) {
      this.ratingMessage = 'sicher';
    } else {
      this.ratingMessage = '';
    }
  }

  getUserInputs() {
    let values: {[key: string]: string} = {
      name: '',
      class_: '',
      grade: '',
      email: '',
      password: '',
      passwordRepeat: '',
    }
    for (let i = 0; i < this.textInputs.length; i++) {
      let value = (<HTMLInputElement|null>document.getElementById(this.textInputs[i]))?.value;
      if (value) {
        values[this.textInputs[i]] = String(value);
      }
    }
    return values;
  }

  continue(){
    if(
      !this.name.invalid &&
      !this.class_.invalid &&
      !this.grade.invalid &&
      !this.email.invalid &&
      !this.password.invalid &&
      !this.passwordRepeat.invalid &&
      this.terms.checked
    ) {
      this.httpClient.post<DefaultResponseDto>('/api/v1/account/register', JSON.stringify({
        name: this.name.value,
        class_: this.class_.value,
        grade: this.grade.value,
        email: this.email.value,
        password: this.password.value,
        newsletter: this.newsletter.checked,
      }), {headers: {'Content-Type': 'application/json'}}).subscribe({
        next: response => {
          if (response.status && response.status === 'success') {
            this.router.navigate(['/registrieren/weiter']).then();
          } else {
            alert(response.message);
          }
        },
        error: error => {
          console.log(error);
          if (error.message){
            alert(error.message);
          } else {
            alert(error);
          }
        }
      });
    } else {
      this.name.markAllAsTouched();
      this.updateErrorMessageName();
      this.class_.markAllAsTouched();
      this.updateErrorMessageClass();
      this.grade.markAllAsTouched();
      this.updateErrorMessageGrade();
      this.email.markAllAsTouched();
      this.updateErrorMessageEmail();
      this.password.markAllAsTouched();
      this.updateErrorMessagePassword();
      this.passwordRepeat.markAllAsTouched();
      this.updateErrorMessagePasswordRepeat();
      this.updateErrorMessageTerms();
    }
  }
}
