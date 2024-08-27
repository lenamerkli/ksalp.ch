import { Component } from '@angular/core';
import {Title} from "@angular/platform-browser";

@Component({
  selector: 'app-hilfe',
  standalone: true,
  imports: [],
  templateUrl: './hilfe.component.html',
  styleUrl: './hilfe.component.scss'
})
export class HilfeComponent {

  constructor(
    private titleService: Title,
  ) {
    this.titleService.setTitle('Lernset Hilfe - [ksalp.ch]');
  }

}
