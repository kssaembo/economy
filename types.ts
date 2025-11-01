export enum Role {
  TEACHER = 'teacher',
  STUDENT = 'student',
  MART = 'mart',
  STOCK = 'stock',
  BANKER = 'banker',
}

export interface User {
  userId: string;
  name: string;
  role: Role;
  grade?: number;
  class?: number;
  number?: number;
}

export interface Account {
  accountId: string;
  userId: string;
  balance: number;
  qrToken?: string;
}

export enum TransactionType {
  DEPOSIT = 'Deposit',
  WITHDRAWAL = 'Withdrawal',
  TRANSFER = 'Transfer',
  MART = 'Mart',
  SALARY = 'Salary',
  STOCK_BUY = 'StockBuy',
  STOCK_SELL = 'StockSell',
  SAVINGS_JOIN = 'SavingsJoin',
  SAVINGS_CANCEL = 'SavingsCancel',
  SAVINGS_MATURITY = 'SavingsMaturity',
}

export interface Transaction {
  transactionId: string;
  accountId: string;
  type: TransactionType;
  amount: number;
  date: string;
  description: string;
  senderId?: string;
  receiverId?: string;
}

export interface StockProduct {
  id: string;
  name: string;
  currentPrice: number;
  stockAccountId: string;
}

export interface StudentStock {
  userId: string;
  stockId: string;
  quantity: number;
  purchasePrice: number;
  stock?: StockProduct;
}

export interface SavingsProduct {
  id: string;
  name: string;
  maturityDays: number;
  rate: number;
  cancellationRate: number;
  maxAmount: number;
}

export interface StudentSaving {
  savingId: string;
  userId: string;
  productId: string;
  amount: number;
  joinDate: string;
  maturityDate: string;
  product?: SavingsProduct;
}

export interface AssignedStudent {
  userId: string;
  name: string;
}

export interface Job {
  id: string;
  jobName: string;
  description: string;
  salary: number;
  lastPaidDate?: string;
  incentive: number;
  assigned_students: AssignedStudent[];
}