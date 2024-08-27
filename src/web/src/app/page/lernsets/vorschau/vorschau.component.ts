import { Component } from '@angular/core';
import {LearnSet, LearnSetDto} from "../../../type/learnset";
import {DomSanitizer, SafeUrl, Title} from "@angular/platform-browser";
import {Account} from "../../../type/account";
import {ActivatedRoute, RouterLink} from "@angular/router";
import {HttpClient} from "@angular/common/http";
import {AccountService} from "../../../service/account.service";
import {DocumentDto} from "../../../type/document";
import {LearnsetExercise, LearnsetExerciseDto} from "../../../type/learnset_exercise";
import {MatDivider} from "@angular/material/divider";
import {MatAnchor} from "@angular/material/button";
import {MatCard, MatCardContent, MatCardSubtitle, MatCardTitle} from "@angular/material/card";

@Component({
  selector: 'app-vorschau',
  standalone: true,
  imports: [
    MatDivider,
    MatAnchor,
    RouterLink,
    MatCard,
    MatCardTitle,
    MatCardSubtitle,
    MatCardContent
  ],
  templateUrl: './vorschau.component.html',
  styleUrl: './vorschau.component.scss'
})
export class VorschauComponent {
  learnsetId: string | null = null;
  learnset: LearnSet | null = null;
  learnsetUrl: SafeUrl | null = null;

  account: Account | null = null;
  exercises: LearnsetExercise[] = [];

  constructor(
    private activatedRoute: ActivatedRoute,
    private httpClient: HttpClient,
    private accountService: AccountService,
    private domSanitizer: DomSanitizer,
    private titleService: Title,
  ) {
    this.titleService.setTitle('Lernset Vorschau - [ksalp.ch]');
    this.activatedRoute.params.subscribe({
      next: (params) => {
        this.learnsetId = params['id'];
        this.httpClient.get<Dto>('/api/v1/learnsets/data/' + this.learnsetId).subscribe({
          next: (value) => {
            if (value.learnset && value.exercises) {
              this.learnset = new LearnSet(value.learnset);
              let filename = this.getSaveFilename();
              let url = '/dateien/lernsets/' + this.learnsetId + '/' + filename;
              this.learnsetUrl = this.domSanitizer.bypassSecurityTrustResourceUrl(url);
              for(let exercise of value.exercises) {
                this.exercises.push(new LearnsetExercise(exercise));
              }
              this.titleService.setTitle('Lernset `[' + this.learnset.getSubject().toUpperCase() + '] ' + this.learnset.getTitle() + '` - [ksalp.ch]');
            } else {
              alert(value.message);
            }
          },
          error: (error) => {
            console.log(error);
            if (error.message) {
              alert(error.message);
            } else {
              alert(error);
            }
          }
        });
      }
    });
    this.accountService.getAccountInfo().subscribe({
      next: (value) => {
        this.account = value;
      },
      error: (error) => {
        console.log(error);
        if (error.message){
          alert(error.message);
        } else {
          alert(error);
        }
      }
    });
  }

  getSaveFilename(): string {
    if (this.learnset !== null) {
      let filename = this.learnset.getTitle() + '.json';
      filename = filename.replaceAll('ä', 'ae');
      filename = filename.replaceAll('ö', 'oe');
      filename = filename.replaceAll('ü', 'ue');
      filename = filename.replaceAll('Ä', 'Ae');
      filename = filename.replaceAll('Ö', 'Oe');
      filename = filename.replaceAll('Ü', 'Ue');
      filename = filename.replaceAll('ß', 'ss');
      filename = filename.replace(/[^a-z0-9.\-]/gi, '_');
      return filename;
    } else {
      return '';
    }
  }
}

interface Dto {
  status?: string;
  message?: string;
  error?: string;
  learnset?: LearnSetDto;
  exercises?: LearnsetExerciseDto[];
}
