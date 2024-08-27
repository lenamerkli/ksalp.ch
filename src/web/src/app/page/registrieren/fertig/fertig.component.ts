import { Component } from '@angular/core';
import {RouterLink} from "@angular/router";
import {MatAnchor} from "@angular/material/button";
import {Title} from "@angular/platform-browser";

@Component({
  selector: 'app-fertig',
  standalone: true,
  imports: [
    RouterLink,
    MatAnchor
  ],
  templateUrl: './fertig.component.html',
  styleUrl: './fertig.component.scss'
})
export class FertigComponent {

  constructor(
    private titleService: Title,
  ) {
    this.titleService.setTitle('Registrieren - [ksalp.ch]');
  }

}
