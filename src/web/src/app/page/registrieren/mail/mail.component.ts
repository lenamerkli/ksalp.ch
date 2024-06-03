import {Component, OnInit} from '@angular/core';
import {ActivatedRoute, Router} from "@angular/router";
import {HttpClient} from "@angular/common/http";
import {DefaultResponseDto} from "../../../type/defaulf-response";

@Component({
  selector: 'app-mail',
  standalone: true,
  imports: [],
  templateUrl: './mail.component.html',
  styleUrl: './mail.component.scss'
})
export class MailComponent implements OnInit {
  mail_code: string = '';

  constructor(
    private activatedRoute: ActivatedRoute,
    private httpClient: HttpClient,
    private router: Router,
    ) {}

  ngOnInit(): void {
    this.activatedRoute.params.subscribe((value) => {
      this.mail_code = value['mail_code'];
      this.httpClient.post<DefaultResponseDto>('/api/v1/account/register/continue', JSON.stringify({
        code: this.mail_code,
      })).subscribe({
        next: response => {
          if (response.status && response.status === 'success') {
            this.router.navigate(['/registrieren/fertig']).then();
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
      })
    });
  }
}
