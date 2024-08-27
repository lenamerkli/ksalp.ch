import { Component } from '@angular/core';
import {MatDivider} from "@angular/material/divider";
import {MatButton} from "@angular/material/button";
import {RouterLink} from "@angular/router";
import {Title} from "@angular/platform-browser";

@Component({
  selector: 'app-agb',
  standalone: true,
  imports: [
    MatDivider,
    MatButton,
    RouterLink
  ],
  templateUrl: './agb.component.html',
  styleUrl: './agb.component.scss'
})
export class AgbComponent {

  constructor(
    private titleService: Title,
  ) {
    this.titleService.setTitle('Allgemeine Geschäftsbedingungen - [ksalp.ch]');
  }

  scrollToElement($element: any): void {
    console.log($element);
    $element.scrollIntoView({behavior: "smooth", block: "start", inline: "nearest"});
  }
}
