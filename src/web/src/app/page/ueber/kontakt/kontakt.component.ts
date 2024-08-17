import { Component } from '@angular/core';
import {ConstantService} from "../../../service/constant.service";

@Component({
  selector: 'app-kontakt',
  standalone: true,
  imports: [],
  templateUrl: './kontakt.component.html',
  styleUrl: './kontakt.component.scss'
})
export class KontaktComponent {
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
