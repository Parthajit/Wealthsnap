/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { useWealth } from '../WealthContext';
import { Card } from '../components/UI';
import { Landmark, ChevronDown, ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Transaction } from '../types';

export default function Reports({ onEditTransaction }: { onEditTransaction: (tx: Transaction) => void }) {
  const { state } = useWealth();
  const [selectedAccountId, setSelectedAccountId] = useState(state.accounts[0]?.id || 'all');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedCalendarDate, setSelectedCalendarDate] = useState<string | null>(null);

  const selectedAccount = state.accounts.find(a => a.id === selectedAccountId);
  
  const filteredTransactions = selectedAccountId === 'all' 
    ? state.transactions 
    : state.transactions.filter(t => t.accountId === selectedAccountId);

  const income = filteredTransactions
    .filter(t => t.type === 'income')
    .reduce((acc, curr) => acc + curr.amount, 0);

  const expenses = filteredTransactions
    .filter(t => t.type === 'expense')
    .reduce((acc, curr) => acc + curr.amount, 0);

  // Calendar math
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDayOfMonth = new Date(year, month, 1).getDay(); // 0 is Sunday, etc.
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const daysOfWeek = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'];
  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const getDayDateString = (day: number) => {
    const yyyy = year;
    const mm = String(month + 1).padStart(2, '0');
    const dd = String(day).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  const getTransactionsForDay = (dayString: string) => {
    return filteredTransactions.filter(t => t.date === dayString);
  };

  const blanks = Array(firstDayOfMonth).fill(null);
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const calendarCells = [...blanks, ...days];

  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  // Determine what list to draw below
  const listTransactions = selectedCalendarDate 
    ? filteredTransactions.filter(t => t.date === selectedCalendarDate)
    : filteredTransactions;

  return (
    <div className="flex flex-col gap-8 pb-24 animate-in slide-in-from-right duration-500">
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-serif italic text-[#4a5d4e] font-bold tracking-tight">Financial Reports</h1>
        <p className="text-[#a3a398] text-[10px] font-bold uppercase tracking-[0.16em] leading-loose">Detailed breakdown of your flows</p>
      </header>

      {/* Account Selector */}
      <div className="relative">
        <button 
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          className="w-full flex items-center justify-between bg-white p-5 rounded-[24px] shadow-sm border border-[#efeee5] outline-none group"
        >
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-[#f5f5f0] flex items-center justify-center text-[#4a5d4e]">
              <Landmark size={20} />
            </div>
            <div className="text-left">
              <p className="text-[10px] font-bold text-[#a3a398] uppercase tracking-widest leading-none mb-1">Viewing Report For</p>
              <p className="text-sm font-bold text-[#2d2d2a]">{selectedAccountId === 'all' ? 'All Accounts' : selectedAccount?.name}</p>
            </div>
          </div>
          <ChevronDown size={20} className={`text-[#a3a398] transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
        </button>

        <AnimatePresence>
          {isDropdownOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute top-full left-0 right-0 mt-2 bg-white rounded-[24px] shadow-xl border border-[#efeee5] z-50 overflow-hidden"
            >
              <button 
                onClick={() => { setSelectedAccountId('all'); setIsDropdownOpen(false); }}
                className="w-full text-left px-6 py-4 hover:bg-[#f5f5f0] transition-colors text-sm font-bold text-[#2d2d2a] border-b border-[#efeee5]"
              >
                All Accounts
              </button>
              {state.accounts.map(acc => (
                <button 
                  key={acc.id}
                  onClick={() => { setSelectedAccountId(acc.id); setIsDropdownOpen(false); }}
                  className="w-full text-left px-6 py-4 hover:bg-[#f5f5f0] transition-colors text-sm font-bold text-[#2d2d2a] border-b border-[#efeee5] last:border-b-0"
                >
                  {acc.name}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="flex flex-col gap-2 bg-[#4a5d4e] text-white border-none p-5">
          <span className="text-[9px] font-bold opacity-75 uppercase tracking-[0.16em]">Total In</span>
          <span className="text-lg font-bold font-mono tracking-tight">{state.currency?.symbol ?? '$'}{income.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
        </Card>
        <Card className="flex flex-col gap-2 bg-[#efeee5] text-[#8b4513] border-none p-5">
          <span className="text-[9px] font-bold opacity-75 uppercase tracking-[0.16em]">Total Out</span>
          <span className="text-lg font-bold font-mono tracking-tight">{state.currency?.symbol ?? '$'}{expenses.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
        </Card>
      </div>

      {/* Interactive Calendar Component */}
      <Card className="bg-white border-[#efeee5] p-5 flex flex-col gap-4">
        <div className="flex justify-between items-center border-b border-[#efeee5] pb-3">
          <div className="flex items-center gap-2">
            <CalendarIcon size={16} className="text-[#4a5d4e]" />
            <span className="text-sm font-bold text-[#2d2d2a]">{monthNames[month]} {year}</span>
          </div>
          <div className="flex gap-1">
            <button 
              onClick={prevMonth} 
              className="p-1 px-2 hover:bg-[#f5f5f0] rounded-lg text-[#4a5d4e]"
            >
              <ChevronLeft size={16} />
            </button>
            <button 
              onClick={nextMonth} 
              className="p-1 px-2 hover:bg-[#f5f5f0] rounded-lg text-[#4a5d4e]"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>

        {/* Days of Week */}
        <div className="grid grid-cols-7 text-center text-[9px] font-bold text-[#a3a398] tracking-[0.2em]">
          {daysOfWeek.map(day => (
            <div key={day} className="py-1">{day}</div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 text-center gap-y-2">
          {calendarCells.map((val, idx) => {
            if (val === null) {
              return <div key={`empty-${idx}`} className="py-2"></div>;
            }

            const dayString = getDayDateString(val);
            const transactionsOnDay = getTransactionsForDay(dayString);
            const hasIncome = transactionsOnDay.some(t => t.type === 'income');
            const hasExpense = transactionsOnDay.some(t => t.type === 'expense');
            const isSelected = selectedCalendarDate === dayString;

            return (
              <button
                key={`day-${val}`}
                onClick={() => {
                  if (isSelected) {
                    setSelectedCalendarDate(null); // toggle off filter
                  } else {
                    setSelectedCalendarDate(dayString);
                  }
                }}
                className={`py-1.5 focus:outline-none flex flex-col items-center justify-center rounded-xl transition-all ${
                  isSelected 
                    ? 'bg-[#4a5d4e] text-white shadow-sm font-bold' 
                    : 'hover:bg-[#f5f5f0] text-[#2d2d2a] font-medium'
                }`}
              >
                <span className="text-xs font-mono">{val}</span>
                <div className="flex gap-0.5 mt-0.5 h-1">
                  {hasIncome && (
                    <span className={`w-1 h-1 rounded-full ${isSelected ? 'bg-white' : 'bg-[#4a5d4e]'}`} />
                  )}
                  {hasExpense && (
                    <span className={`w-1 h-1 rounded-full ${isSelected ? 'bg-amber-100' : 'bg-[#8b4513]'}`} />
                  )}
                </div>
              </button>
            );
          })}
        </div>
        
        {selectedCalendarDate && (
          <div className="flex justify-between items-center text-[10px] font-bold text-[#4a5d4e] bg-[#f5f5f0] p-2 rounded-xl mt-1">
            <span>Filter: {new Date(selectedCalendarDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
            <button 
              onClick={() => setSelectedCalendarDate(null)}
              className="underline uppercase tracking-wider"
            >
              Clear filter
            </button>
          </div>
        )}
      </Card>

      {/* Breakdown */}
      <section className="flex flex-col gap-6">
        <h3 className="text-xs font-bold uppercase tracking-widest text-[#a3a398]">
          {selectedCalendarDate ? 'Flows on this Date' : 'Detailed Flow'}
        </h3>
        <div className="flex flex-col gap-1">
          {listTransactions.length > 0 ? (
            listTransactions.slice(0, 15).map((t) => (
              <button 
                key={t.id} 
                onClick={() => onEditTransaction(t)}
                className="w-full flex justify-between items-center py-4 border-b border-[#efeee5] last:border-b-0 text-left hover:bg-[#efeee5]/30 px-2 rounded-xl transition-all"
              >
                <div className="flex gap-4 items-center">
                  <div className="w-11 h-11 bg-white rounded-2xl flex items-center justify-center text-lg border border-[#efeee5] shadow-sm">
                    {t.type === 'income' ? '💼' : '☕'}
                  </div>
                  <div>
                    <span className="text-sm font-semibold text-[#2d2d2a] block">{t.category}</span>
                    <span className="text-[9px] text-[#a3a398] font-bold uppercase tracking-widest block mt-0.5">
                      {new Date(t.date).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}
                      {t.note ? ` • ${t.note}` : ''}
                    </span>
                  </div>
                </div>
                <p className={`text-sm font-bold font-mono tracking-tight ${t.type === 'income' ? 'text-[#4a5d4e]' : 'text-[#8b4513]'}`}>
                  {t.type === 'income' ? '+' : '-'}{state.currency?.symbol ?? '$'}{t.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </p>
              </button>
            ))
          ) : (
            <div className="py-20 text-center">
              <p className="text-[#a3a398] italic text-sm">No transactions found for this selection</p>
            </div>
          )}
        </div>
      </section>

      {/* Account Info Card (if specific account selected) */}
      {selectedAccount && (
        <Card className="bg-white/50 border-[#efeee5] flex flex-col gap-4">
           <div className="flex justify-between items-center">
             <span className="text-[10px] font-bold text-[#a3a398] uppercase tracking-widest">Account Number</span>
             <span className="text-sm font-bold text-[#2d2d2a]">{selectedAccount.accountNumber || 'N/A'}</span>
           </div>
           <div className="flex justify-between items-center">
             <span className="text-[10px] font-bold text-[#a3a398] uppercase tracking-widest">Opening Date</span>
             <span className="text-sm font-bold text-[#2d2d2a]">{selectedAccount.openingDate}</span>
           </div>
        </Card>
      )}
    </div>
  );
}
