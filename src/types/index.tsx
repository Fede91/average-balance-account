export enum CalendarLanguages {
  IT = "IT"
}

export type LangMonths = {
  [LangKey in CalendarLanguages]: string[];
};

export interface Transaction {
  key: number;
  date: string;
  amount: number;
}

export interface Balance {
  key: number;
  date: string;
  amount: number;
  totalAmount: number;
}

export interface CreditorNumber {
  key: number;
  numDays: number;
  amount: number;
  total: number;
}
