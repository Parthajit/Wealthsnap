/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useLiveQuery } from 'dexie-react-hooks';
import { db } from './db';
import { Account, Transaction, AppState } from './types';

export function useWealthData() {
  const accounts = useLiveQuery(() => db.accounts.toArray()) || [];
  const transactions = useLiveQuery(() => db.transactions.orderBy('date').reverse().toArray()) || [];
  const weeklyGoalSetting = useLiveQuery(() => db.settings.get('weeklyGoal'));
  const currencySetting = useLiveQuery(() => db.settings.get('currency'));

  const state: AppState = {
    accounts,
    transactions,
    weeklyGoal: weeklyGoalSetting?.value ?? 500,
    currency: currencySetting?.value ?? { code: 'USD', symbol: '$' },
  };

  const addAccount = async (account: Omit<Account, 'id'>) => {
    const id = crypto.randomUUID();
    await db.accounts.add({
      ...account,
      id,
    });
  };

  const updateAccount = async (id: string, updates: Partial<Account>) => {
    await db.accounts.update(id, updates);
  };

  const deleteAccount = async (id: string) => {
    await db.transaction('rw', db.accounts, db.transactions, async () => {
      await db.accounts.delete(id);
      await db.transactions.where('accountId').equals(id).delete();
    });
  };

  const addTransaction = async (transaction: Omit<Transaction, 'id'>) => {
    const id = crypto.randomUUID();
    
    await db.transaction('rw', db.accounts, db.transactions, async () => {
      await db.transactions.add({
        ...transaction,
        id,
      });

      // Update account balance
      const account = await db.accounts.get(transaction.accountId);
      if (account) {
        const balanceChange = transaction.type === 'income' ? transaction.amount : -transaction.amount;
        await db.accounts.update(account.id, { balance: account.balance + balanceChange });
      }
    });
  };

  const updateTransaction = async (id: string, updates: Partial<Transaction>) => {
    await db.transaction('rw', db.accounts, db.transactions, async () => {
      const oldTransaction = await db.transactions.get(id);
      if (!oldTransaction) return;

      // Revert old transaction's impact
      const oldAccount = await db.accounts.get(oldTransaction.accountId);
      if (oldAccount) {
        const oldBalanceChange = oldTransaction.type === 'income' ? -oldTransaction.amount : oldTransaction.amount;
        await db.accounts.update(oldAccount.id, { balance: oldAccount.balance + oldBalanceChange });
      }

      // Perform transaction update
      const updatedTransaction = { ...oldTransaction, ...updates };
      await db.transactions.put(updatedTransaction);

      // Apply new transaction's impact
      const newAccount = await db.accounts.get(updatedTransaction.accountId);
      if (newAccount) {
        const newBalanceChange = updatedTransaction.type === 'income' ? updatedTransaction.amount : -updatedTransaction.amount;
        await db.accounts.update(newAccount.id, { balance: newAccount.balance + newBalanceChange });
      }
    });
  };

  const deleteTransaction = async (id: string) => {
    await db.transaction('rw', db.accounts, db.transactions, async () => {
      const transaction = await db.transactions.get(id);
      if (transaction) {
        // Revert account balance
        const account = await db.accounts.get(transaction.accountId);
        if (account) {
          const balanceChange = transaction.type === 'income' ? -transaction.amount : transaction.amount;
          await db.accounts.update(account.id, { balance: account.balance + balanceChange });
        }
        await db.transactions.delete(id);
      }
    });
  };

  const setWeeklyGoal = async (goal: number) => {
    await db.settings.put({ key: 'weeklyGoal', value: goal });
  };

  const setCurrency = async (code: string, symbol: string) => {
    await db.settings.put({ key: 'currency', value: { code, symbol } });
  };

  const exportBackup = () => {
    const backupData = {
      accounts,
      transactions,
      settings: [
        { key: 'weeklyGoal', value: state.weeklyGoal },
        { key: 'currency', value: state.currency }
      ]
    };
    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `wealthsnap_backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const importBackup = async (jsonData: any) => {
    if (!jsonData || !Array.isArray(jsonData.accounts) || !Array.isArray(jsonData.transactions)) {
      throw new Error('Invalid backup file format');
    }
    await db.transaction('rw', db.accounts, db.transactions, db.settings, async () => {
      await db.accounts.clear();
      await db.transactions.clear();
      await db.settings.clear();

      await db.accounts.bulkAdd(jsonData.accounts);
      await db.transactions.bulkAdd(jsonData.transactions);
      if (Array.isArray(jsonData.settings)) {
        await db.settings.bulkAdd(jsonData.settings);
      }
    });
  };

  return {
    state,
    addAccount,
    updateAccount,
    deleteAccount,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    setWeeklyGoal,
    setCurrency,
    exportBackup,
    importBackup,
  };
}
