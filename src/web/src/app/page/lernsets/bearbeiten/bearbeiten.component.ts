import { Component } from '@angular/core';
import {MatButton} from "@angular/material/button";
import {MatDivider} from "@angular/material/divider";
import {MatError, MatFormField, MatLabel} from "@angular/material/form-field";
import {MatInput} from "@angular/material/input";
import {MatOption} from "@angular/material/autocomplete";
import {MatProgressSpinner} from "@angular/material/progress-spinner";
import {MatSelect} from "@angular/material/select";
import {FormControl, ReactiveFormsModule, Validators} from "@angular/forms";
import {ActivatedRoute, Router, RouterLink} from "@angular/router";
import {Account} from "../../../type/account";
import {HttpClient} from "@angular/common/http";
import {AccountService} from "../../../service/account.service";
import {ConstantService} from "../../../service/constant.service";
import {merge} from "rxjs";
import {takeUntilDestroyed} from "@angular/core/rxjs-interop";
import {DefaultResponseDto} from "../../../type/defaulf-response";
import {LearnSet, LearnSetDto} from "../../../type/learnset";

@Component({
  selector: 'app-bearbeiten',
  standalone: true,
    imports: [
        MatButton,
        MatDivider,
        MatError,
        MatFormField,
        MatInput,
        MatLabel,
        MatOption,
        MatProgressSpinner,
        MatSelect,
        ReactiveFormsModule,
        RouterLink
    ],
  templateUrl: './bearbeiten.component.html',
  styleUrl: './bearbeiten.component.scss'
})
export class BearbeitenComponent {
  learnsetId: string | null = null;
  learnset: LearnSet | null = null;

  file: File | null = null;
  fileName: string = '';

  account: Account | null = null;

  grades: string[] = [];
  languages: string[] = [];
  subjects: { [key: string]: string } = {};

  title = new FormControl('', [
    Validators.required,
    Validators.minLength(4),
    Validators.maxLength(64),
  ]);
  subject = new FormControl('', [
    Validators.required,
  ]);
  description = new FormControl('', [
    Validators.required,
    Validators.minLength(4),
    Validators.maxLength(4096),
  ]);
  class_ = new FormControl('', [
    Validators.required,
    Validators.minLength(2),
    Validators.maxLength(12),
  ]);
  grade = new FormControl('', [
    Validators.required,
  ]);
  language = new FormControl('', [
    Validators.required,
  ]);

  errorMessageTitle = '';
  errorMessageSubject = '';
  errorMessageDescription = '';
  errorMessageClass = '';
  errorMessageGrade = '';
  errorMessageLanguage = '';

