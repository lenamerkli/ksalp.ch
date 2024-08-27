import { Component } from '@angular/core';
import {Account} from "../../type/account";
import {AccountService} from "../../service/account.service";
import {MatAnchor} from "@angular/material/button";
import {RouterLink} from "@angular/router";
import {Title} from "@angular/platform-browser";

@Component({
  selector: 'app-premium',
  standalone: true,
  imports: [
    MatAnchor,
    RouterLink
  ],
  templateUrl: './premium.component.html',
  styleUrl: './premium.component.scss'
})
export class PremiumComponent {
  account: Account | null = null

  constructor(
    private readonly accountService: AccountService,
    private titleService: Title,
  ) {
    this.titleService.setTitle('Premium - [ksalp.ch]');
    this.accountService.getAccountInfo().subscribe((value: Account | null) => {
      this.account = value;
    });
  }
}
