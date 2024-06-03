import { Component } from '@angular/core';
import {RouterLink} from "@angular/router";
import {MatAnchor} from "@angular/material/button";

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

}
