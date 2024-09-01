import {Component, ElementRef, OnInit, ViewChild} from '@angular/core';
import {LearnSet, LearnSetDto} from "../../../type/learnset";
import {LearnsetExercise, LearnsetExerciseDto} from "../../../type/learnset_exercise";
import {HttpClient} from "@angular/common/http";
import {AccountService} from "../../../service/account.service";
import {ActivatedRoute} from "@angular/router";
import {Account} from "../../../type/account";
import {MatDivider} from "@angular/material/divider";
import {MatFormField, MatLabel} from "@angular/material/form-field";
import {MatInput} from "@angular/material/input";
import {MatButton} from "@angular/material/button";
import {DefaultResponseDto} from "../../../type/defaulf-response";
import {Title} from "@angular/platform-browser";

@Component({
  selector: 'app-lernen',
  standalone: true,
  imports: [
    MatDivider,
    MatFormField,
    MatInput,
    MatLabel,
    MatButton,
  ],
  templateUrl: './lernen.component.html',
  styleUrl: './lernen.component.scss'
})
export class LernenComponent implements OnInit {
  @ViewChild('userInput') userInput: ElementRef | null = null;

  maxLineLength = 96;

  learnsets: LearnSet[] = [];
  exercises: LearnsetExercise[] = [];
  ids: string[] = [];

  stats: {[key: string]: {'correct': number, 'wrong': number}} = {};
  current: string = '';
  window: string = 'question';

  data: {[key: string]: string} = {
    'question': '',
    'answer': '',
    'userAnswer': '',
  };

  statsString: string = '';
  connectionError: boolean = false;

  account: Account | null = null;

