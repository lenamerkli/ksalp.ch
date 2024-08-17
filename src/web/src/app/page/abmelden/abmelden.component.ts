import {Component, OnInit} from '@angular/core';
import {Router} from "@angular/router";
import {HttpClient} from "@angular/common/http";
import {DefaultResponseDto} from "../../type/defaulf-response";
import {AccountService} from "../../service/account.service";
import {Account} from "../../type/account";

@Component({
  selector: 'app-abmelden',
  standalone: true,
  imports: [],
  templateUrl: './abmelden.component.html',
  styleUrl: './abmelden.component.scss'
})
export class AbmeldenComponent implements OnInit {

  constructor(
    private httpClient: HttpClient,
    private router: Router,
    private accountService: AccountService,
  ) {}

  ngOnInit(): void {

    this.httpClient.post<DefaultResponseDto>('/api/v1/account/logout', JSON.stringify({})).subscribe({
      next: response => {
        if (response.status && response.status === 'success') {
          this.accountService.getAccountInfo().next(new Account({valid: false, paid: false, paidLite: false, info: null}));
          this.router.navigate(['/']).then();
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
    })
  }

}