  constructor(
    private activatedRoute: ActivatedRoute,
    private httpClient: HttpClient,
    private accountService: AccountService,
    private constantService: ConstantService,
    private router: Router,
  ) {
    this.activatedRoute.params.subscribe({
      next: (params) => {
        this.learnsetId = params['id'];
        this.httpClient.get<Dto>('/api/v1/learnsets/data/' + this.learnsetId).subscribe({
          next: (value) => {
            if (value.learnset) {
              this.learnset = new LearnSet(value.learnset);
              this.title.setValue(this.learnset.getTitle());
              this.subject.setValue(this.learnset.getSubject());
              this.description.setValue(this.learnset.getDescription());
              this.class_.setValue(this.learnset.getClass());
              this.grade.setValue(this.learnset.getGrade());
              this.language.setValue(this.learnset.getLanguage());
            } else {
              alert(value.message);
            }
          },
          error: (error) => {
            console.log(error);
            if (error.message){
              alert(error.message);
            } else {
              alert(error);
            }
          }
        })
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
    this.constantService.getGrades().subscribe((value: string[]) => {
      this.grades = value;
    });
    this.constantService.getLanguages().subscribe((value: string[]) => {
      this.languages = value;
    });
    this.constantService.getSubjects().subscribe((value: { [key: string]: string }) => {
      this.subjects = value;
    });
    this.accountService.getAccountInfo().subscribe((value: Account | null) => {
      this.account = value;
    });
    merge(this.title.statusChanges, this.title.valueChanges)
      .pipe(takeUntilDestroyed())
      .subscribe(() => this.updateErrorMessageTitle());
    merge(this.subject.statusChanges, this.subject.valueChanges)
      .pipe(takeUntilDestroyed())
      .subscribe(() => this.updateErrorMessageSubject());
    merge(this.description.statusChanges, this.description.valueChanges)
      .pipe(takeUntilDestroyed())
      .subscribe(() => this.updateErrorMessageDescription());
    merge(this.class_.statusChanges, this.class_.valueChanges)
      .pipe(takeUntilDestroyed())
      .subscribe(() => this.updateErrorMessageClass());
    merge(this.grade.statusChanges, this.grade.valueChanges)
      .pipe(takeUntilDestroyed())
      .subscribe(() => this.updateErrorMessageGrade());
    merge(this.language.statusChanges, this.language.valueChanges)
      .pipe(takeUntilDestroyed())
      .subscribe(() => this.updateErrorMessageLanguage());
  }

  updateFileName(event: any){
    if (event.target.files.length > 0) {
      this.file = event.target.files[0];
      this.fileName = event.target.files[0].name;
    } else {
      this.file = null;
      this.fileName = '';
    }
  }

  updateErrorMessageTitle() {
    if (this.title.hasError('required')) {
      this.errorMessageTitle = 'Der Titel ist ein Pflichtfeld';
    } else if (this.title.hasError('minlength')) {
      this.errorMessageTitle = 'Der Titel muss mindestens 4 Zeichen lang sein';
    } else if (this.title.hasError('maxlength')) {
      this.errorMessageTitle = 'Der Titel darf maximal 64 Zeichen lang sein';
    } else {
      this.errorMessageTitle = '';
    }
  }

  updateErrorMessageSubject() {
    if (this.subject.hasError('required')) {
      this.errorMessageSubject = 'Das Fach ist ein Pflichtfeld';
    } else {
      this.errorMessageSubject = '';
    }
  }

  updateErrorMessageDescription() {
    if (this.description.hasError('required')) {
      this.errorMessageDescription = 'Die Beschreibung ist ein Pflichtfeld';
    } else if (this.description.hasError('minlength')) {
      this.errorMessageDescription = 'Die Beschreibung muss mindestens 4 Zeichen lang sein';
    } else if (this.description.hasError('maxlength')) {
      this.errorMessageDescription = 'Die Beschreibung darf maximal 4096 Zeichen lang sein';
    } else {
      this.errorMessageDescription = '';
    }
  }

  updateErrorMessageClass() {
    if (this.class_.hasError('required')) {
      this.errorMessageClass = 'Die Klasse oder Kursbezeichnung ist ein Pflichtfeld';
    } else if (this.class_.hasError('minlength')) {
      this.errorMessageClass = 'Die Klasse oder Kursbezeichnung muss mindestens 2 Zeichen lang sein';
    } else if (this.class_.hasError('maxlength')) {
      this.errorMessageClass = 'Die Klasse oder Kursbezeichnung darf maximal 12 Zeichen lang sein';
    } else {
      this.errorMessageClass = '';
    }
  }

  updateErrorMessageGrade() {
    if (this.grade.hasError('required')) {
      this.errorMessageGrade = 'Die Klassenstufe ist ein Pflichtfeld';
    } else {
      this.errorMessageGrade = '';
    }
  }

  updateErrorMessageLanguage() {
    if (this.language.hasError('required')) {
      this.errorMessageLanguage = 'Die Sprache ist ein Pflichtfeld';
    } else {
      this.errorMessageLanguage = '';
    }
  }

  submit() {
    let valueTitle = this.title.value;
    let valueSubject = this.subject.value;
    let valueDescription = this.description.value;
    let valueClass = this.class_.value;
    let valueGrade = this.grade.value;
    let valueLanguage = this.language.value;
    let valueFile = this.file;
    let valueId = this.learnsetId;
    if(
      !this.title.invalid &&
      !this.subject.invalid &&
      !this.description.invalid &&
      !this.class_.invalid &&
      !this.grade.invalid &&
      !this.language.invalid &&
      valueTitle != null &&
      valueSubject != null &&
      valueDescription != null &&
      valueClass != null &&
      valueGrade != null &&
      valueLanguage != null &&
      valueFile != null &&
      valueId != null
    ){
      let formData = new FormData();
      formData.append('title', valueTitle);
      formData.append('subject', valueSubject);
      formData.append('description', valueDescription);
      formData.append('class', valueClass);
      formData.append('grade', valueGrade);
      formData.append('language', valueLanguage);
      formData.append('file', valueFile, valueFile.name);
      formData.append('id', valueId);
      this.httpClient.post<DefaultResponseDto>('/api/v1/learnsets/edit/form', formData).subscribe({
        next: (response: DefaultResponseDto) => {
          if (response.status && response.status === 'success') {
            this.router.navigate(['/lernsets/vorschau/' + this.learnsetId]).then();
          } else {
            alert(response.message);
          }
        },
        error: error => {
          console.log(error);
          if (error.message){
            alert(error.message);
          } else {
            alert(error);
          }
        }
      });
    } else {
      this.title.markAsTouched();
      this.updateErrorMessageTitle();
      this.subject.markAsTouched();
      this.updateErrorMessageSubject();
      this.description.markAsTouched();
      this.updateErrorMessageDescription();
      this.class_.markAsTouched();
      this.updateErrorMessageClass();
      this.grade.markAsTouched();
      this.updateErrorMessageGrade();
      this.language.markAsTouched();
      this.updateErrorMessageLanguage();
      if (valueFile == null) {
        alert('Bitten wählen Sie eine Datei aus.');
      }
    }
  }

  protected readonly Object = Object;

}

interface Dto {
  status?: string;
  message?: string;
  error?: string;
  learnset?: LearnSetDto;
}

