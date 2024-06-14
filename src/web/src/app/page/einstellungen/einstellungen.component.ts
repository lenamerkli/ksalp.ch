import {Component, OnInit, ViewChild} from '@angular/core';
import {AccountService} from "../../service/account.service";
import {Account} from "../../type/account";
import {MatAnchor, MatButton} from "@angular/material/button";
import {Router, RouterLink} from "@angular/router";
import {ConstantService} from "../../service/constant.service";
import {MatDivider} from "@angular/material/divider";
import {MatError, MatFormField, MatHint, MatLabel} from "@angular/material/form-field";
import {MatInput} from "@angular/material/input";
import {
  AbstractControl,
  FormControl,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
  Validators
} from "@angular/forms";
import {MatOption, MatSelect} from "@angular/material/select";
import {MatIcon} from "@angular/material/icon";
import {HttpClient} from "@angular/common/http";
import {DefaultResponseDto} from "../../type/defaulf-response";
import {zxcvbn} from "@zxcvbn-ts/core";
import {merge} from "rxjs";
import {takeUntilDestroyed} from "@angular/core/rxjs-interop";
import {AbmeldenComponent} from "../abmelden/abmelden.component";

@Component({
  selector: 'app-einstellungen',
  standalone: true,
  imports: [
    MatAnchor,
    RouterLink,
    MatDivider,
    MatButton,
    MatFormField,
    MatError,
    MatInput,
    MatLabel,
    MatHint,
    MatSelect,
    MatOption,
    MatIcon,
    ReactiveFormsModule
  ],
  templateUrl: './einstellungen.component.html',
  styleUrl: './einstellungen.component.scss'
})
export class EinstellungenComponent implements OnInit{
  @ViewChild('premium') premium!: HTMLElement;
  @ViewChild('farbschema') farbschema!: HTMLElement;
  @ViewChild('klassen') klassen!: HTMLElement;
  @ViewChild('klassenstufe') klassenstufe!: HTMLElement;
  @ViewChild('suchmaschine') suchmaschine!: HTMLElement;
  @ViewChild('iframes') iframes!: HTMLElement;
  @ViewChild('passwort') passwort!: HTMLElement;
  @ViewChild('benachrichtigungen') benachrichtigungen!: HTMLElement;

  @ViewChild('rating') rating!: MatHint;

  textInputs: string[] = ['class_', 'grade', 'email', 'oldPassword', 'password', 'passwordRepeat'];

