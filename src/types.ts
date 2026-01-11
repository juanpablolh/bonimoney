export interface Member {
  id: string;
  name: string;
  avatarColor?: { bg: string; text: string };
}

export type Currency = 'CLP' | 'USD' | 'BRL' | 'ARS' | 'EUR' | 'GBP' | 'PEN';

export type ExpenseIcon =
  | 'Restaurant'
  | 'Car'
  | 'ShoppingCart'
  | 'Home'
  | 'Airplane'
  | 'GasStation'
  | 'Hospital'
  | 'Education'
  | 'ShoppingBag'
  | 'Cafe'
  | 'Movie'
  | 'Music'
  | 'Gift'
  | 'Receipt'
  | 'Wallet';

export interface Split {
  memberId: string;
  amountOwed: number;
}

export interface Expense {
  id: string;
  description: string;
  amount: number;
  currency: Currency;
  paidBy: string; // member id
  splitBetween: string[]; // array of member ids
  date: Date;
  icon?: ExpenseIcon;
  lastModified?: number; // timestamp
  splits?: Split[]; // Optional splits for advanced calculation
}

export interface Balance {
  memberId: string;
  memberName: string;
  totalPaid: number;
  totalOwed: number;
  balance: number; // positive = they are owed money, negative = they owe money
}

export interface Transaction {
  from: string; // member id
  fromName: string;
  to: string; // member id
  toName: string;
  amount: number;
  currency: Currency;
}

export interface AppData {
  members: Member[];
  expenses: Expense[];
  lastModified?: number; // timestamp
  version?: number; // version number
}
