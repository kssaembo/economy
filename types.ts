
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
  teacherId?: string; // Tenant identifier
  teacherAlias?: string; // e.g., "권쌤" replacement
  currencyUnit?: string; // e.g., "권" replacement
}

export interface TeacherAccount {
  id: string;
  loginId: string;
  alias: string;
  currencyUnit: string;
  recoveryCode: string;
}

export interface Account {
  id: string;
  accountId: string;
  userId: string;
  balance: number;
  qrToken?: string;
  teacherId: string;
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
  TAX = 'Tax',
  FUND_JOIN = 'FundJoin',
  FUND_PAYOUT = 'FundPayout',
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
  teacherId: string;
}

export interface StockProduct {
  id: string;
  name: string;
  currentPrice: number;
  stockAccountId: string;
  volatility?: number;
  teacherId: string;
}

export interface StockProductWithDetails extends StockProduct {
  totalQuantity: number;
  valuation: number;
}

export interface StockHistory {
  id: string;
  stockId: string;
  price: number;
  createdAt: string;
}

export interface StudentStock {
  userId: string;
  stockId: string;
  quantity: number;
  purchasePrice: number;
  stock?: StockProduct;
  teacherId: string;
}

export interface SavingsProduct {
  id: string;
  name: string;
  maturityDays: number;
  rate: number;
  cancellationRate: number;
  maxAmount: number;
  teacherId: string;
}

export interface StudentSaving {
  savingId: string;
  userId: string;
  productId: string;
  amount: number;
  joinDate: string;
  maturityDate: string;
  product?: SavingsProduct;
  teacherId: string;
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
  teacherId: string;
}

export interface TaxItem {
    id: string;
    name: string;
    amount: number;
    dueDate: string;
    createdAt: string;
    teacherId: string;
}

export interface TaxRecipient {
    id: string;
    taxId: string;
    studentUserId: string;
    isPaid: boolean;
    paidAt?: string;
}

export interface TaxItemWithRecipients extends TaxItem {
    recipients: TaxRecipient[];
}

export enum FundStatus {
  RECRUITING = 'RECRUITING',
  ONGOING = 'ONGOING',
  SUCCESS = 'SUCCESS',
  EXCEED = 'EXCEED',
  FAIL = 'FAIL'
}

export interface Fund {
  id: string;
  name: string;
  description: string;
  creatorId: string;
  creatorName?: string;
  teacherId: string;
  unitPrice: number;
  targetAmount: number;
  baseReward: number;
  incentiveReward: number;
  recruitmentDeadline: string;
  maturityDate: string;
  status: FundStatus;
  createdAt: string;
  totalInvestedAmount?: number;
  investorCount?: number;
}

export interface FundInvestment {
  id: string;
  fundId: string;
  studentUserId: string;
  units: number;
  investedAt: string;
  fund?: Fund;
}
