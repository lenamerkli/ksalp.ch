import {Component, OnInit} from '@angular/core';
import {FormControl, FormsModule, ReactiveFormsModule} from "@angular/forms";
import {Account} from "../../type/account";
import {LearnSet, LearnSetsDto} from "../../type/learnset";
import {HttpClient} from "@angular/common/http";
import {AccountService} from "../../service/account.service";
import {MatCard, MatCardHeader, MatCardSubtitle, MatCardTitle} from "@angular/material/card";
import {MatDivider} from "@angular/material/divider";
import {MatFormField, MatLabel} from "@angular/material/form-field";
import {MatInput} from "@angular/material/input";
import {Router, RouterLink} from "@angular/router";
import {MatAnchor, MatButton} from "@angular/material/button";
import {MatIcon} from "@angular/material/icon";
import {MatOption} from "@angular/material/autocomplete";
import {MatSelect} from "@angular/material/select";

@Component({
  selector: 'app-lernsets',
  standalone: true,
  imports: [
    MatCard,
    MatCardHeader,
    MatCardSubtitle,
    MatCardTitle,
    MatDivider,
    MatFormField,
    MatInput,
    MatLabel,
    ReactiveFormsModule,
    RouterLink,
    FormsModule,
    MatAnchor,
    MatButton,
    MatIcon,
    MatOption,
    MatSelect
  ],
  templateUrl: './lernsets.component.html',
  styleUrl: './lernsets.component.scss'
})
export class LernsetsComponent implements OnInit {
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

  learnsets: LearnSet[] = [];
  displayLearnsets: string[] = [];
  selectedCount = 0;

  formControls: {[key: string]: FormControl} = {
  };

  constructor(
    private httpClient: HttpClient,
    private accountService: AccountService,
    private router: Router,
  ) {
    this.accountService.getAccountInfo().subscribe((value: Account | null) => {
      this.account = value;
    })
  }

  ngOnInit() {
    this.httpClient.get<LearnSetsDto>('/api/v1/learnsets/list').subscribe((value: LearnSetsDto) => {
      for (let element of value.learnsets) {
        let learnset = new LearnSet(element);
        this.learnsets.push(learnset);
        this.formControls[learnset.getId()] = new FormControl(false, []);
      }
      this.update();
    })
  }

  updateSelectionCount() {
    this.selectedCount = 0;
    for(let i=0; i<this.learnsets.length; i++) {
      if(this.formControls[this.learnsets[i].getId()].value) {
        this.selectedCount++;
      }
    }
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
    this.displayLearnsets = [];
    for(let i=0; i<this.learnsets.length; i++) {
      if(
        ((valueText === '' || (valueText !== null && this.learnsets[i].getTitle().includes(valueText)))
        || (valueText === '' || (valueText !== null && this.learnsets[i].getDescription().includes(valueText))))
        && (valueClass === '' || (valueClass !== null && this.learnsets[i].getClass().includes(valueClass)))
        && (valueGrade === '' || (valueGrade !== null && this.learnsets[i].getGrade().includes(valueGrade)))
        && (valueSubject === '' || (valueSubject !== null && this.learnsets[i].getSubject().includes(valueSubject)))
        && (valueLanguage === '' || (valueLanguage !== null && this.learnsets[i].getLanguage().includes(valueLanguage)))
        && (valueCreator === '' || (valueCreator !== null && this.learnsets[i].getOwnerName().includes(valueCreator)))
        && (valueCreatedAfter === '' || (valueCreatedAfter !== null && valueCreatedAfter <= this.learnsets[i].getCreated()))
        && (valueCreatedBefore === '' || (valueCreatedBefore !== null && valueCreatedBefore >= this.learnsets[i].getCreated()))
        && (valueEditedAfter === '' || (valueEditedAfter !== null && valueEditedAfter <= this.learnsets[i].getEdited()))
        && (valueEditedBefore === '' || (valueEditedBefore !== null && valueEditedBefore >= this.learnsets[i].getEdited()))){
        this.displayLearnsets.push(this.learnsets[i].getId());
      }
    }
  }

  clearSelection() {
    for(let i=0; i<this.learnsets.length; i++) {
      this.formControls[this.learnsets[i].getId()].setValue(false);
      this.updateSelectionCount();
    }
  }

  submit() {
    let selectedLearnsets: string[] = [];
    for(let i=0; i<this.learnsets.length; i++) {
      if(this.formControls[this.learnsets[i].getId()].value) {
        selectedLearnsets.push(this.learnsets[i].getId());
      }
    }
    if (selectedLearnsets.length === 0) {
      alert('Bitte wählen Sie mindestens ein Lernset aus.');
    } else {
      this.router.navigate(['/lernsets/lernen/' + selectedLearnsets.join('.')]).then(_ => {});
    }
  }

  toggleFormControl(id: string) {
    this.formControls[id].setValue(!this.formControls[id].value);
    this.updateSelectionCount();
  }

  protected readonly setTimeout = setTimeout;
}
