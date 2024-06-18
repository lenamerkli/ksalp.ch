import { Injectable } from '@angular/core';
import {HttpClient} from "@angular/common/http";
import {ConstantDto} from "../type/constant";
import {BehaviorSubject} from "rxjs";

@Injectable({
  providedIn: 'root'
})
export class ConstantService {

  private extensions: BehaviorSubject<{[key: string]: string}> = new BehaviorSubject<{[key: string]: string}>({});
  private extensionsReverse: BehaviorSubject<{[key: string]: string}> = new BehaviorSubject<{[key: string]: string}>({});
  private fileTypes: BehaviorSubject<string[]> = new BehaviorSubject<string[]>([]);
  private grades: BehaviorSubject<string[]> = new BehaviorSubject<string[]>([]);
  private languages: BehaviorSubject<string[]> = new BehaviorSubject<string[]>([]);
  private searchEngines: BehaviorSubject<{[key: string]: {url: string, recommended: boolean}}> = new BehaviorSubject<{[key: string]: {url: string, recommended: boolean}}>({});
  private sizeUnits: BehaviorSubject<string[]> = new BehaviorSubject<string[]>([]);
  private subjects: BehaviorSubject<{[key: string]: string}> = new BehaviorSubject<{[key: string]: string}>({});
  private themes: BehaviorSubject<{[key: string]: string}> = new BehaviorSubject<{[key: string]: string}>({
    light: 'Hell',
  });
  private imprint: BehaviorSubject<{
    name: string,
    address: string,
    city: string,
    mail: string,
  }> = new BehaviorSubject<{name: string, address: string, city: string, mail: string}>({
    name: 'lädt...',
    address: 'lädt...',
    city: 'lädt...',
    mail: 'lädt...',
  })

  constructor(
    private httpClient: HttpClient,
  ) {
    this.httpClient.get<ConstantDto>('/api/v1/constants').subscribe((value: ConstantDto) => {
      this.extensions.next(value.extensions);
      this.extensionsReverse.next(value.extensionsReverse);
      this.fileTypes.next(value.fileTypes);
      this.grades.next(value.grades);
      this.languages.next(value.languages);
      this.searchEngines.next(value.searchEngines);
      this.sizeUnits.next(value.sizeUnits);
      this.subjects.next(value.subjects);
      this.themes.next(value.themes);
      this.imprint.next(value.imprint);
    });
  }

  getExtensions(): BehaviorSubject<{ [p: string]: string }> {
    return this.extensions;
  }

  getExtensionsReversed(): BehaviorSubject<{ [p: string]: string }> {
    return this.extensionsReverse;
  }

  getFileTypes(): BehaviorSubject<string[]> {
    return this.fileTypes;
  }

  getGrades(): BehaviorSubject<string[]> {
    return this.grades;
  }

  getLanguages(): BehaviorSubject<string[]> {
    return this.languages;
  }

  getSearchEngines(): BehaviorSubject<{ [p: string]: { url: string; recommended: boolean } }> {
    return this.searchEngines;
  }

  getSizeUnits(): BehaviorSubject<string[]> {
    return this.sizeUnits;
  }

  getSubjects(): BehaviorSubject<{ [p: string]: string }> {
    return this.subjects;
  }

  getThemes(): BehaviorSubject<{ [p: string]: string }> {
    return this.themes;
  }

  getImprint(): BehaviorSubject<{
    name: string,
    address: string,
    city: string,
    mail: string,
  }> {
    return this.imprint;
  }
}
