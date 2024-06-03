import { Component } from '@angular/core';
import {MatFormFieldModule} from "@angular/material/form-field";
import {MatInput} from "@angular/material/input";
import {takeUntilDestroyed} from "@angular/core/rxjs-interop";
import {merge} from "rxjs";
import {FormControl, ReactiveFormsModule, Validators} from "@angular/forms";
import {MatButton} from "@angular/material/button";
import {Router} from "@angular/router";
import {HttpClient} from "@angular/common/http";
import {Account, AccountDto} from "../../type/account";
import {DefaultResponseDto} from "../../type/defaulf-response";
import {AccountService} from "../../service/account.service";

@Component({
  selector: 'app-anmelden',
  standalone: true,
  imports: [
    MatFormFieldModule,
    MatInput,
    ReactiveFormsModule,
    MatButton,
  ],
  templateUrl: './anmelden.component.html',
  styleUrl: './anmelden.component.scss'
})
export class AnmeldenComponent {
  email = new FormControl('', [Validators.required, Validators.email]);
  password = new FormControl('', [Validators.required]);

  errorMessageEmail = '';
  errorMessagePassword = '';

  constructor(
    private router: Router,
    private httpClient: HttpClient,
    private accountService: AccountService,
  ) {
    merge(this.email.statusChanges, this.email.valueChanges)
      .pipe(takeUntilDestroyed())
      .subscribe(() => this.updateErrorMessageEmail());
    merge(this.password.statusChanges, this.password.valueChanges)
      .pipe(takeUntilDestroyed())
      .subscribe(() => this.updateErrorMessagePassword());
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
    if (this.password.hasError('required')) {
      this.errorMessagePassword = 'Sie müssen Ihr Passwort angeben.';
    } else {
      this.errorMessagePassword = '';
    }
  }

  continue(){
    if(this.errorMessageEmail === '' && this.errorMessagePassword === '') {
      this.httpClient.post<DefaultResponseDto>('/api/v1/account/signin', JSON.stringify({
        email: this.email.value,
        password: this.password.value
      })).subscribe({
          next: response => {
            if (response.status && response.status === 'success') {
              this.httpClient.get<AccountDto>('/api/v1/account').subscribe((value: AccountDto) => {
                let account = new Account(value);
                this.accountService.getAccountInfo().next(account);
              });
              this.router.navigate(['/']).then();
            } else {
              alert(response.message);
            }
          },
          error: error => {
            console.log(error);
            if (error.error && error.error.error && error.error.error === 'sign-in failed'){
              alert('Diese Kombination aus E-Mail und Passwort existiert nicht.')
            } else if(error.error && error.error.message) {
              alert(error.error.message);
            }
          }
        });
    }
  }
}
