import { Component } from '@angular/core';
import {AccountService} from "../../service/account.service";
import {Account} from "../../type/account";
import {MatAnchor, MatButton} from "@angular/material/button";
import {RouterLink} from "@angular/router";
import {MatIcon} from "@angular/material/icon";
import {MatFormField} from "@angular/material/form-field";
import {MatInput} from "@angular/material/input";
import {MatCard, MatCardContent, MatCardImage, MatCardLgImage, MatCardXlImage} from "@angular/material/card";

@Component({
  selector: 'app-index',
  standalone: true,
  imports: [
    MatIcon,
    MatButton,
    MatAnchor,
    MatCard,
    MatCardContent,
    MatCardImage,
    MatCardLgImage,
    RouterLink,
    MatFormField,
    MatInput
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

  protected readonly window = window;
}
