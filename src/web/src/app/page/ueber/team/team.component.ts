import { Component } from '@angular/core';
import {RouterLink} from "@angular/router";
import {MatDivider} from "@angular/material/divider";
import {MatAnchor} from "@angular/material/button";
import {MatIcon} from "@angular/material/icon";

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

}
