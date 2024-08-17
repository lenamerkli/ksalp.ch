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
import {VorschauComponent as DokumenteVorschauComponent} from "./page/dokumente/vorschau/vorschau.component";
import {BearbeitenComponent as DokumenteBearbeitenComponent} from "./page/dokumente/bearbeiten/bearbeiten.component";
import {LernsetsComponent} from "./page/lernsets/lernsets.component";
import {VorschauComponent as LernsetsVorschauComponent} from "./page/lernsets/vorschau/vorschau.component";
import {BearbeitenComponent as LernsetsBearbeitenComponent} from "./page/lernsets/bearbeiten/bearbeiten.component";
import {LernenComponent} from "./page/lernsets/lernen/lernen.component";
import {PremiumComponent} from "./page/premium/premium.component";
import {KaufenComponent as PremiumKaufenComponent} from "./page/premium/kaufen/kaufen.component";
import {KaufenComponent as PremiumLiteKaufenComponent} from "./page/premium/lite/kaufen/kaufen.component";
import {KontaktComponent} from "./page/ueber/kontakt/kontakt.component";
import {TeamComponent} from "./page/ueber/team/team.component";

export const routes: Routes = [
  {path: '', component: IndexComponent},
  {path: 'dokumente', component: DokumenteComponent},
  {path: 'dokumente/neu', component: DokumenteNeuComponent},
  {path: 'dokumente/vorschau/:id', component: DokumenteVorschauComponent},
  {path: 'dokumente/bearbeiten/:id', component: DokumenteBearbeitenComponent},
  {path: 'lernsets', component: LernsetsComponent},
  {path: 'lernsets/neu', component: LernsetsNeuComponent},
  {path: 'lernsets/vorschau/:id', component: LernsetsVorschauComponent},
  {path: 'lernsets/bearbeiten/:id', component: LernsetsBearbeitenComponent},
  {path: 'lernsets/lernen/:ids', component: LernenComponent},
  {path: 'anmelden', component: AnmeldenComponent},
  {path: 'abmelden', component: AbmeldenComponent},
  {path: 'einstellungen', component: EinstellungenComponent},
  {path: 'premium', component: PremiumComponent},
  {path: 'premium/kaufen', component: PremiumKaufenComponent},
  {path: 'premium/lite/kaufen', component: PremiumLiteKaufenComponent},
  {path: 'registrieren', component: RegistrierenComponent},
  {path: 'registrieren/weiter', component: WeiterComponent},
  {path: 'registrieren/fertig', component: FertigComponent},
  {path: 'registrieren/mail/:mail_code', component: MailComponent},
  {path: 'über/team', component: TeamComponent},
  {path: 'über/kontakt', component: KontaktComponent},
  {path: 'über/quellcode', component: QuellcodeComponent},
  {path: 'über/impressum', component: ImpressumComponent},
  {path: 'über/datenschutz', component: DatenschutzComponent},
  {path: 'über/agb', component: AgbComponent},
  {path: '**', component: _404Component},
];
