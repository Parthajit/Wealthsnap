/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type AccountType = 'Bank' | 'Cash' | 'Investment' | 'Savings' | 'Physical';

export interface Account {
  id: string;
  name: string;
  type: AccountType;
  balance: number;
  openingBalance: number;
  openingDate: string;
  icon: string;
  details?: string; // e.g., "**** 8842" or "4.50% APY"
  accountNumber?: string;
}

export type TransactionType = 'expense' | 'income';

export interface Transaction {
  id: string;
  accountId: string;
  amount: number;
  type: TransactionType;
  category: string;
  date: string;
  note: string;
}

export interface AppState {
  accounts: Account[];
  transactions: Transaction[];
  weeklyGoal: number;
  currency?: { code: string; symbol: string };
}

export const CATEGORIES = [
  { id: 'food', name: 'Food', icon: 'UtensilsCrossed' },
  { id: 'transport', name: 'Transport', icon: 'Car' },
  { id: 'rent', name: 'Rent', icon: 'Home' },
  { id: 'shopping', name: 'Shopping', icon: 'ShoppingBag' },
  { id: 'entertainment', name: 'Entertainment', icon: 'Gamepad' },
  { id: 'health', name: 'Health', icon: 'HeartPulse' },
  { id: 'salary', name: 'Salary', icon: 'Briefcase' },
  { id: 'other', name: 'Other', icon: 'MoreHorizontal' },
];

export const ACCOUNT_ICONS = [
  { id: 'bank', icon: 'Landmark' },
  { id: 'wallet', icon: 'Wallet' },
  { id: 'chart', icon: 'TrendingUp' },
  { id: 'piggy', icon: 'PiggyBank' },
  { id: 'card', icon: 'CreditCard' },
];
