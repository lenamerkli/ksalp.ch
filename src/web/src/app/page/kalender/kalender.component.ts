import { Component } from '@angular/core';
import {Account} from "../../type/account";
import {AccountService} from "../../service/account.service";

@Component({
  selector: 'app-kalender',
  standalone: true,
  imports: [],
  templateUrl: './kalender.component.html',
  styleUrl: './kalender.component.scss'
})
export class KalenderComponent {
  account: Account | null = null;

  calendars
  calendarSelection: string[] = [];

  constructor(
    private readonly accountService: AccountService
  ) {
    this.accountService.getAccountInfo().subscribe((value: Account | null) => {
      this.account = value;
    })
  }
}
