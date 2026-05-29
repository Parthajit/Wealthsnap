/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ArrowUp, ArrowDown, Plus, Landmark, Settings, X, Download, Upload } from 'lucide-react';
import React, { useState, useRef } from 'react';
import { useWealth } from '../WealthContext';
import { Card, Button } from '../components/UI';
import { motion, AnimatePresence } from 'motion/react';
import { Transaction } from '../types';
import IncomeExpenseStatementModal from '../components/IncomeExpenseStatementModal';

const CURRENCIES = [
  { code: 'USD', symbol: '$', name: 'US Dollar ($)' },
  { code: 'EUR', symbol: '€', name: 'Euro (€)' },
  { code: 'GBP', symbol: '£', name: 'British Pound (£)' },
  { code: 'INR', symbol: '₹', name: 'Indian Rupee (₹)' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen (¥)' },
  { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar (C$)' },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar (A$)' },
];

export default function Sanctuary({ 
  onAddTransaction, 
  onAddAccount,
  onEditTransaction,
}: { 
  onAddTransaction: () => void, 
  onAddAccount: () => void,
  onEditTransaction: (tx: Transaction) => void,
}) {
  const { state, setCurrency, exportBackup, importBackup, setWeeklyGoal } = useWealth();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [importSuccess, setImportSuccess] = useState(false);
  const [selectedStatementType, setSelectedStatementType] = useState<'income' | 'expense' | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const totalBalance = state.accounts.reduce((acc, curr) => acc + curr.balance, 0);
  
  // Calculate monthly stats (for the current month)
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthlyTransactions = state.transactions.filter(t => new Date(t.date) >= startOfMonth);
  
  const monthlyIncome = monthlyTransactions
    .filter(t => t.type === 'income')
    .reduce((acc, curr) => acc + curr.amount, 0);
  
  const monthlyExpenses = monthlyTransactions
    .filter(t => t.type === 'expense')
    .reduce((acc, curr) => acc + curr.amount, 0);

  const recentTransactions = state.transactions.slice(0, 5);

  // Generate data for the last 7 days of income and expenses
  const last7DaysData = Array.from({ length: 7 }, (_, idx) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - idx));
    const dateStr = d.toISOString().split('T')[0];
    const dayLabel = d.toLocaleDateString(undefined, { weekday: 'short' });

    // Sum matching day Transactions
    const daysTx = state.transactions.filter(t => t.date === dateStr);
    const income = daysTx.filter(t => t.type === 'income').reduce((sum, curr) => sum + curr.amount, 0);
    const expense = daysTx.filter(t => t.type === 'expense').reduce((sum, curr) => sum + curr.amount, 0);

    return {
      date: dateStr,
      label: dayLabel,
      income,
      expense,
    };
  });

  // Generate Month-on-Month data (last 6 months ending with current month)
  const monthOnMonthData = Array.from({ length: 6 }, (_, idx) => {
    const d = new Date();
    d.setMonth(d.getMonth() - (5 - idx));
    const year = d.getFullYear();
    const monthIndex = d.getMonth(); // 0-indexed
    const prefix = `${year}-${String(monthIndex + 1).padStart(2, '0')}`;

    // Sum transactions in this month
    const monthTx = state.transactions.filter(t => t.date.startsWith(prefix));
    const income = monthTx.filter(t => t.type === 'income').reduce((sum, curr) => sum + curr.amount, 0);
    const expense = monthTx.filter(t => t.type === 'expense').reduce((sum, curr) => sum + curr.amount, 0);

    const monthLabel = d.toLocaleDateString(undefined, { month: 'short' });
    const fullMonthLabel = d.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });

    return {
      date: fullMonthLabel,
      label: monthLabel,
      income,
      expense,
    };
  });

  const [chartView, setChartView] = useState<'7days' | 'mom'>('7days');
  const [hoveredChartIndex, setHoveredChartIndex] = useState<number | null>(null);

  const activeData = chartView === '7days' ? last7DaysData : monthOnMonthData;
  const activeIndex = hoveredChartIndex !== null ? hoveredChartIndex : (activeData.length - 1);
  const maxChartVal = Math.max(
    ...activeData.map(d => Math.max(d.income, d.expense)),
    100
  );

  const getXCoordinate = (i: number) => {
    const totalPoints = activeData.length;
    if (totalPoints <= 1) return 250;
    const gap = 430 / (totalPoints - 1);
    return 35 + i * gap;
  };

  const handleCurrencyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selected = CURRENCIES.find(c => c.code === e.target.value);
    if (selected) {
      setCurrency(selected.code, selected.symbol);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        await importBackup(json);
        setImportSuccess(true);
        setImportError(null);
        setTimeout(() => {
          setImportSuccess(false);
          setIsSettingsOpen(false);
        }, 1500);
      } catch (err) {
        setImportError('Failed to import backup. Please check file format.');
        setImportSuccess(false);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="flex flex-col gap-8 pb-24 animate-in fade-in duration-500">
      {/* Header */}
      <header className="flex justify-between items-center pb-4">
        <div className="flex flex-col">
          <h1 className="text-3xl font-serif italic text-[#4a5d4e] font-bold tracking-tight">WealthSnap</h1>
          <p className="text-[#a3a398] text-xs font-semibold tracking-wide mt-1">Secure, local, and private.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-[9px] uppercase tracking-[0.2em] text-[#a3a398] font-bold">
              {new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}
            </p>
            <p className="text-xs font-bold text-[#2d2d2a] tracking-tight uppercase mt-0.5 opacity-90">Welcome back</p>
          </div>
          <button 
            onClick={() => setIsSettingsOpen(true)}
            className="w-10 h-10 rounded-full bg-white flex items-center justify-center border border-[#efeee5] shadow-sm hover:bg-[#efeee5] transition-all text-[#4a5d4e]"
            id="settings-btn"
          >
            <Settings size={20} />
          </button>
        </div>
      </header>

      {/* Total Balance Card */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1 }}
      >
        <div className="bg-[#4a5d4e] rounded-[32px] p-8 text-white relative shadow-md">
          <div className="flex justify-between items-start mb-3">
            <span className="text-[10px] opacity-75 uppercase tracking-[0.2em] font-bold">Total Net Worth</span>
            <div className="bg-white/20 px-2.5 py-0.5 rounded-full text-[9px] font-bold tracking-widest uppercase">Private</div>
          </div>
          <div className="flex flex-col">
            <span className="text-4xl font-serif italic tracking-tight">
              {state.currency?.symbol ?? '$'}{totalBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>
      </motion.div>

      {/* Monthly Summary Cards clickable to show corresponding statements */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <button
          onClick={() => setSelectedStatementType('income')}
          className="w-full text-left active:scale-[0.99] transition-all focus:outline-none rounded-[28px]"
          id="monthly-income-tile"
        >
          <Card className="flex items-center justify-between py-6 px-6 bg-white border border-[#efeee5] hover:border-[#4a5d4e]/40 hover:shadow-md transition-all cursor-pointer">
            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-[#a3a390] uppercase tracking-[0.16em] mb-1.5">Monthly Income</span>
              <span className="text-lg sm:text-xl font-bold font-mono tracking-tight text-[#4a5d4e]">
                {state.currency?.symbol ?? '$'}{monthlyIncome.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </span>
              <span className="text-[9px] text-[#4a5d4e]/75 font-bold uppercase tracking-[0.12em] mt-2 flex items-center gap-1">
                View Statement →
              </span>
            </div>
            <div className="w-10 h-10 rounded-full bg-[#f5f5f0] flex items-center justify-center text-[#4a5d4e]">
              <ArrowDown size={20} />
            </div>
          </Card>
        </button>

        <button
          onClick={() => setSelectedStatementType('expense')}
          className="w-full text-left active:scale-[0.99] transition-all focus:outline-none rounded-[28px]"
          id="monthly-expense-tile"
        >
          <Card className="flex items-center justify-between py-6 px-6 bg-white border border-[#efeee5] hover:border-[#8b4513]/40 hover:shadow-md transition-all cursor-pointer">
            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-[#a3a390] uppercase tracking-[0.16em] mb-1.5">Monthly Expenses</span>
              <span className="text-lg sm:text-xl font-bold font-mono tracking-tight text-[#8b4513]">
                {state.currency?.symbol ?? '$'}{monthlyExpenses.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </span>
              <span className="text-[9px] text-[#8b4513]/75 font-bold uppercase tracking-[0.12em] mt-2 flex items-center gap-1">
                View Statement →
              </span>
            </div>
            <div className="w-10 h-10 rounded-full bg-[#f5f5f0] flex items-center justify-center text-[#8b4513]">
              <ArrowUp size={20} />
            </div>
          </Card>
        </button>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4">
        <Button variant="primary" className="py-4 flex-1" onClick={onAddTransaction} id="add-transaction-btn">
          <Plus size={18} className="mr-2" />
          Add Entry
        </Button>
        <Button variant="outline" className="py-4 flex-1" onClick={onAddAccount} id="add-account-btn">
          <Landmark size={18} className="mr-2" />
          Add Account
        </Button>
      </div>

      {/* Dynamic Interactive SVG Line Chart */}
      <section className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <h3 className="text-[10px] font-bold uppercase tracking-widest text-[#a3a398]">Activity snapshot</h3>
            {/* Toggle selections */}
            <div className="inline-flex rounded-full bg-[#f5f5f0] p-0.5 border border-[#efeee5]">
              <button
                onClick={() => {
                  setChartView('7days');
                  setHoveredChartIndex(null);
                }}
                className={`px-3 py-1 rounded-full text-[9px] font-bold uppercase transition-all ${
                  chartView === '7days'
                    ? 'bg-[#4a5d4e] text-white shadow-sm'
                    : 'text-[#a3a398] hover:text-[#4a5d4e]'
                }`}
                id="chart-view-7days"
              >
                7 Days
              </button>
              <button
                onClick={() => {
                  setChartView('mom');
                  setHoveredChartIndex(null);
                }}
                className={`px-3 py-1 rounded-full text-[9px] font-bold uppercase transition-all ${
                  chartView === 'mom'
                    ? 'bg-[#4a5d4e] text-white shadow-sm'
                    : 'text-[#a3a398] hover:text-[#4a5d4e]'
                }`}
                id="chart-view-mom"
              >
                Month-on-Month
              </button>
            </div>
          </div>
          {activeData[activeIndex] && (
            <span className="text-[9px] font-bold text-[#7a7a72] uppercase tracking-wider bg-[#efeee5]/50 px-2.5 py-0.5 rounded-full self-start sm:self-auto">
              {activeData[activeIndex].date}
            </span>
          )}
        </div>
        <Card className="bg-white border border-[#efeee5] p-6 shadow-sm overflow-hidden relative">
          {/* Legend / Hover Details Indicator */}
          <div className="flex flex-wrap justify-between items-center mb-4 pb-3 border-b border-[#fafaf8] gap-2">
            <div>
              <p className="text-[9px] font-bold text-[#a3a398] uppercase tracking-widest">Selected Period</p>
              <h4 className="text-xs font-bold text-[#2d2d2a] font-mono">
                {activeData[activeIndex]?.label ? `${chartView === '7days' ? 'Day' : 'Month'}: ${activeData[activeIndex].label}` : 'Aggregate'}
              </h4>
            </div>
            
            <div className="flex gap-4 items-center">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#4a5d4e]" />
                <div>
                  <span className="text-[8px] font-bold text-[#a3a398] uppercase tracking-wider block leading-none">Income</span>
                  <span className="text-xs font-bold font-mono text-[#4a5d4e]">
                    {state.currency?.symbol ?? '$'}{activeData[activeIndex]?.income.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#8b4513]" />
                <div>
                  <span className="text-[8px] font-bold text-[#a3a398] uppercase tracking-wider block leading-none">Expense</span>
                  <span className="text-xs font-bold font-mono text-[#8b4513]">
                    {state.currency?.symbol ?? '$'}{activeData[activeIndex]?.expense.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* SVG Line Chart Plot */}
          <div className="relative w-full h-[185px]">
            <svg 
              className="w-full h-full" 
              viewBox="0 0 500 170" 
              preserveAspectRatio="none"
              id="analytics-svg-chart"
            >
              <defs>
                <linearGradient id="incomeGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#4a5d4e" stopOpacity="0.22" />
                  <stop offset="100%" stopColor="#4a5d4e" stopOpacity="0.0" />
                </linearGradient>
                <linearGradient id="expenseGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#8b4513" stopOpacity="0.22" />
                  <stop offset="100%" stopColor="#8b4513" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Grid Horizontal Guidelines */}
              <line x1="30" y1="20" x2="470" y2="20" stroke="#f0efe8" strokeWidth="1" strokeDasharray="4 4" />
              <line x1="30" y1="75" x2="470" y2="75" stroke="#f0efe8" strokeWidth="1" strokeDasharray="4 4" />
              <line x1="30" y1="130" x2="470" y2="130" stroke="#f0efe8" strokeWidth="1" strokeDasharray="4 4" />

              {/* Vertical dotted guide on hover index */}
              {activeIndex >= 0 && activeIndex < activeData.length && (
                <line 
                  x1={getXCoordinate(activeIndex)} 
                  y1="10" 
                  x2={getXCoordinate(activeIndex)} 
                  y2="135" 
                  stroke="#d1d1c4" 
                  strokeWidth="1.5" 
                  strokeDasharray="3 3" 
                />
              )}

              {/* Income Area Fill & Stroke */}
              {activeData.length > 0 && (
                <>
                  <path 
                    d={`M 35,130 L ${activeData.map((d, i) => `${getXCoordinate(i)},${130 - (d.income / maxChartVal) * 110}`).join(" L ")} L 465,130 Z`} 
                    fill="url(#incomeGradient)" 
                  />
                  <path 
                    d={`M ${activeData.map((d, i) => `${getXCoordinate(i)},${130 - (d.income / maxChartVal) * 110}`).join(" L ")}`} 
                    fill="none" 
                    stroke="#4a5d4e" 
                    strokeWidth="2.5" 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                  />
                </>
              )}

              {/* Expense Area Fill & Stroke */}
              {activeData.length > 0 && (
                <>
                  <path 
                    d={`M 35,130 L ${activeData.map((d, i) => `${getXCoordinate(i)},${130 - (d.expense / maxChartVal) * 110}`).join(" L ")} L 465,130 Z`} 
                    fill="url(#expenseGradient)" 
                  />
                  <path 
                    d={`M ${activeData.map((d, i) => `${getXCoordinate(i)},${130 - (d.expense / maxChartVal) * 110}`).join(" L ")}`} 
                    fill="none" 
                    stroke="#8b4513" 
                    strokeWidth="2.5" 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                  />
                </>
              )}

              {/* Interactive Points Markers */}
              {activeData.map((d, i) => {
                const x = getXCoordinate(i);
                const incY = 130 - (d.income / maxChartVal) * 110;
                const expY = 130 - (d.expense / maxChartVal) * 110;
                const isCurrent = i === activeIndex;

                return (
                  <g key={i}>
                    {/* Income Point Node */}
                    <circle 
                      cx={x} 
                      cy={incY} 
                      r={isCurrent ? 5.5 : 3.5} 
                      fill={isCurrent ? '#4a5d4e' : '#ffffff'} 
                      stroke="#4a5d4e" 
                      strokeWidth={isCurrent ? 3 : 1.5} 
                    />
                    {/* Expense Point Node */}
                    <circle 
                      cx={x} 
                      cy={expY} 
                      r={isCurrent ? 5.5 : 3.5} 
                      fill={isCurrent ? '#8b4513' : '#ffffff'} 
                      stroke="#8b4513" 
                      strokeWidth={isCurrent ? 3 : 1.5} 
                    />
                  </g>
                );
              })}

              {/* X Axis Labels */}
              {activeData.map((d, i) => (
                <text
                  key={i}
                  x={getXCoordinate(i)}
                  y="154"
                  textAnchor="middle"
                  className={`text-[9.5px] font-mono font-bold tracking-wider ${
                    i === activeIndex ? 'fill-[#2d2d2a] font-extrabold' : 'fill-[#a3a398]'
                  }`}
                >
                  {d.label}
                </text>
              ))}

              {/* Column Trigger Overlays */}
              {activeData.map((_, i) => {
                const totalPoints = activeData.length;
                const xCenter = getXCoordinate(i);
                const width = 430 / totalPoints;
                const startX = xCenter - width / 2;
                return (
                  <rect
                    key={i}
                    x={startX}
                    y="0"
                    width={width}
                    height="160"
                    fill="transparent"
                    className="cursor-pointer"
                    onMouseEnter={() => setHoveredChartIndex(i)}
                    onMouseLeave={() => setHoveredChartIndex(null)}
                  />
                );
              })}
            </svg>
          </div>
          <p className="text-[9px] text-center mt-3 text-[#a3a398] uppercase tracking-[0.16em] font-bold">
            Interactive Daily/Monthly Audit. Slide or Hover Point to Inspect.
          </p>
        </Card>
      </section>

      {/* Recent Flow */}
      <section className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-widest text-[#a3a398]">Recent Transactions</h3>
          <p className="text-[9px] font-bold text-[#4a5d4e]/70 uppercase tracking-widest">Click to Edit</p>
        </div>
        <div className="flex flex-col gap-1">
          {recentTransactions.length > 0 ? (
            recentTransactions.map((t) => (
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
                    <span className="text-sm font-semibold text-[#2d2d2a] block">{t.category}</span>
                    <span className="text-[9px] text-[#a3a398] font-bold uppercase tracking-widest block mt-0.5">
                      {t.note || 'General'}
                    </span>
                  </div>
                </div>
                <p className={`text-sm font-bold font-mono tracking-tight ${t.type === 'income' ? 'text-[#4a5d4e]' : 'text-[#8b4513]'}`}>
                  {t.type === 'income' ? '+' : '-'}{state.currency?.symbol ?? '$'}{t.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </p>
              </button>
            ))
          ) : (
            <p className="text-center text-[#a3a398] py-8 italic text-sm">No transactions yet</p>
          )}
        </div>
      </section>

      {/* Settings Modal Drawer */}
      <AnimatePresence>
        {isSettingsOpen && (
          <>
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSettingsOpen(false)}
              className="fixed inset-0 bg-black z-[110]"
            />
            {/* Slide-out Panel */}
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed bottom-0 left-0 right-0 bg-[#f5f5f0] rounded-t-[32px] p-8 pb-12 z-[120] max-h-[85vh] overflow-y-auto flex flex-col gap-6 shadow-2xl"
            >
              <div className="flex justify-between items-center pb-4 border-b border-[#efeee5]">
                <h2 className="text-lg font-serif italic text-[#4a5d4e] font-bold">Preferences & Workspace Settings</h2>
                <button 
                  onClick={() => setIsSettingsOpen(false)}
                  className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-[#a3a398]"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Currency Selector */}
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-bold text-[#a3a398] uppercase tracking-widest">Global Currency Settings</label>
                <div className="bg-white p-4 rounded-2xl shadow-sm border border-[#efeee5]">
                  <select 
                    value={state.currency?.code ?? 'USD'}
                    onChange={handleCurrencyChange}
                    className="w-full bg-transparent text-sm font-bold text-[#2d2d2a] outline-none border-none py-1"
                  >
                    {CURRENCIES.map(curr => (
                      <option key={curr.code} value={curr.code}>{curr.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Monthly target budget / weekly goal */}
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-bold text-[#a3a398] uppercase tracking-widest">Weekly Spending Limit</label>
                <div className="bg-white p-4 rounded-2xl shadow-sm border border-[#efeee5] flex justify-between items-center">
                  <span className="text-sm font-medium text-[#7a7a72]">Budget Cap</span>
                  <div className="flex items-center gap-3">
                    <button 
                      onClick={() => setWeeklyGoal(Math.max(50, state.weeklyGoal - 50))}
                      className="w-8 h-8 rounded-full bg-[#f5f5f0] font-bold text-center text-[#4a5d4e] hover:bg-[#efeee5]"
                    >
                      -
                    </button>
                    <span className="text-sm font-bold text-[#2d2d2a] font-serif italic">
                      {state.currency?.symbol ?? '$'}{state.weeklyGoal}
                    </span>
                    <button 
                      onClick={() => setWeeklyGoal(state.weeklyGoal + 50)}
                      className="w-8 h-8 rounded-full bg-[#f5f5f0] font-bold text-center text-[#4a5d4e] hover:bg-[#efeee5]"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>

              {/* Backup & Import Workspaces */}
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-bold text-[#a3a398] uppercase tracking-widest">Private Data Backups</label>
                <div className="grid grid-cols-2 gap-4">
                  <Button 
                    variant="outline" 
                    onClick={exportBackup} 
                    className="flex justify-center items-center py-4 text-[#4a5d4e] bg-white text-xs font-bold uppercase tracking-wider"
                    id="export-backup-btn"
                  >
                    <Download size={14} className="mr-2" />
                    Download Backup
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => fileInputRef.current?.click()} 
                    className="flex justify-center items-center py-4 text-[#4a5d4e] bg-white text-xs font-bold uppercase tracking-wider"
                    id="import-backup-btn"
                  >
                    <Upload size={14} className="mr-2" />
                    Upload Backup
                  </Button>
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleFileUpload} 
                    accept=".json" 
                    className="hidden" 
                  />
                </div>
                {importSuccess && (
                  <p className="text-[11px] text-[#4a5d4e] font-semibold text-center mt-2">✨ Backup imported successfully!</p>
                )}
                {importError && (
                  <p className="text-[11px] text-red-600 font-semibold text-center mt-2">⚠️ {importError}</p>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Statement view overlays inside modal */}
      {selectedStatementType && (
        <IncomeExpenseStatementModal
          isOpen={!!selectedStatementType}
          onClose={() => setSelectedStatementType(null)}
          type={selectedStatementType}
        />
      )}
    </div>
  );
}
