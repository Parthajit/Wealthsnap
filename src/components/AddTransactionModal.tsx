/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { X, UtensilsCrossed, Car, Home, ShoppingBag, Gamepad, HeartPulse, Briefcase, MoreHorizontal, Calendar, Delete } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Button, Card } from './UI';
import { useWealth } from '../WealthContext';
import { CATEGORIES, TransactionType, Transaction } from '../types';
import { motion, AnimatePresence } from 'motion/react';

const ICON_MAP: Record<string, any> = {
  UtensilsCrossed,
  Car,
  Home,
  ShoppingBag,
  Gamepad,
  HeartPulse,
  Briefcase,
  MoreHorizontal
};

export default function AddTransactionModal({ isOpen, onClose, transactionToEdit = null }: { isOpen: boolean, onClose: () => void, transactionToEdit?: Transaction | null }) {
  const { state, addTransaction, updateTransaction, deleteTransaction } = useWealth();
  const [type, setType] = useState<TransactionType>('expense');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('food');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [note, setNote] = useState('');
  const [selectedAccountId, setSelectedAccountId] = useState(state.accounts[0]?.id || '');

  useEffect(() => {
    if (transactionToEdit) {
      setType(transactionToEdit.type);
      setAmount(transactionToEdit.amount.toString());
      const foundCat = CATEGORIES.find(c => c.name.toLowerCase() === transactionToEdit.category.toLowerCase());
      setCategory(foundCat?.id || 'other');
      setDate(transactionToEdit.date);
      setNote(transactionToEdit.note || '');
      setSelectedAccountId(transactionToEdit.accountId);
    } else {
      setType('expense');
      setAmount('');
      setCategory('food');
      setDate(new Date().toISOString().split('T')[0]);
      setNote('');
      setSelectedAccountId(state.accounts[0]?.id || '');
    }
  }, [transactionToEdit, isOpen]);

  const handleSave = () => {
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0 || !selectedAccountId) return;
    
    if (transactionToEdit) {
      updateTransaction(transactionToEdit.id, {
        accountId: selectedAccountId,
        amount: numAmount,
        type,
        category: CATEGORIES.find(c => c.id === category)?.name || 'Other',
        date,
        note,
      });
    } else {
      addTransaction({
        accountId: selectedAccountId,
        amount: numAmount,
        type,
        category: CATEGORIES.find(c => c.id === category)?.name || 'Other',
        date,
        note,
      });
    }
    onClose();
  };

  const handleDelete = () => {
    if (transactionToEdit) {
      deleteTransaction(transactionToEdit.id);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="fixed inset-0 bg-[#f5f5f0] z-[100] flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6">
          <button onClick={onClose} className="p-2"><X size={24} /></button>
          <h2 className="text-sm font-bold text-[#4a5d4e] uppercase tracking-widest">New Entry</h2>
          <button onClick={handleSave} className="text-[#4a5d4e] font-bold uppercase text-xs tracking-widest">Save</button>
        </div>

        <div className="flex-1 overflow-y-auto p-8 flex flex-col gap-8">
          {/* Toggle */}
          <div className="bg-[#efeee5] p-1 rounded-2xl flex max-w-[240px] mx-auto border border-white/50">
            <button 
              onClick={() => setType('expense')}
              className={`flex-1 py-1.5 rounded-xl font-bold text-[10px] uppercase tracking-widest transition-all ${type === 'expense' ? 'bg-white shadow-sm text-[#2d2d2a]' : 'text-[#a3a398]'}`}
            >
              Expense
            </button>
            <button 
              onClick={() => setType('income')}
              className={`flex-1 py-1.5 rounded-xl font-bold text-[10px] uppercase tracking-widest transition-all ${type === 'income' ? 'bg-white shadow-sm text-[#2d2d2a]' : 'text-[#a3a398]'}`}
            >
              Income
            </button>
          </div>

          {/* Amount Input */}
          <div className="flex flex-col items-center gap-1 mt-4">
            <label className="text-[10px] font-bold text-[#a3a398] uppercase tracking-widest">Enter Amount</label>
            <div className="flex items-center justify-center gap-1 w-full max-w-sm mx-auto">
              <span className="text-3xl font-serif italic text-[#4a5d4e]/40 select-none">{state.currency?.symbol ?? '$'}</span>
              <input 
                type="number"
                step="any"
                inputMode="decimal"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="text-6xl font-serif italic text-center text-[#4a5d4e] tracking-tight outline-none bg-transparent w-full border-none focus:ring-0 focus:outline-none placeholder:text-[#4a5d4e]/10 p-0"
                id="transaction-amount-input"
                autoFocus
              />
            </div>
          </div>

          {/* Select Account Dropdown */}
          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-bold text-[#a3a398] uppercase tracking-widest">Select Account</label>
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-[#efeee5]">
              <select 
                value={selectedAccountId}
                onChange={(e) => setSelectedAccountId(e.target.value)}
                className="w-full bg-transparent text-sm font-bold text-[#2d2d2a] outline-none border-none cursor-pointer py-1"
                id="transaction-account-select"
              >
                {state.accounts.map(acc => {
                  const numberDisplay = acc.accountNumber ? ` • ${acc.accountNumber}` : '';
                  const balanceDisplay = `(${state.currency?.symbol ?? '$'}${acc.balance.toLocaleString()})`;
                  return (
                    <option key={acc.id} value={acc.id}>
                      {acc.name}{numberDisplay} {balanceDisplay}
                    </option>
                  );
                })}
              </select>
            </div>
          </div>

          {/* Categories */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-widest text-[#a3a398]">Category</h3>
              <button className="text-[10px] font-bold text-[#4a5d4e] uppercase tracking-widest underline">View All</button>
            </div>
            <div className="grid grid-cols-4 gap-4">
              {CATEGORIES.slice(0, 4).map((cat) => {
                const IconComp = ICON_MAP[cat.icon];
                const isSelected = category === cat.id;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setCategory(cat.id)}
                    className="flex flex-col items-center gap-2 group"
                  >
                    <div className={`w-16 h-16 rounded-[22px] flex items-center justify-center transition-all border shadow-sm ${
                      isSelected ? 'bg-[#efeee5] text-[#4a5d4e] border-[#4a5d4e]/20' : 'bg-white text-[#a3a398] border-[#efeee5]'
                    }`}>
                      <IconComp size={22} />
                    </div>
                    <span className={`text-[9px] font-bold uppercase tracking-widest transition-colors ${isSelected ? 'text-[#4a5d4e]' : 'text-[#a3a398]'}`}>
                      {cat.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Date and Note */}
          <div className="flex flex-col gap-4">
            <Card className="p-5 border-none shadow-sm flex items-center justify-between bg-white/70">
               <div className="flex items-center gap-4">
                 <div className="w-10 h-10 rounded-full bg-[#f5f5f0] flex items-center justify-center text-[#4a5d4e] border border-[#efeee5]">
                   <Calendar size={18} />
                 </div>
                 <div>
                   <label className="text-[10px] font-bold text-[#a3a398] uppercase tracking-widest">Date</label>
                   <input 
                     type="date" 
                     value={date} 
                     onChange={(e) => setDate(e.target.value)}
                     className="block text-sm font-bold text-[#2d2d2a] bg-transparent outline-none"
                   />
                 </div>
               </div>
            </Card>
            
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-bold text-[#a3a398] uppercase tracking-widest">Notes</label>
              <textarea 
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="What was this flow for?"
                className="bg-transparent border-b border-[#efeee5] outline-none py-2 text-sm text-[#2d2d2a] font-medium placeholder:text-[#d1d1ca] resize-none"
                rows={1}
              />
            </div>
          </div>
        </div>

        <div className="p-8 pt-0 bg-white flex gap-4">
           {transactionToEdit && (
             <Button 
               variant="outline" 
               className="border-red-200 text-red-600 hover:bg-red-50 flex-1 py-4" 
               onClick={handleDelete}
               id="delete-transaction-btn"
             >
               Delete
             </Button>
           )}
           <Button variant="primary" className="flex-[2] py-4" onClick={handleSave} size="lg" id="save-transaction-btn">
             {transactionToEdit ? 'Save Changes' : 'Save Entry'}
           </Button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
