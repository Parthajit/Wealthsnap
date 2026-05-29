/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Settings, Plus, ArrowRight, Landmark, Wallet, TrendingUp, PiggyBank, CreditCard } from 'lucide-react';
import { useWealth } from '../WealthContext';
import { Card, Button } from '../components/UI';
import { AccountType } from '../types';
import AccountStatementModal from '../components/AccountStatementModal';

const ICON_MAP: Record<string, any> = {
  Landmark,
  Wallet,
  TrendingUp,
  PiggyBank,
  CreditCard
};

const TYPE_COLORS: Record<AccountType, { bg: string, text: string, cardBg?: string }> = {
  'Bank': { bg: '#BCEAD5', text: '#2D5A4C' },
  'Cash': { bg: '#D1E8F6', text: '#3D6356' },
  'Investment': { bg: '#4D7466', text: 'white', cardBg: '#3D6356' },
  'Savings': { bg: '#DEF5E5', text: '#2D5A4C' },
  'Physical': { bg: '#D1E8F6', text: '#3D6356' },
};

export default function Vault({ onAddAccount }: { onAddAccount: () => void }) {
  const { state } = useWealth();
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  const [isStatementOpen, setIsStatementOpen] = useState(false);

  const totalNetWorth = state.accounts.reduce((acc, curr) => acc + curr.balance, 0);

  return (
    <div className="flex flex-col gap-8 pb-24 animate-in slide-in-from-right duration-500">
      {/* Header */}
      <h1 className="text-3xl font-serif italic text-[#4a5d4e] font-bold tracking-tight">Your Accounts</h1>

      {/* Net Worth */}
      <div className="bg-[#4a5d4e] rounded-[32px] p-8 text-white relative shadow-md">
        <div className="flex justify-between items-start mb-3">
          <span className="text-[10px] opacity-75 uppercase tracking-[0.2em] font-bold">Total Net Worth</span>
          <div className="bg-white/20 px-2.5 py-0.5 rounded-full text-[9px] font-bold tracking-widest uppercase">Verified</div>
        </div>
        <div className="text-4xl font-serif italic leading-none tracking-tight">
          {state.currency?.symbol ?? '$'}{totalNetWorth.toLocaleString(undefined, { minimumFractionDigits: 2 })}
        </div>
        <div className="inline-flex items-center gap-1 bg-white/20 px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-[0.12em] mt-4">
          <span>Local Storage Only</span>
        </div>
      </div>

      {/* Accounts List */}
      <div className="flex flex-col gap-6">
        <div className="flex justify-between items-center">
          <h3 className="text-xs font-bold uppercase tracking-widest text-[#a3a398]">Detailed Snapshot</h3>
          <span className="text-[9px] font-bold text-[#4a5d4e]/70 uppercase tracking-widest">Click Card for Statement</span>
        </div>
        {state.accounts.map((account) => {
          return (
            <button
              key={account.id}
              onClick={() => {
                setSelectedAccountId(account.id);
                setIsStatementOpen(true);
              }}
              className="w-full text-left active:scale-[0.99] transition-all focus:outline-none group focus:ring-2 focus:ring-[#4a5d4e]/20 rounded-[32px]"
              id={`account-card-btn-${account.id}`}
            >
              <Card className="relative overflow-hidden flex flex-col gap-4 border-none shadow-sm bg-white hover:border-[#4a5d4e]/40 hover:shadow-md transition-all">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-4">
                    <div className="w-11 h-11 bg-[#fafaf8] rounded-full flex items-center justify-center font-serif text-[#4a5d4e] border border-[#efeee5] group-hover:bg-[#4a5d4e] group-hover:text-white transition-all">
                      {account.name.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-[#2d2d2a]">{account.name}</p>
                      <p className="text-[9px] text-[#a3a398] font-bold uppercase tracking-widest mt-0.5">{account.details || '...4829'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <p className="text-base font-bold font-mono tracking-tight text-[#2d2d2a]">{state.currency?.symbol ?? '$'}{account.balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                    <ArrowRight size={16} className="text-[#a3a398] opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                  </div>
                </div>
              </Card>
            </button>
          );
        })}

        {/* Add Account Button Pattern from Design */}
        <button 
          onClick={onAddAccount}
          className="w-full py-4 border-2 border-dashed border-[#d1d1ca] rounded-2xl text-[9px] text-[#a3a398] font-bold uppercase tracking-[0.16em] hover:bg-[#fafaf8] transition-colors shadow-sm"
          id="dashed-add-account-btn"
        >
          + Add Account
        </button>
      </div>

      {/* Recent Moves Simplified */}
      <section className="flex flex-col gap-6">
        <h3 className="text-xs font-bold uppercase tracking-widest text-[#a3a398]">Recent Flow</h3>
        <div className="flex flex-col gap-4">
          {state.transactions.slice(0, 3).map((t) => (
            <div key={t.id} className="flex justify-between items-center">
               <div className="flex gap-4 items-center">
                  <div className="w-10 h-10 bg-[#fafaf8] rounded-xl flex items-center justify-center text-sm border border-[#efeee5]">
                    {t.type === 'income' ? '💼' : '☕'}
                  </div>
                  <p className="text-xs font-semibold text-[#2d2d2a]">{t.category}</p>
               </div>
               <p className={`text-xs font-bold font-mono tracking-tight ${t.type === 'income' ? 'text-[#4a5d4e]' : 'text-[#8b4513]'}`}>
                  {t.type === 'income' ? '+' : '-'}{state.currency?.symbol ?? '$'}{t.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
               </p>
            </div>
          ))}
        </div>
      </section>

      {isStatementOpen && selectedAccountId && (
        <AccountStatementModal 
          isOpen={isStatementOpen}
          onClose={() => setIsStatementOpen(false)}
          initialAccountId={selectedAccountId}
        />
      )}
    </div>
  );
}
