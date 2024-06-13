export interface ConstantDto {
  extensions: {
    [key: string]: string
  };
  extensionsReverse: {
    [key: string]: string};
  fileTypes: string[];
  grades: string[];
  languages: string[];
  searchEngines: {
    [key: string]: {
      'url': string,
      'recommended': boolean,
    }
  };
  sizeUnits: string[];
  subjects: {
    [key: string]: string
  };
  themes: {
    [key: string]: string
  };
}
