import {Component, OnInit} from '@angular/core';
import {ActivatedRoute, RouterLink} from "@angular/router";
import {Document, DocumentDto} from "../../../type/document";
import {HttpClient} from "@angular/common/http";
import {AccountService} from "../../../service/account.service";
import {Account} from "../../../type/account";
import {MatDivider} from "@angular/material/divider";
import {MatAnchor, MatButton} from "@angular/material/button";
import {DomSanitizer, SafeUrl, Title} from "@angular/platform-browser";

@Component({
  selector: 'app-vorschau',
  standalone: true,
  imports: [
    MatDivider,
    MatButton,
    RouterLink,
    MatAnchor
  ],
  templateUrl: './vorschau.component.html',
  styleUrl: './vorschau.component.scss'
})
export class VorschauComponent{
  documentId: string | null = null;
  document: Document | null = null;
  documentUrl: SafeUrl | null = null;
  documentUrlFrame: SafeUrl | null = null;

  account: Account | null = null;

  previewAvailable: boolean = false;
  mimetypePreviews: string[] = [
    'application/json',
    'application/pdf',
    'application/rtf',
    'application/xml',
    'image/gif',
    'image/jpeg',
    'image/png',
    'image/svg+xml',
    'image/tiff',
    'image/webp',
    'image/x-icon',
    'text/csv',
    'text/plain',
    'video/mp4',
    'video/mpeg',
    'video/webm',
  ]

  constructor(
    private activatedRoute: ActivatedRoute,
    private httpClient: HttpClient,
    private accountService: AccountService,
    private domSanitizer: DomSanitizer,
    private titleService: Title,
  ) {
    this.titleService.setTitle('Dokument Vorschau - [ksalp.ch]');
    this.activatedRoute.params.subscribe({
      next: (params) => {
        this.documentId = params['id'];
        this.httpClient.get<Dto>('/api/v1/documents/data/' + this.documentId).subscribe({
          next: (value) => {
            if (value.document) {
              this.document = new Document(value.document);
              let filename = this.getSaveFilename();
              let url = '/dateien/dokumente/' + this.documentId + '/' + filename;
              this.documentUrl = this.domSanitizer.bypassSecurityTrustResourceUrl(url);
              this.documentUrlFrame = this.domSanitizer.bypassSecurityTrustResourceUrl(url + '#view=FitH');
              this.previewAvailable = this.mimetypePreviews.includes(this.document.getMimetype());
              this.titleService.setTitle('Dokument `[' + this.document.getSubject().toUpperCase() + '] ' + this.document.getTitle() + '` - [ksalp.ch]');
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
  }

  getSaveFilename(): string {
    if (this.document !== null) {
      let filename = this.document.getTitle() + '.' + this.document.getExtension();
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
  document?: DocumentDto;
}
