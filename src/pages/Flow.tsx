/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Plus, Landmark } from 'lucide-react';
import { useWealth } from '../WealthContext';
import { Button } from '../components/UI';
import { Transaction } from '../types';

export default function Flow({ onAddTransaction, onAddAccount, onEditTransaction }: { onAddTransaction: () => void, onAddAccount: () => void, onEditTransaction: (tx: Transaction) => void }) {
  const { state } = useWealth();

  // Group transactions by date
  const groupedTransactions = state.transactions.reduce((acc, curr) => {
    const date = new Date(curr.date).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
    if (!acc[date]) acc[date] = [];
    acc[date].push(curr);
    return acc;
  }, {} as Record<string, typeof state.transactions>);

  const sortedDates = Object.keys(groupedTransactions).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

  return (
    <div className="flex flex-col gap-8 pb-24 animate-in fade-in duration-500">
      {/* Header */}
      <h1 className="text-3xl font-serif italic text-[#4a5d4e] font-bold tracking-tight">Transaction Flow</h1>

      {/* Action Buttons */}
      <div className="flex gap-4">
        <Button variant="primary" className="py-4 flex-1" onClick={onAddTransaction} id="add-transaction-btn-flow">
          <Plus size={18} className="mr-2" />
          Add Entry
        </Button>
        <Button variant="outline" className="py-4 flex-1" onClick={onAddAccount} id="add-account-btn-flow">
          <Landmark size={18} className="mr-2" />
          Add Account
        </Button>
      </div>

      {/* Transactions History */}
      <div className="flex flex-col gap-8">
        {sortedDates.length > 0 ? (
          sortedDates.map((date) => (
            <div key={date} className="flex flex-col gap-4">
              <h3 className="text-[9px] font-bold text-[#a3a398] uppercase tracking-[0.16em]">{date}</h3>
              <div className="flex flex-col gap-1">
                {groupedTransactions[date].map((t) => {
                  const account = state.accounts.find(a => a.id === t.accountId);
                  return (
                    <button 
                      key={t.id} 
                      onClick={() => onEditTransaction(t)}
                      className="w-full flex justify-between items-center py-4 border-b border-[#efeee5] last:border-b-0 text-left hover:bg-[#efeee5]/30 px-2 rounded-xl transition-all"
                    >
                      <div className="flex gap-4 items-center">
                        <div className="w-11 h-11 bg-[#f5f5f0] rounded-2xl flex items-center justify-center text-lg">
                          {t.type === 'income' ? '💼' : '☕'}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-[#2d2d2a]">{t.category}</p>
                          <p className="text-[9px] text-[#a3a398] font-bold uppercase tracking-widest mt-0.5">{account?.name || 'Cash'}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`text-sm font-bold font-mono tracking-tight ${t.type === 'income' ? 'text-[#4a5d4e]' : 'text-[#8b4513]'}`}>
                          {t.type === 'income' ? '+' : '-'}{state.currency?.symbol ?? '$'}{t.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </div>
                        {t.note && <p className="text-[9px] text-[#a3a398] font-bold uppercase tracking-widest mt-1">{t.note}</p>}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ))
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-[#a3a398] gap-4">
            <Landmark size={48} className="opacity-20" />
            <p className="font-medium italic text-sm">No transactions flow found</p>
            <Button variant="secondary" onClick={onAddTransaction} size="sm">Create your first entry</Button>
          </div>
        )}
      </div>
    </div>
  );
}
