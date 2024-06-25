export class Document{
  private readonly id: string = '';
  private readonly title: string = '';
  private readonly subject: string = '';
  private readonly description: string = '';
  private readonly class_: string = '';
  private readonly grade: string = '';
  private readonly language: string = '';
  private readonly owner: string = '';
  private readonly edited: string;
  private readonly created: string = '';
  private readonly extension: string = '';
  private readonly mimetype: string = '';
  private readonly size: number = 0;
  private readonly formated_size: string = '';
  private readonly owner_name: string = '';
  constructor(dto: DocumentDto) {
    this.id = dto.id_;
    this.title = dto.title;
    this.subject = dto.subject;
    this.description = dto.description;
    this.class_ = dto.class_;
    this.grade = dto.grade;
    this.language = dto.language;
    this.owner = dto.owner;
    this.edited = dto.edited;
    this.created = dto.created;
    this.extension = dto.extension;
    this.mimetype = dto.mimetype;
    this.size = dto.size;
    this.formated_size = dto.formated_size;
    this.owner_name = dto.owner_name;
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

  public getEdited(): string{
    return this.edited;
  }

  public getCreated(): string{
    return this.created;
  }

  public getExtension(): string{
    return this.extension;
  }

  public getMimetype(): string{
    return this.mimetype;
  }

  public getSize(): number{
    return this.size;
  }

  public getFormatedSize(): string{
    return this.formated_size;
  }

  public getOwnerName(): string{
    return this.owner_name;
  }
}


export interface DocumentDto{
  id_: string;
  title: string;
  subject: string;
  description: string;
  class_: string;
  grade: string;
  language: string;
  owner: string;
  edited: string;
  created: string;
  extension: string;
  mimetype: string;
  size: number;
  formated_size: string;
  owner_name: string;
}


export interface DocumentsDto{
  status: string;
  message: string;
  documents: DocumentDto[];
}
