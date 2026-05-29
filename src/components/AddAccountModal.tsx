/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { X, Landmark, Wallet, TrendingUp, PiggyBank, CreditCard, Calendar } from 'lucide-react';
import { useState } from 'react';
import { Button } from './UI';
import { useWealth } from '../WealthContext';
import { AccountType, ACCOUNT_ICONS } from '../types';
import { motion, AnimatePresence } from 'motion/react';

const ICON_MAP: Record<string, any> = {
  Landmark,
  Wallet,
  TrendingUp,
  PiggyBank,
  CreditCard
};

export default function AddAccountModal({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
  const { state, addAccount } = useWealth();
  const [balance, setBalance] = useState('0.00');
  const [name, setName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [type, setType] = useState<AccountType>('Bank');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedIcon, setSelectedIcon] = useState('Landmark');

  const handleSave = () => {
    if (!name) return;
    addAccount({
      name,
      type,
      balance: parseFloat(balance),
      openingBalance: parseFloat(balance),
      openingDate: date,
      icon: selectedIcon,
      accountNumber,
    });
    onClose();
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
        <div className="flex items-center justify-between p-6">
          <button onClick={onClose} className="p-2"><X size={24} /></button>
          <h2 className="text-sm font-bold text-[#4a5d4e] uppercase tracking-widest">Add Account</h2>
          <button onClick={handleSave} className="text-[#4a5d4e] font-bold uppercase text-xs tracking-widest">Save</button>
        </div>

        <div className="flex-1 overflow-y-auto p-8 flex flex-col gap-10">
          <h1 className="text-5xl font-serif italic text-[#4a5d4e] leading-none">Add<br />Account</h1>

          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-bold text-[#a3a398] uppercase tracking-widest">Opening Balance</label>
            <div className="flex items-end gap-2 border-b border-[#efeee5] pb-2">
              <span className="text-3xl font-serif italic text-[#4a5d4e] mb-2">{state.currency?.symbol ?? '$'}</span>
              <input 
                type="number" 
                value={balance}
                onChange={(e) => setBalance(e.target.value)}
                className="text-7xl font-serif italic text-[#4a5d4e]/20 focus:text-[#4a5d4e] outline-none w-full bg-transparent"
                placeholder="0.00"
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-bold text-[#a3a398] uppercase tracking-widest">Account Name</label>
            <input 
              type="text" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="text-3xl font-medium text-[#2d2d2a] outline-none w-full bg-transparent placeholder:text-[#d1d1ca]"
              placeholder="Checking"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-bold text-[#a3a398] uppercase tracking-widest">Account Number</label>
            <input 
              type="text" 
              value={accountNumber}
              onChange={(e) => setAccountNumber(e.target.value)}
              className="text-xl font-medium text-[#2d2d2a] outline-none w-full bg-transparent placeholder:text-[#d1d1ca]"
              placeholder="e.g. **** 1234"
            />
          </div>

          <div className="flex flex-col gap-4">
            <label className="text-[10px] font-bold text-[#a3a398] uppercase tracking-widest">Account Type</label>
            <div className="flex gap-2">
              {(['Bank', 'Cash', 'Investment'] as AccountType[]).map((t) => (
                <button
                  key={t}
                  onClick={() => setType(t)}
                  className={`px-6 py-3 rounded-full font-bold text-[10px] uppercase tracking-widest transition-all ${
                    type === t ? 'bg-[#4a5d4e] text-white' : 'bg-[#efeee5] text-[#7a7a72]'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-bold text-[#a3a398] uppercase tracking-widest">Opening Date</label>
            <div className="flex items-center justify-between border-b border-[#efeee5] pb-2">
              <input 
                type="date" 
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="text-xl font-medium text-[#7a7a72] outline-none bg-transparent w-full"
              />
              <Calendar size={20} className="text-[#a3a398]" />
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <label className="text-[10px] font-bold text-[#a3a398] uppercase tracking-widest">Visual Icon</label>
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
              {ACCOUNT_ICONS.map((item) => {
                const IconComp = ICON_MAP[item.icon];
                const isSelected = selectedIcon === item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => setSelectedIcon(item.icon)}
                    className={`min-w-[64px] h-[64px] rounded-2xl flex items-center justify-center transition-all border shadow-sm ${
                      isSelected ? 'bg-[#efeee5] text-[#4a5d4e] border-[#4a5d4e]/20' : 'bg-white text-[#a3a398] border-[#efeee5]'
                    }`}
                  >
                    <IconComp size={24} />
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="p-8 pt-0 flex flex-col gap-4">
           <div className="flex items-center justify-center gap-2 bg-[#efeee5]/50 py-2 px-4 rounded-full w-fit mx-auto">
             <Landmark size={12} className="text-[#4a5d4e]" />
             <span className="text-[10px] font-bold text-[#4a5d4e] tracking-tight uppercase">Local Storage Encryption</span>
           </div>
           <Button variant="primary" onClick={handleSave} size="lg" id="save-account-btn">Save Account</Button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
