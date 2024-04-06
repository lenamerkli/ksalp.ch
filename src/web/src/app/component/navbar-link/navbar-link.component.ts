import {Component, Input, ViewChild} from '@angular/core';
import {MatExpansionPanel, MatExpansionPanelHeader, MatExpansionPanelTitle} from "@angular/material/expansion";
import {Router} from "@angular/router";

@Component({
  selector: 'app-navbar-link',
  standalone: true,
    imports: [
        MatExpansionPanel,
        MatExpansionPanelHeader,
        MatExpansionPanelTitle
    ],
  templateUrl: './navbar-link.component.html',
  styleUrl: './navbar-link.component.scss'
})
export class NavbarLinkComponent {
  @Input({required: true}) link!: string;
  @ViewChild('panel') panel!: MatExpansionPanel;
  constructor(private router: Router) {
  }
  navigate(url: string){
    if(this.panel){
      this.panel.close()
    }
    this.router.navigate([url]).then(_ => {});
  }
}
