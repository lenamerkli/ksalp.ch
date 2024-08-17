import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import {RouterLink, RouterOutlet} from '@angular/router';
import {AccountService} from "./service/account.service";
import {Account} from "./type/account";
import {NavbarComponent} from "./component/navbar/navbar.component";
import {MatIcon} from "@angular/material/icon";

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    NavbarComponent,
    MatIcon,
    RouterLink,
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  openNavbar = false;
  public account: Account | null = null;
  constructor(private readonly accountService: AccountService) {
    this.accountService.getAccountInfo().subscribe((value: Account | null) => {
      this.account = value;
    })
  }
  open_mobile(){
    let navbar = document.getElementById('navbar');
    if(navbar){
      navbar.style.display = 'block';
      this.openNavbar = true;
    }
    window.scroll({
      top: 0,
      left: 0,
      behavior: 'smooth',
    })
  }
  close_mobile(){
    let navbar = document.getElementById('navbar');
    if(navbar){
      navbar.style.display = '';
      this.openNavbar = false;
    }
  }
}
