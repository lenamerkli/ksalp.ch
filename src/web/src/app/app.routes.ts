import { Routes } from '@angular/router';
import {IndexComponent} from "./page/index/index.component";
import {AnmeldenComponent} from "./page/anmelden/anmelden.component";
import {RegistrierenComponent} from "./page/registrieren/registrieren.component";
import {WeiterComponent} from "./page/registrieren/weiter/weiter.component";
import {MailComponent} from "./page/registrieren/mail/mail.component";
import {FertigComponent} from "./page/registrieren/fertig/fertig.component";
import {AbmeldenComponent} from "./page/abmelden/abmelden.component";
import {_404Component} from "./page/error/404/404.component";
import {EinstellungenComponent} from "./page/einstellungen/einstellungen.component";
import {DatenschutzComponent} from "./page/ueber/datenschutz/datenschutz.component";
import {AgbComponent} from "./page/ueber/agb/agb.component";
import {ImpressumComponent} from "./page/ueber/impressum/impressum.component";
import {QuellcodeComponent} from "./page/ueber/quellcode/quellcode.component";
import {DokumenteComponent} from "./page/dokumente/dokumente.component";
import {NeuComponent as DokumenteNeuComponent} from "./page/dokumente/neu/neu.component";
import {NeuComponent as LernsetsNeuComponent} from "./page/lernsets/neu/neu.component";
import {VorschauComponent} from "./page/dokumente/vorschau/vorschau.component";
import {BearbeitenComponent} from "./page/dokumente/bearbeiten/bearbeiten.component";
import {LernsetsComponent} from "./page/lernsets/lernsets.component";

export const routes: Routes = [
  {path: '', component: IndexComponent},
  {path: 'dokumente', component: DokumenteComponent},
  {path: 'dokumente/neu', component: DokumenteNeuComponent},
  {path: 'dokumente/vorschau/:id', component: VorschauComponent},
  {path: 'dokumente/bearbeiten/:id', component: BearbeitenComponent},
  {path: 'lernsets', component: LernsetsComponent},
  {path: 'lernsets/neu', component: LernsetsNeuComponent},
  {path: 'anmelden', component: AnmeldenComponent},
  {path: 'abmelden', component: AbmeldenComponent},
  {path: 'einstellungen', component: EinstellungenComponent},
  {path: 'registrieren', component: RegistrierenComponent},
  {path: 'registrieren/weiter', component: WeiterComponent},
  {path: 'registrieren/fertig', component: FertigComponent},
  {path: 'registrieren/mail/:mail_code', component: MailComponent},
  {path: 'über/quellcode', component: QuellcodeComponent},
  {path: 'über/impressum', component: ImpressumComponent},
  {path: 'über/datenschutz', component: DatenschutzComponent},
  {path: 'über/agb', component: AgbComponent},
  {path: '**', component: _404Component},
];
