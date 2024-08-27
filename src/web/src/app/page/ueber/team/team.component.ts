import { Component } from '@angular/core';
import {RouterLink} from "@angular/router";
import {MatDivider} from "@angular/material/divider";
import {MatAnchor} from "@angular/material/button";
import {MatIcon} from "@angular/material/icon";
import {Title} from "@angular/platform-browser";

@Component({
  selector: 'app-team',
  standalone: true,
  imports: [
    RouterLink,
    MatDivider,
    MatAnchor,
    MatIcon,
  ],
  templateUrl: './team.component.html',
  styleUrl: './team.component.scss'
})
export class TeamComponent {

  constructor(
    private titleService: Title,
  ) {
    this.titleService.setTitle('Das ksalp.ch Team - [ksalp.ch]');
  }

}