  constructor(
    private httpClient: HttpClient,
    private accountService: AccountService,
    private activatedRoute: ActivatedRoute,
    private titleService: Title,
  ) {
    this.titleService.setTitle('Lernen - [ksalp.ch]');
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

  ngOnInit() {
    this.activatedRoute.params.subscribe({
      next: (params) => {
        this.ids = params['ids'].split('.');
        if(this.ids.length > 0) {
          this.httpClient.get<Dto>('/api/v1/learnsets/bulk/' + this.ids.join('.')).subscribe({
            next: (value) => {
              if (value.learnsets && value.exercises) {
                for(let learnset of value.learnsets) {
                  this.learnsets.push(new LearnSet(learnset));
                }
                for(let exercise of value.exercises) {
                  this.exercises.push(new LearnsetExercise(exercise));
                }
                if (value.stats) {
                  this.stats = value.stats;
                }
                this.nextExercise();
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
          });
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
    });
  }

  updateStats() {
    let newString: string = '';
    let names: string[] = [];
    for(let learnset of this.learnsets) {
      names.push('[' + learnset.getSubject().toUpperCase() + '] ' + learnset.getTitle());
    }
    names.sort();
    let namesString: string = names.join(', ');
    if (namesString.length > this.maxLineLength) {
      namesString = namesString.substring(0, this.maxLineLength - 3) + '...';
    }
    newString += namesString + '\n';
    let correct: number = 0;
    let wrong: number = 0;
    let answered: number = 0;
    for(let id in this.stats) {
      if(this.stats.hasOwnProperty(id)) {
        answered++;
        correct += this.stats[id].correct;
        wrong += this.stats[id].wrong;
      }
    }
    newString += 'Antworten: ' + (correct + wrong).toString() + ' | Fortschritt: '
    let total: number = Object.keys(this.exercises).length;
    if(total > 0){
      newString += Math.round(((correct + wrong) / total) * 100);
    } else {
      newString += '--';
    }
    newString += '% | Note: ';
    if((correct + wrong) > 0) {
      newString += '~' + (Math.round((((correct / (correct + wrong)) * 5) + 1) * 10) / 10).toString();
    } else {
      newString += '-';
    }
    newString += ' | Total: ' + total.toString();
    let currentLearnset = this.learnsets.find(i => i.getId() === this.exercises.find(j => j.getId() === this.current)?.getSetId());
    if (currentLearnset) {
      newString += '\nAufgabe #' + this.current + ' vom Lernset [' + currentLearnset.getSubject().toUpperCase() + '] ' + currentLearnset.getTitle();
    } else {
      newString += '\nAufgabe #' + this.current;
    }
    this.statsString = newString;
  }

  nextExercise() {
    this.connectionError = false;
    this.window = 'loading';
    this.updateStats();
    let chances: {[key: string]: number} = {};
    for(let i=0; i<this.exercises.length; i++) {
      let id = this.exercises[i].getId();
      if(this.stats.hasOwnProperty(id)) {
        if(this.stats[id].wrong > this.stats[id].correct) {
          chances[id] = 10 * this.exercises[i].getFrequency();
        } else {
          chances[id] = Math.max(0.05, 3 * this.stats[id].wrong - 2 * this.stats[id].correct) * this.exercises[i].getFrequency();
        }
      } else{
        chances[id] = 4 * this.exercises[i].getFrequency() + 1;
      }
    }
    let total: number = 0.0;
    for(let i=0; i<this.exercises.length; i++) {
      total += chances[this.exercises[i].getId()];
    }
    let random: number = Math.random() * total;
    let next_exercise: string = '';
    let total2: number = 0.0;
    for(let i=0; i<this.exercises.length; i++) {
      total2 += chances[this.exercises[i].getId()];
      if(total2 > random) {
        next_exercise = this.exercises[i].getId();
        break;
      }
    }
    this.current = next_exercise;
    this.data['question'] = this.exercises.find(i => i.getId() === next_exercise)?.getQuestion() ?? '';
    this.window = 'question';
    this.updateStats();
    if(this.userInput) {
      this.userInput.nativeElement.value = '';
    }
    setTimeout(() => {
      document.getElementById('answer')?.focus();
    }, 1);
  }

  saveAnswer(input: string, value: boolean) {
    if(value) {
      if (this.stats.hasOwnProperty(this.current)) {
        this.stats[this.current].correct++;
      } else {
        this.stats[this.current] = {'correct': 1, 'wrong': 0};
      }
    } else {
      if (this.stats.hasOwnProperty(this.current)) {
        this.stats[this.current].wrong++;
      } else {
        this.stats[this.current] = {'correct': 0, 'wrong': 1};
      }
    }
    if (this.account !== null && this.account?.isValid()) {
      this.httpClient.post<DefaultResponseDto>('/api/v1/learnsets/answer/' + this.current,
        JSON.stringify({answer: input, value: value}), {headers: {'Content-Type': 'application/json'}}
      ).subscribe({
        next: (value) => {
          if (value.status !== 'success') {
            this.connectionError = true;
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
      });
    }
  }

  continue() {
    this.connectionError = false;
    if(this.userInput === null){
      return;
    }
    let input = this.userInput.nativeElement.value;
    this.window = 'loading';
    let current_exercise = this.exercises.find(i => i.getId() === this.current);
    if(current_exercise === undefined) {
      return;
    }
    if(input === current_exercise.getAnswer() || current_exercise.getAnswers().includes(input)) {
      this.saveAnswer(input, true);
      this.nextExercise();
    } else {
      this.data['answer'] = current_exercise.getAnswer();
      this.data['userAnswer'] = input;
      this.window = 'answer';
      setTimeout(() => {
        document.getElementById('correct-button')?.focus();
      }, 1);
    }
    this.updateStats();
  }

  submit(value: boolean){
    if(this.userInput === null){
      this.nextExercise();
      return;
    }
    let input = this.userInput.nativeElement.value;
    this.saveAnswer(input, value);
    this.nextExercise();
  }

  keydown(event: any) {
    if(event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.continue();
    }
  }
}

interface Dto{
  status?: string;
  message?: string;
  error?: string;
  learnsets?: LearnSetDto[];
  exercises?: LearnsetExerciseDto[];
  stats?: {[key: string]: {correct: number, wrong: number}};
}
