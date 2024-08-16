export class Calendar{
  private readonly id_: string = '';
  private readonly owner: string = '';
  private readonly access: string = '';
  private readonly name: string = '';
  private readonly color: string = '';
  private readonly ownerName: string = '';

  constructor(dto: CalendarDto) {
    this.id_ = dto.id_;
    this.owner = dto.owner;
    this.access = dto.access;
    this.name = dto.name;
    this.color = dto.color;
    this.ownerName = dto.ownerName;
  }

  getId(): string {
    return this.id_;
  }

  getOwner(): string {
    return this.owner;
  }

  getAccess(): string {
    return this.access;
  }

  getName(): string {
    return this.name;
  }

  getColor(): string {
    return this.color;
  }

  getOwnerName(): string {
    return this.ownerName;
  }
}

export interface CalendarDto{
  id_: string;
  owner: string;
  access: string;
  name: string;
  color: string;
  ownerName: string;
}
