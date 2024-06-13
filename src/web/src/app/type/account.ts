import moment from "moment";

export class Account{
  private readonly id: string = '';
  private readonly name: string = '';
  private readonly newsletter: boolean = false;
  private readonly theme: string = 'light';
  private readonly iframe: boolean = false;
  private readonly payment: string = '2000-01-01';
  private readonly search: string = 'Startpage';
  private readonly classes: string[] = [];
  private readonly grade: string = '-';
  private readonly favorites: string[] = [];
  private readonly valid: boolean;
  private readonly paid: boolean;

  constructor(dto: AccountDto) {
    this.valid = dto.valid;
    this.paid = dto.paid;
    if(dto.info !== null){
      this.id = dto.info.id_;
      this.name = dto.info.name;
      this.newsletter = dto.info.newsletter;
      this.theme = dto.info.theme;
      this.iframe = dto.info.iframe;
      this.payment = dto.info.payment;
      this.search = dto.info.search;
      this.classes = dto.info.classes;
      this.grade = dto.info.grade;
      this.favorites = dto.info.favorites;
    }
  }

  public getId(): string{
    return this.id;
  }

  public getName(): string{
    return this.name;
  }

  public getNewsletter(): boolean{
    return this.newsletter;
  }

  public getTheme(): string{
    return this.theme;
  }

  public getIframe(): boolean{
    return this.iframe;
  }

  public getPayment(): string{
    return this.payment;
  }

  public getSearch(): string{
    return this.search;
  }

  public getClasses(): string[]{
    return this.classes;
  }

  public getGrade(): string{
    return this.grade;
  }

  public getFavorites(): string[]{
    return this.favorites;
  }

  public isValid(): boolean{
    return this.valid;
  }

  public isPaid(): boolean{
    return this.paid;
  }

  public paymentEnd(): moment.Moment{
    return moment.utc(this.payment);
  }
}
export interface AccountDto{
  valid: boolean;
  paid: boolean;
  info: {
    id_: string,
    name: string,
    newsletter: boolean,
    theme: string,
    iframe: boolean,
    payment: string,
    search: string,
    classes: string[],
    grade: string,
    favorites: string[],
  } | null;
}
