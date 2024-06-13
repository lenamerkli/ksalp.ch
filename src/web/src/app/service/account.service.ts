import { Injectable } from '@angular/core';
import {BehaviorSubject} from "rxjs";
import {Account, AccountDto} from "../type/account";
import {HttpClient} from "@angular/common/http";

@Injectable({
  providedIn: 'root'
})
export class AccountService {

  private accountInfo: BehaviorSubject<Account | null> = new BehaviorSubject<Account | null>(null);

  constructor(private httpClient: HttpClient) {
    this.update()
  }

  update(): void {
    this.httpClient.get<AccountDto>('/api/v1/account').subscribe((value: AccountDto) => {
      let account = new Account(value);
      this.accountInfo.next(account);
    });
  }

  public getAccountInfo(): BehaviorSubject<Account | null>{
    return this.accountInfo;
  }
}
