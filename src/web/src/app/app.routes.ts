import { Routes } from '@angular/router';
import {IndexComponent} from "./page/index/index.component";
import {AnmeldenComponent} from "./page/anmelden/anmelden.component";
import {RegistrierenComponent} from "./page/registrieren/registrieren.component";
import {WeiterComponent} from "./page/registrieren/weiter/weiter.component";
import {MailComponent} from "./page/registrieren/mail/mail.component";
import {FertigComponent} from "./page/registrieren/fertig/fertig.component";
import {AbmeldenComponent} from "./page/abmelden/abmelden.component";
import {_404Component} from "./page/error/404/404.component";

export const routes: Routes = [
  {path: '', component: IndexComponent},
  {path: 'anmelden', component: AnmeldenComponent},
  {path: 'abmelden', component: AbmeldenComponent},
  {path: 'registrieren', component: RegistrierenComponent},
  {path: 'registrieren/weiter', component: WeiterComponent},
  {path: 'registrieren/fertig', component: FertigComponent},
  {path: 'registrieren/mail/:mail_code', component: MailComponent},
  {path: '**', component: _404Component},
];
