export class Account{
  private readonly name: string = '';
  private readonly classes: string[] = [];
  private readonly valid: boolean;

  constructor(dto: AccountDto) {
    this.valid = dto.valid;
    if(dto.info !== null){
      this.name = dto.info.name;
      this.classes = dto.info.classes;
    }
  }

  public getName(): string{
    return this.name
  }

  public getClasses(): string[]{
    return this.classes;
  }

  public isValid(): boolean{
    return this.valid
  }
}
export interface AccountDto{
  valid: boolean;
  info: {
    name: string,
    classes: string[],
  } | null;
}
