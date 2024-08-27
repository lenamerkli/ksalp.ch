import {Component, ViewChild} from '@angular/core';
import {MatError, MatFormField, MatLabel} from "@angular/material/form-field";
import {FormControl, ReactiveFormsModule, Validators} from "@angular/forms";
import {MatInput} from "@angular/material/input";
import {MatDivider} from "@angular/material/divider";
import {HttpClient} from "@angular/common/http";
import {ConstantService} from "../../../service/constant.service";
import {Account} from "../../../type/account";
import {AccountService} from "../../../service/account.service";
import {MatOption, MatSelect} from "@angular/material/select";
import {MatButton} from "@angular/material/button";
import {merge} from "rxjs";
import {takeUntilDestroyed} from "@angular/core/rxjs-interop";
import {Router} from "@angular/router";
import {Title} from "@angular/platform-browser";

@Component({
  selector: 'app-neu',
  standalone: true,
  imports: [
    MatFormField,
    MatLabel,
    MatInput,
    ReactiveFormsModule,
    MatDivider,
    MatSelect,
    MatOption,
    MatButton,
    MatError,
  ],
  templateUrl: './neu.component.html',
  styleUrl: './neu.component.scss'
})
export class NeuComponent {
  file: File | null = null;
  fileName: string = '';

  grades: string[] = [];
  languages: string[] = [];
  subjects: { [key: string]: string } = {};

  account: Account | null = null;

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
    private httpClient: HttpClient,
    private constantService: ConstantService,
    private accountService: AccountService,
    private router: Router,
    private titleService: Title,
  ) {
    this.titleService.setTitle('Dokument hochladen - [ksalp.ch]');
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
      valueFile != null
    ){
      let formData = new FormData();
      formData.append('title', valueTitle);
      formData.append('subject', valueSubject);
      formData.append('description', valueDescription);
      formData.append('class', valueClass);
      formData.append('grade', valueGrade);
      formData.append('language', valueLanguage);
      formData.append('file', valueFile, valueFile.name);
      this.httpClient.post<Dto>('/api/v1/documents/new/form', formData).subscribe({
        next: (response: Dto) => {
          if (response.status && response.status === 'success' && response.id) {
            this.router.navigate(['/dokumente/vorschau/' + response.id]).then();
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

interface Dto{
  id?: string;
  error?: string;
  status?: string;
  message?: string;
}
