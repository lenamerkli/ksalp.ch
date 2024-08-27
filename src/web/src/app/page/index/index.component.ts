import {Component, ViewChild} from '@angular/core';
import {AccountService} from "../../service/account.service";
import {Account} from "../../type/account";
import {MatAnchor, MatButton} from "@angular/material/button";
import {RouterLink} from "@angular/router";
import {MatIcon} from "@angular/material/icon";
import {MatFormField} from "@angular/material/form-field";
import {MatInput} from "@angular/material/input";
import {MatCard, MatCardContent, MatCardImage, MatCardLgImage, MatCardXlImage} from "@angular/material/card";
import {ConstantService} from "../../service/constant.service";
import {MatDivider} from "@angular/material/divider";
import {Title} from "@angular/platform-browser";

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
    MatInput,
    MatDivider
  ],
  templateUrl: './index.component.html',
  styleUrl: './index.component.scss'
})
export class IndexComponent {
  public account: Account | null = null;

  constructor(
    public accountService: AccountService,
    public constantService: ConstantService,
    private titleService: Title,
  ) {
    this.titleService.setTitle('Hauptseite - [ksalp.ch]');
    this.accountService.getAccountInfo().subscribe((value: Account | null) => {
      this.account = value;
    })
  }

  submitSearch(): void {
    let input = <HTMLInputElement>document.getElementById('search');
    if (this.account !== null && this.account.isValid() && input !== null) {
      let searchEngine = this.constantService.getSearchEngines().getValue()[this.account.getSearch()];
      let value = input.value;
      let url = searchEngine.url.replace('%s', value);
      this.window.open(url, '_self');
    }
  }

  protected readonly window = window;
}
