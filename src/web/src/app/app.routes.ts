import { Routes } from '@angular/router';
import {IndexComponent} from "./page/index/index.component";
import {AnmeldenComponent} from "./page/anmelden/anmelden.component";
import {RegistrierenComponent} from "./page/registrieren/registrieren.component";
import {WeiterComponent} from "./page/registrieren/weiter/weiter.component";
import {MailComponent} from "./page/registrieren/mail/mail.component";
import {FertigComponent} from "./page/registrieren/fertig/fertig.component";

export const routes: Routes = [
  {path: '', component: IndexComponent},
  {path: 'anmelden', component: AnmeldenComponent},
  {path: 'registrieren', component: RegistrierenComponent},
  {path: 'registrieren/weiter', component: WeiterComponent},
  {path: 'registrieren/fertig', component: FertigComponent},
  {path: 'registrieren/mail/:mail_code', component: MailComponent},
];
