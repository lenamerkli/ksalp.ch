import { Component } from '@angular/core';
import {Title} from "@angular/platform-browser";
import {HttpClient} from "@angular/common/http";
import {ActivatedRoute} from "@angular/router";

@Component({
  selector: 'app-news',
  standalone: true,
  imports: [],
  templateUrl: './news.component.html',
  styleUrl: './news.component.scss'
})
export class NewsComponent {
  page: string = 'index';
  content: string = '<p>Lädt..</p>';

  constructor(
    private httpClient: HttpClient,
    private activatedRoute: ActivatedRoute,
    private titleService: Title,
  ) {
    this.titleService.setTitle('News - [ksalp.ch]');
    this.activatedRoute.params.subscribe({
      next: (params) => {
        this.page = params['id'];
        this.update();
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

  update(): void {
    this.httpClient.get<Dto>('/api/v1/news/' + this.page).subscribe({
      next: (value) => {
        if (value.content) {
          this.content = value.content;
        } else {
          alert(value.message);
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
  }
}

interface Dto {
  status?: string;
  message?: string;
  error?: string;
  content?: string;
}
