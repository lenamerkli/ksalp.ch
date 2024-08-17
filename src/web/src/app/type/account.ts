import moment from "moment";

export class Account{
  private readonly id: string = '';
  private readonly name: string = '';
  private readonly newsletter: boolean = false;
  private readonly theme: string = 'light';
  private readonly iframe: boolean = false;
  private readonly payment: string = '2000-01-01';
  private readonly payment_lite: string = '2000-01-01';
  private readonly search: string = 'Startpage';
  private readonly classes: string[] = [];
  private readonly grade: string = '-';
  private readonly favorites: string[] = [];
  private readonly valid: boolean;
  private readonly paid: boolean;
  private readonly paidLite: boolean;

  constructor(dto: AccountDto) {
    this.valid = dto.valid;
    this.paid = dto.paid;
    this.paidLite = dto.paidLite;
    if(dto.info !== null){
      this.id = dto.info.id_;
      this.name = dto.info.name;
      this.newsletter = dto.info.newsletter;
      this.theme = dto.info.theme;
      this.iframe = dto.info.iframe;
      this.payment = dto.info.payment;
      this.payment_lite = dto.info.payment_lite;
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

  public getPaymentLite(): string{
    return this.payment_lite;
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

  public isPaidLite(): boolean{
    return this.paidLite;
  }

  public paymentEnd(): moment.Moment{
    return moment.utc(this.payment);
  }

  public paymentLiteEnd(): moment.Moment{
    return moment.utc(this.payment_lite);
  }
}
export interface AccountDto{
  valid: boolean;
  paid: boolean;
  paidLite: boolean;
  info: {
    id_: string,
    name: string,
    newsletter: boolean,
    theme: string,
    iframe: boolean,
    payment: string,
    payment_lite: string,
    search: string,
    classes: string[],
    grade: string,
    favorites: string[],
  } | null;
}
