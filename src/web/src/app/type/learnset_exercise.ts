export class LearnsetExercise{
  private readonly id_: string = '';
  private readonly set_id: string = '';
  private readonly question: string = '';
  private readonly answer: string = '';
  private readonly answers: string[] = [];
  private readonly frequency: number = 0;
  private readonly auto_check: number = 0;
  constructor(dto: LearnsetExerciseDto) {
    this.id_ = dto.id_;
    this.set_id = dto.set_id;
    this.question = dto.question;
    this.answer = dto.answer;
    this.answers = dto.answers;
    this.frequency = dto.frequency;
    this.auto_check = dto.auto_check;
  }

  public getId(): string{
    return this.id_;
  }

  public getSetId(): string{
    return this.set_id;
  }

  public getQuestion(): string{
    return this.question;
  }

  public getAnswer(): string{
    return this.answer;
  }

  public getAnswers(): string[]{
    return this.answers;
  }

  public getFrequency(): number{
    return this.frequency;
  }

  public getAutoCheck(): number{
    return this.auto_check;
  }

  public countAnswers(): number{
    if (this.answers.includes(this.answer)){
      return this.answers.length - 1;
    }else{
      return this.answers.length;
    }
  }
}


export interface LearnsetExerciseDto{
  id_: string;
  set_id: string;
  question: string;
  answer: string;
  answers: string[];
  frequency: number;
  auto_check: number;
}
