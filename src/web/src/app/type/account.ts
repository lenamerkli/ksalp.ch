export class Account{
  private readonly name: string = '';
  private readonly valid: boolean;

  constructor(dto: AccountDto) {
    this.valid = dto.valid;
    if(dto.info !== null){
      this.name = dto.info.name;
    }
  }

  public getName(): string{
    return this.name
  }

  public isValid(): boolean{
    return this.valid
  }
}
export interface AccountDto{
  valid: boolean;
  info: {
    name: string
  } | null
}
