import { Component } from '@angular/core';
import {Account} from "../../type/account";
import {AccountService} from "../../service/account.service";
import {MatButton} from "@angular/material/button";
import {ActivatedRoute, Router, RouterLink} from "@angular/router";
import {AuthToken} from "../../type/auth_token";
import {HttpClient} from "@angular/common/http";
import {DefaultResponseDto} from "../../type/defaulf-response";

@Component({
  selector: 'app-autorisieren',
  standalone: true,
  imports: [
    MatButton,
    RouterLink
  ],
  templateUrl: './autorisieren.component.html',
  styleUrl: './autorisieren.component.scss'
})
export class AutorisierenComponent {
  account: Account | null = null;
  token: AuthToken | null = null;
  invalid = false;

  constructor(
    private readonly accountService: AccountService,
    private readonly activatedRoute: ActivatedRoute,
    private readonly router: Router,
    private readonly httpClient: HttpClient,
  ) {
    this.accountService.getAccountInfo().subscribe((value: Account | null) => {
      this.account = value;
    });
    this.activatedRoute.params.subscribe(value => {
      try {
        const tokenString = value['token'];
        console.log(tokenString);
        this.token = new AuthToken(tokenString);
        const url = new URL(this.token.getUrl());
        const redirect = new URL(this.token.getRedirect());
        if (url.hostname !== redirect.hostname) {
          this.invalid = true;
        }
      } catch (e) {
        console.log(e);
        this.invalid = true;
      }
    });
  }

  authorize() {
    if (this.account !== null && this.token !== null && !this.invalid) {
      this.httpClient.post<DefaultResponseDto>('/api/v1/authorize', JSON.stringify({
        url: this.token.getUrl(),
        token: this.token.getSecret(),
      }), {headers: {'Content-Type': 'application/json'}}).subscribe({
        next: response => {
          if (response.status && response.status === 'success' && this.token !== null) {
            window.location.href = this.token.getRedirect();
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
      this.invalid = true;
    }
  }

  cancel() {
    this.router.navigate(['/']).then();
  }
}
