import {Component, OnInit} from '@angular/core';
import {MatDivider} from "@angular/material/divider";
import {MatFormField, MatLabel} from "@angular/material/form-field";
import {MatInput} from "@angular/material/input";
import {FormControl, ReactiveFormsModule} from "@angular/forms";
import {HttpClient} from "@angular/common/http";
import {Document, DocumentsDto} from "../../type/document";
import {MatCard, MatCardHeader, MatCardSubtitle, MatCardTitle} from "@angular/material/card";
import {RouterLink} from "@angular/router";
import {Account} from "../../type/account";
import {AccountService} from "../../service/account.service";

@Component({
  selector: 'app-dokumente',
  standalone: true,
  imports: [
    MatDivider,
    MatFormField,
    MatLabel,
    MatInput,
    ReactiveFormsModule,
    MatCard,
    MatCardHeader,
    MatCardTitle,
    MatCardSubtitle,
    RouterLink
  ],
  templateUrl: './dokumente.component.html',
  styleUrl: './dokumente.component.scss'
})
export class DokumenteComponent implements OnInit {
  text = new FormControl('', []);
  class_ = new FormControl('', []);
  grade = new FormControl('', []);
  subject = new FormControl('', []);
  language_ = new FormControl('', []);
  creator = new FormControl('', []);
  createdAfter = new FormControl('', []);
  createdBefore = new FormControl('', []);
  editedAfter = new FormControl('', []);
  editedBefore = new FormControl('', []);

  account: Account | null = null;

  documents: Document[] = [];
  displayDocuments: string[] = [];

  constructor(
    private httpClient: HttpClient,
    private accountService: AccountService
  ) {
    this.accountService.getAccountInfo().subscribe((value: Account | null) => {
      this.account = value;
    })
  }

  ngOnInit() {
    this.httpClient.get<DocumentsDto>('/api/v1/documents/list').subscribe((value: DocumentsDto) => {
      for (let document of value.documents) {
        this.documents.push(new Document(document));
      }
    })
  }

  update() {
    let valueText = this.text.value;
    let valueClass = this.class_.value;
    let valueGrade = this.grade.value;
    let valueSubject = this.subject.value;
    let valueLanguage = this.language_.value;
    let valueCreator = this.creator.value;
    let valueCreatedAfter = this.createdAfter.value;
    let valueCreatedBefore = this.createdBefore.value;
    let valueEditedAfter = this.editedAfter.value;
    let valueEditedBefore = this.editedBefore.value;
    this.displayDocuments = [];
    for(let i=0; i<this.documents.length; i++){
      if(
        ((valueText === '' || (valueText !== null && this.documents[i].getTitle().includes(valueText)))
        || (valueText === '' || (valueText !== null && this.documents[i].getDescription().includes(valueText))))
        && (valueClass === '' || (valueClass !== null && this.documents[i].getClass().includes(valueClass)))
        && (valueGrade === '' || (valueGrade !== null && this.documents[i].getGrade().includes(valueGrade)))
        && (valueSubject === '' || (valueSubject !== null && this.documents[i].getSubject().includes(valueSubject)))
        && (valueLanguage === '' || (valueLanguage !== null && this.documents[i].getLanguage().includes(valueLanguage)))
        && (valueCreator === '' || (valueCreator !== null && this.documents[i].getOwnerName().includes(valueCreator)))
        && (valueCreatedAfter === '' || (valueCreatedAfter !== null && valueCreatedAfter <= this.documents[i].getCreated()))
        && (valueCreatedBefore === '' || (valueCreatedBefore !== null && valueCreatedBefore >= this.documents[i].getCreated()))
        && (valueEditedAfter === '' || (valueEditedAfter !== null && valueEditedAfter <= this.documents[i].getEdited()))
        && (valueEditedBefore === '' || (valueEditedBefore !== null && valueEditedBefore >= this.documents[i].getEdited()))){
        this.displayDocuments.push(this.documents[i].getId());
      }
    }
  }

}
