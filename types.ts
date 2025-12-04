
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
  id: string;
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
}

export interface StockProduct {
  id: string;
  name: string;
  currentPrice: number;
  stockAccountId: string;
  volatility?: number; // Price sensitivity (0.01 - 1.0)
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

export interface TaxItem {
    id: string;
    name: string;
    amount: number;
    dueDate: string;
    createdAt: string;
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

// --- Fund Types ---

export enum FundStatus {
  RECRUITING = 'RECRUITING', // 모집중
  ONGOING = 'ONGOING',       // 운영중 (평가대기)
  SUCCESS = 'SUCCESS',       // 달성
  EXCEED = 'EXCEED',         // 초과달성
  FAIL = 'FAIL'              // 실패
}

export interface Fund {
  id: string;
  name: string;
  description: string;
  creatorId: string; // 펀드 제안 학생 ID
  creatorName?: string; // 조인된 학생 이름
  teacherId: string;
  unitPrice: number; // 1좌당 가격
  targetAmount: number; // 목표 금액 (참고용)
  baseReward: number; // 달성 시 보상 (좌당)
  incentiveReward: number; // 초과 달성 시 추가 보상 (좌당)
  recruitmentDeadline: string; // 모집 마감일
  maturityDate: string; // 펀드 종료(평가)일
  status: FundStatus;
  createdAt: string;
  totalInvestedAmount?: number; // 총 투자된 금액 (계산됨)
  investorCount?: number; // 투자자 수 (계산됨)
}

export interface FundInvestment {
  id: string;
  fundId: string;
  studentUserId: string;
  units: number;
  investedAt: string;
  fund?: Fund;
}
