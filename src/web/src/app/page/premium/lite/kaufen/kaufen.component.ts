import { Component } from '@angular/core';
import {Account} from "../../../../type/account";
import {AccountService} from "../../../../service/account.service";
import {MatAnchor} from "@angular/material/button";
import {RouterLink} from "@angular/router";
import {Title} from "@angular/platform-browser";

@Component({
  selector: 'app-kaufen',
  standalone: true,
  imports: [
    MatAnchor,
    RouterLink
  ],
  templateUrl: './kaufen.component.html',
  styleUrl: './kaufen.component.scss'
})
export class KaufenComponent {
  account: Account | null = null;

  constructor(
    private readonly accountService: AccountService,
    private titleService: Title,
  ) {
    this.titleService.setTitle('Premium Lite Kaufen - [ksalp.ch]');
    this.accountService.getAccountInfo().subscribe(account => {
      this.account = account;
    });
  }
}
