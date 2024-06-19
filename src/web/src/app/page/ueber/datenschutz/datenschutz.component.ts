import { Component } from '@angular/core';
import {MatButton} from "@angular/material/button";
import {ConstantService} from "../../../service/constant.service";
import {RouterLink} from "@angular/router";
import {MatDivider} from "@angular/material/divider";

@Component({
  selector: 'app-datenschutz',
  standalone: true,
  imports: [
    MatButton,
    RouterLink,
    MatDivider,
  ],
  templateUrl: './datenschutz.component.html',
  styleUrl: './datenschutz.component.scss'
})
export class DatenschutzComponent {

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

  scrollToElement($element: any): void {
    console.log($element);
    $element.scrollIntoView({behavior: "smooth", block: "start", inline: "nearest"});
  }
}
