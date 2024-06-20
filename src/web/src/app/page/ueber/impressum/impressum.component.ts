import { Component } from '@angular/core';
import {ConstantService} from "../../../service/constant.service";
import {MatDivider} from "@angular/material/divider";
import {RouterLink} from "@angular/router";

@Component({
  selector: 'app-impressum',
  standalone: true,
  imports: [
    MatDivider,
    RouterLink
  ],
  templateUrl: './impressum.component.html',
  styleUrl: './impressum.component.scss'
})
export class ImpressumComponent {
  public imprint: {
    name: string,
    address: string,
    city: string,
    mail: string,
  } = {
    name: 'lädt...',
    address: 'lädt...',
    city: 'lädt...',
    mail: 'lädt...',
  }

  constructor(
    private constantService: ConstantService,
  ) {
    this.constantService.getImprint().subscribe((value: {
      name: string,
      address: string,
      city: string,
      mail: string,
    }) => {
      this.imprint = value;
    });
  }
}
