import {Component, EventEmitter, Output, ViewChild} from '@angular/core';
import {Router, RouterLink} from "@angular/router";
import {NgForOf, NgIf} from "@angular/common";
import {Account} from "../../type/account";
import {AccountService} from "../../service/account.service";
import {MatIcon} from "@angular/material/icon";
import {
  MatAccordion,
  MatExpansionPanel,
  MatExpansionPanelHeader,
  MatExpansionPanelTitle
} from "@angular/material/expansion";
import {NavbarLinkComponent} from "../navbar-link/navbar-link.component";
import {MatDivider} from "@angular/material/divider";

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [
    RouterLink,
    NgIf,
    MatIcon,
    MatAccordion,
    MatExpansionPanel,
    MatExpansionPanelHeader,
    MatExpansionPanelTitle,
    NavbarLinkComponent,
    NgForOf,
    MatDivider,
  ],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.scss'
})
export class NavbarComponent {
  @Output() closeMobile = new EventEmitter();
  @ViewChild('documentsAll') documentsAll!: MatExpansionPanel;
  public account: Account | null = null;
  constructor(private readonly accountService: AccountService, readonly router: Router) {
    this.accountService.getAccountInfo().subscribe((value: Account | null) => {
      this.account = value;
    })

  }
}
