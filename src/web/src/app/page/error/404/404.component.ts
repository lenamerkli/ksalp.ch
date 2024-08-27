import { Component } from '@angular/core';
import {Title} from "@angular/platform-browser";

@Component({
  selector: 'app-404',
  standalone: true,
  imports: [],
  templateUrl: './404.component.html',
  styleUrl: './404.component.scss'
})
export class _404Component {

  constructor(
    private titleService: Title,
  ) {
    this.titleService.setTitle('Seite nicht gefunden - [ksalp.ch]');
  }

}
