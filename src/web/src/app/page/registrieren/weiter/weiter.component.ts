import { Component } from '@angular/core';
import {Title} from "@angular/platform-browser";

@Component({
  selector: 'app-weiter',
  standalone: true,
  imports: [],
  templateUrl: './weiter.component.html',
  styleUrl: './weiter.component.scss'
})
export class WeiterComponent {

  constructor(
    private titleService: Title,
  ) {
    this.titleService.setTitle('Registrieren - [ksalp.ch]');
  }

}
