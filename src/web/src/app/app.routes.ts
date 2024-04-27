import { Routes } from '@angular/router';
import {IndexComponent} from "./page/index/index.component";
import {AnmeldenComponent} from "./page/anmelden/anmelden.component";

export const routes: Routes = [
  {path: '', component: IndexComponent},
  {path: 'anmelden', component: AnmeldenComponent},
];
