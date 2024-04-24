import { Component } from '@angular/core';
import {AccountService} from "../../service/account.service";
import {Account} from "../../type/account";
import {MatAnchor, MatButton} from "@angular/material/button";
import {RouterLink} from "@angular/router";

@Component({
  selector: 'app-index',
  standalone: true,
  imports: [
    MatButton,
    MatAnchor,
    RouterLink
  ],
  templateUrl: './index.component.html',
  styleUrl: './index.component.scss'
})
export class IndexComponent {
  public account: Account | null = null;

  constructor(public accountService: AccountService) {
    this.accountService.getAccountInfo().subscribe((value: Account | null) => {
      this.account = value;
    })
  }
}
