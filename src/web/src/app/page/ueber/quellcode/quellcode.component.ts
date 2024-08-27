import { Component } from '@angular/core';
import {MatDivider} from "@angular/material/divider";
import {Title} from "@angular/platform-browser";

@Component({
  selector: 'app-quellcode',
  standalone: true,
  imports: [
    MatDivider
  ],
  templateUrl: './quellcode.component.html',
  styleUrl: './quellcode.component.scss'
})
export class QuellcodeComponent {

  constructor(
    private titleService: Title,
  ) {
    this.titleService.setTitle('Quellcode - [ksalp.ch]');
  }

}
