export class LearnSet{
  private readonly id: string = '';
  private readonly title: string = '';
  private readonly subject: string = '';
  private readonly description: string = '';
  private readonly class_: string = '';
  private readonly grade: string = '';
  private readonly language: string = '';
  private readonly owner: string = '';
  private readonly owner_name: string = '';
  private readonly edited: string = '';
  private readonly created: string = '';
  private readonly size: number = 0;
  constructor(dto: LearnSetDto) {
    this.id = dto.id_;
    this.title = dto.title;
    this.subject = dto.subject;
    this.description = dto.description;
    this.class_ = dto.class_;
    this.grade = dto.grade;
    this.language = dto.language;
    this.owner = dto.owner;
    this.owner_name = dto.owner_name;
    this.edited = dto.edited;
    this.created = dto.created;
    this.size = dto.size;
  }
  public getId(): string{
    return this.id;
  }
  public getTitle(): string{
    return this.title;
  }
  public getSubject(): string{
    return this.subject;
  }
  public getDescription(): string{
    return this.description;
  }
  public getClass(): string{
    return this.class_;
  }
  public getGrade(): string{
    return this.grade;
  }
  public getLanguage(): string{
    return this.language;
  }
  public getOwner(): string{
    return this.owner;
  }
  public getOwnerName(): string{
    return this.owner_name;
  }
  public getEdited(): string{
    return this.edited;
  }
  public getCreated(): string{
    return this.created;
  }
  public getSize(): number{
    return this.size;
  }
}


export interface LearnSetDto{
  id_: string;
  title: string;
  subject: string;
  description: string;
  class_: string;
  grade: string;
  language: string;
  owner: string;
  owner_name: string;
  edited: string;
  created: string;
  size: number;
}


export interface LearnSetsDto{
  status: string;
  message: string;
  learnsets: LearnSetDto[];
}
