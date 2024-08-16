export class CalendarEvent{
  private readonly id_: string = '';
  private readonly calendar: string = '';
  private readonly title: string = '';
  private readonly description: string = '';
  private readonly start: string = '';
  private readonly end: string = '';
  private readonly color: string = '';
  private readonly schulnetz: string = '';

  constructor(dto: CalendarEventDto) {
    this.id_ = dto.id_;
    this.calendar = dto.calendar;
    this.title = dto.title;
    this.description = dto.description;
    this.start = dto.start;
    this.end = dto.end;
    this.color = dto.color;
    this.schulnetz = dto.schulnetz;
  }

  getId(): string {
    return this.id_;
  }

  getCalendar(): string {
    return this.calendar;
  }

  getTitle(): string {
    return this.title;
  }

  getDescription(): string {
    return this.description;
  }

  getStart(): string {
    return this.start;
  }

  getEnd(): string {
    return this.end;
  }

  getColor(): string {
    return this.color;
  }

  getSchulnetz(): string {
    return this.schulnetz;
  }
}

export interface CalendarEventDto{
  id_: string;
  calendar: string;
  title: string;
  description: string;
  start: string;
  end: string;
  color: string;
  schulnetz: string;
}