  class_ = new FormControl('', [
    Validators.required,
    Validators.pattern(/-|([A-Za-z0-9]+)/),
  ]);
  grade = new FormControl('', [
    Validators.required,
    Validators.pattern(/[1-7]|-/),
  ]);
  oldPassword = new FormControl('', [
    Validators.required,
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
  theme = new FormControl('', [
    Validators.required,
  ])
  searchEngine = new FormControl('', [
    Validators.required,
  ]);
  favoriteWebsites = new FormControl('', [
    Validators.pattern(/^(?:https?:\/\/|www\.)?[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}(?:\/[^\s|]*)?\s*\|\s*[^\r\n]*(?:\r?\n(?:https?:\/\/|www\.)?[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}(?:\/[^\s|]*)?\s*\|\s*[^\r\n]*)*$/),
  ])

  errorMessageClass = '';
  errorMessageGrade = '';
  errorMessageOldPassword = '';
  errorMessagePassword = '';
  errorMessagePasswordRepeat = '';
  errorMessageFavoriteWebsites = '';

  ratingMessage = 'sehr schlecht';

  public account: Account | null = null;
  public themes: {[key: string]: string} = {'light': 'Hell'};
  public grades: string[] = [];
  public searchEngines: {[key: string]: {url: string; recommended: boolean}} = {};

  constructor(
    private accountService: AccountService,
    private constantService: ConstantService,
    private httpClient: HttpClient,
    private router: Router,
  ) {
    this.accountService.getAccountInfo().subscribe((value: Account | null) => {
      this.account = value;
      this.setDefaults();
    });
    this.constantService.getThemes().subscribe((value: {[key: string]: string}) => {
      this.themes = value;
    });
    this.constantService.getGrades().subscribe((value: string[]) => {
      this.grades = value;
    });
    this.constantService.getSearchEngines().subscribe((value: {[key: string]: {url: string; recommended: boolean}}) => {
      this.searchEngines = value;
    });
    merge(this.class_.statusChanges, this.class_.valueChanges)
      .pipe(takeUntilDestroyed())
      .subscribe(() => this.updateErrorMessageClass());
    merge(this.grade.statusChanges, this.grade.valueChanges)
      .pipe(takeUntilDestroyed())
      .subscribe(() => this.updateErrorMessageGrade());
    merge(this.oldPassword.statusChanges, this.oldPassword.valueChanges)
      .pipe(takeUntilDestroyed())
      .subscribe(() => this.updateErrorMessageOldPassword());
    merge(this.password.statusChanges, this.password.valueChanges)
      .pipe(takeUntilDestroyed())
      .subscribe(() => this.updateErrorMessagePassword());
    merge(this.passwordRepeat.statusChanges, this.passwordRepeat.valueChanges)
      .pipe(takeUntilDestroyed())
      .subscribe(() => this.updateErrorMessagePasswordRepeat());
    merge(this.favoriteWebsites.statusChanges, this.favoriteWebsites.valueChanges)
      .pipe(takeUntilDestroyed())
      .subscribe(() => this.updateErrorMessageFavoriteWebsites());
  }

  ngOnInit() {
    this.setDefaults();
  }

  setDefaults(): void {
    if(this.account !== null) {
      this.theme.setValue(this.account.getTheme());
      this.class_.setValue(this.account.getClasses().join(' '));
      this.grade.setValue(this.account.getGrade());
      this.searchEngine.setValue(this.account.getSearch());
      this.favoriteWebsites.setValue(this.account.getFavorites().join('\n'));
    }
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

  scrollToElement($element: any): void {
    console.log($element);
    $element.scrollIntoView({behavior: "smooth", block: "start", inline: "nearest"});
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

  updateErrorMessageOldPassword() {
    if (this.oldPassword.hasError('required')) {
      this.errorMessageOldPassword = 'Sie müssen Ihr altes Passwort angeben.';
    } else {
      this.errorMessageOldPassword = '';
    }
  }

  updateErrorMessagePassword() {
    console.log(this.password.errors)
    if (this.password.hasError('required')) {
      this.errorMessagePassword = 'Sie müssen ein Passwort festlegen.';
    } else if (this.password.hasError('minlength')) {
      this.errorMessagePassword = 'Ihr neues Passwort muss mindestens 8 Zeichen lang sein.';
    } else {
      this.errorMessagePassword = '';
    }
  }

  updateErrorMessagePasswordRepeat() {
    if (this.passwordRepeat.hasError('required')) {
      this.errorMessagePasswordRepeat = 'Sie müssen Ihr neues Passwort wiederholen.';
    } else if (this.password.hasError('minlength')) {
      this.errorMessagePasswordRepeat = 'Ihr neues Passwort muss mindestens 8 Zeichen lang sein.';
    } else if (this.password.hasError('passwordRepeat') || this.password.hasError('passwordRepeat'.toLowerCase())) {
      this.errorMessagePasswordRepeat = 'Die neuen Passwärter unterscheiden sich.';
    } else {
      this.errorMessagePasswordRepeat = '';
    }
  }

  updateErrorMessageFavoriteWebsites() {
    if (this.favoriteWebsites.hasError('pattern')) {
      this.errorMessageFavoriteWebsites = 'Die Favoriten müssen wie im Platzhalter formatiert eingeben werden.';
    } else {
      this.errorMessageFavoriteWebsites = '';
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
    if (this.account !== null) {
      input.push(this.account.getName(), this.account.getId());
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
      class_: '',
      grade: '',
      email: '',
      oldPassword: '',
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

  sendIframe(value: boolean): void {
    this.httpClient.post<DefaultResponseDto>('/api/v1/account/settings/iframe',
      JSON.stringify({iframe: value})
    ).subscribe({
      next: response => {
        if (response.status && response.status === 'success') {
          this.accountService.update();
          alert('Ihre iFrame-Einstellung wurde aktualisiert.');
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
  }

  sendNewsletter(value: boolean): void {
    this.httpClient.post<DefaultResponseDto>('/api/v1/account/settings/newsletter',
      JSON.stringify({newsletter: value})
    ).subscribe({
      next: response => {
        if (response.status && response.status === 'success') {
          this.accountService.update();
          alert('Ihre Benachrichtigung-Einstellung wurde aktualisiert.');
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
  }

  submitClass(): void {
    if (!this.class_.invalid){
      this.httpClient.post<DefaultResponseDto>('/api/v1/account/settings/class_',
        JSON.stringify({class_: this.class_.value})
      ).subscribe({
        next: response => {
          if (response.status && response.status === 'success') {
            this.accountService.update();
            alert('Ihre Klasse(n) wurde aktualisiert.');
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
    }
  }

  submitGrade(): void {
    if (!this.grade.invalid){
      this.httpClient.post<DefaultResponseDto>('/api/v1/account/settings/grade',
        JSON.stringify({grade: this.grade.value})
      ).subscribe({
        next: response => {
          if (response.status && response.status === 'success') {
            this.accountService.update();
            alert('Ihre Klassenstufe wurde aktualisiert.');
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
    }
  }

  submitSearchEngine(): void {
    if (!this.searchEngine.invalid){
      this.httpClient.post<DefaultResponseDto>('/api/v1/account/settings/search',
        JSON.stringify({search: this.searchEngine.value})
      ).subscribe({
        next: response => {
          if (response.status && response.status === 'success') {
            this.accountService.update();
            alert('Ihre Suchmaschine wurde aktualisiert.');
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
    }
  }

  submitPassword(): void {
    if (
      !this.oldPassword.invalid &&
      !this.password.invalid &&
      !this.passwordRepeat.invalid
    ){
      this.httpClient.post<DefaultResponseDto>('/api/v1/account/settings/password',
        JSON.stringify({oldPassword: this.oldPassword.value, password: this.password.value})
      ).subscribe({
        next: response => {
          if (response.status && response.status === 'success') {
            this.accountService.update();
            alert('Ihre Passwort wurde aktualisiert. Sie werden abgemeldet.');
            new AbmeldenComponent(
              this.httpClient,
              this.router,
              this.accountService,
            ).ngOnInit();
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
      this.oldPassword.markAsTouched();
      this.updateErrorMessageOldPassword();
      this.password.markAsTouched();
      this.updateErrorMessagePassword();
      this.passwordRepeat.markAsTouched();
      this.updateErrorMessagePasswordRepeat();
      this.updateRating();
    }
  }

  submitFavoriteWebsites(): void {
    if (!this.favoriteWebsites.invalid){
      this.httpClient.post<DefaultResponseDto>('/api/v1/account/settings/favorites',
        JSON.stringify({favorites: this.favoriteWebsites.value})
      ).subscribe({
        next: response => {
          if (response.status && response.status === 'success') {
            this.accountService.update();
            alert('Ihre Favoriten wurden aktualisiert.');
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
    }
  }

  submitTheme(): void {
    if (!this.theme.invalid){
      this.httpClient.post<DefaultResponseDto>('/api/v1/account/settings/theme',
        JSON.stringify({theme: this.theme.value})
      ).subscribe({
        next: response => {
          if (response.status && response.status === 'success') {
            this.accountService.update();
            alert('Ihr Farbschema wurde aktualisiert.');
          } else {
            alert(response.message);
          }
        },
        error: error => {
          console.log(error);
          if (error.message) {
            alert(error.message);
          } else {
            alert(error);
          }
        }
      });
    }
  }

  protected readonly Object = Object;
}
