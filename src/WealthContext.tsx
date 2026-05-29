/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, ReactNode } from 'react';
import { useWealthData } from './useWealthData';
import { AppState, Account, Transaction } from './types';

interface WealthContextType {
  state: AppState;
  addAccount: (account: Omit<Account, 'id'>) => Promise<void>;
  updateAccount: (id: string, updates: Partial<Account>) => Promise<void>;
  deleteAccount: (id: string) => Promise<void>;
  addTransaction: (transaction: Omit<Transaction, 'id'>) => Promise<void>;
  updateTransaction: (id: string, updates: Partial<Transaction>) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  setWeeklyGoal: (goal: number) => Promise<void>;
  setCurrency: (code: string, symbol: string) => Promise<void>;
  exportBackup: () => void;
  importBackup: (jsonData: any) => Promise<void>;
}

const WealthContext = createContext<WealthContextType | undefined>(undefined);

export function WealthProvider({ children }: { children: ReactNode }) {
  const wealthData = useWealthData();
  return (
    <WealthContext.Provider value={wealthData}>
      {children}
    </WealthContext.Provider>
  );
}

export function useWealth() {
  const context = useContext(WealthContext);
  if (context === undefined) {
    throw new Error('useWealth must be used within a WealthProvider');
  }
  return context;
}
