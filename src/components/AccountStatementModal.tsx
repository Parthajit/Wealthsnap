/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useWealth } from '../WealthContext';
import { Card, Button } from './UI';
import { X, Download, Calendar, ArrowUpDown, FileText, BarChart3 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Account, Transaction } from '../types';
import { jsPDF } from 'jspdf';

interface AccountStatementModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialAccountId: string;
}

export default function AccountStatementModal({ isOpen, onClose, initialAccountId }: AccountStatementModalProps) {
  const { state } = useWealth();
  
  // Local state
  const [selectedAccountId, setSelectedAccountId] = useState(initialAccountId);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [exportType, setExportType] = useState<'txt' | 'csv' | 'pdf'>('txt');

  // Track the selected account object
  const account = state.accounts.find(acc => acc.id === selectedAccountId) || state.accounts[0];

  // Set default dates on open (Defaults to start of current month to today)
  useEffect(() => {
    if (isOpen) {
      const now = new Date();
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
      
      const formatYMD = (d: Date) => d.toISOString().split('T')[0];
      
      setStartDate(formatYMD(firstDay));
      setEndDate(formatYMD(now));
      setSelectedAccountId(initialAccountId || state.accounts[0]?.id || '');
    }
  }, [isOpen, initialAccountId, state.accounts]);

  if (!isOpen || !account) return null;

  // Fetch all transactions for this account sorted by date ascending
  const allAccountTx = state.transactions
    .filter(t => t.accountId === selectedAccountId)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // 1. Calculate Ending balance of active range:
  // We determine this by winding back from today's current balance
  const txAfterEndDate = allAccountTx.filter(t => t.date > endDate);
  let balanceAtEnd = account.balance;
  txAfterEndDate.forEach(t => {
    balanceAtEnd += t.type === 'income' ? -t.amount : t.amount;
  });

  // 2. Filter transactions strictly within target category period [startDate, endDate]
  const inRangeTx = allAccountTx.filter(t => t.date >= startDate && t.date <= endDate);

  // 3. Subtract all range transactions backwards to determine opening range balance
  let balanceAtStart = balanceAtEnd;
  inRangeTx.forEach(t => {
    balanceAtStart += t.type === 'income' ? -t.amount : t.amount;
  });

  // Calculate aggregated inflow and outflow inside range
  const totalInflow = inRangeTx
    .filter(t => t.type === 'income')
    .reduce((acc, curr) => acc + curr.amount, 0);

  const totalOutflow = inRangeTx
    .filter(t => t.type === 'expense')
    .reduce((acc, curr) => acc + curr.amount, 0);

  // 4. Trace forward from computed starting balance to render absolute running balances
  let currentRunning = balanceAtStart;
  const ledgerRows = inRangeTx.map(t => {
    if (t.type === 'income') {
      currentRunning += t.amount;
    } else {
      currentRunning -= t.amount;
    }
    return {
      ...t,
      runningBalance: currentRunning,
    };
  });

  // Quick range selectors
  const applyQuickRange = (rangeType: 'this-month' | 'last-30' | 'last-90' | 'this-year' | 'all-time') => {
    const now = new Date();
    const formatYMD = (d: Date) => d.toISOString().split('T')[0];
    
    switch (rangeType) {
      case 'this-month':
        setStartDate(formatYMD(new Date(now.getFullYear(), now.getMonth(), 1)));
        setEndDate(formatYMD(now));
        break;
      case 'last-30':
        setStartDate(formatYMD(new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)));
        setEndDate(formatYMD(now));
        break;
      case 'last-90':
        setStartDate(formatYMD(new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)));
        setEndDate(formatYMD(now));
        break;
      case 'this-year':
        setStartDate(formatYMD(new Date(now.getFullYear(), 0, 1)));
        setEndDate(formatYMD(now));
        break;
      case 'all-time':
        // Earliest tx recorded or default to opening date / far back
        if (allAccountTx.length > 0) {
          setStartDate(allAccountTx[0].date);
        } else {
          setStartDate(account.openingDate || '2024-01-01');
        }
        setEndDate(formatYMD(now));
        break;
    }
  };

  // Build Monospace TXT Download Block
  const handleTxtDownload = () => {
    const sym = state.currency?.symbol ?? '$';
    let textOut = `==================================================================\n`;
    textOut += `               WEALTIHSNAP OFFICIAL STATEMENT SHEET\n`;
    textOut += `==================================================================\n\n`;
    textOut += `ACCOUNT INFORMATION\n`;
    textOut += `-------------------\n`;
    textOut += `Account ID       : ${account.name}\n`;
    textOut += `Account Type     : ${account.type}\n`;
    textOut += `Account Number   : ${account.accountNumber || "N/A"}\n`;
    textOut += `Statement Period : ${startDate} to ${endDate}\n`;
    textOut += `Currency         : ${state.currency?.code ?? "USD"} (${sym})\n`;
    textOut += `Generated Epoch  : ${new Date().toLocaleString()}\n\n`;
    
    textOut += `PERIOD FINANCIAL METRICS\n`;
    textOut += `------------------------\n`;
    textOut += `Opening Balance  : ${sym}${balanceAtStart.toLocaleString(undefined, { minimumFractionDigits: 2 })}\n`;
    textOut += `Aggregate Inflow : ${sym}${totalInflow.toLocaleString(undefined, { minimumFractionDigits: 2 })}\n`;
    textOut += `Aggregate Outflow: ${sym}${totalOutflow.toLocaleString(undefined, { minimumFractionDigits: 2 })}\n`;
    textOut += `Closing Balance  : ${sym}${balanceAtEnd.toLocaleString(undefined, { minimumFractionDigits: 2 })}\n\n`;
    
    textOut += `TRANSACTION DETAIL LEDGER\n`;
    textOut += `==================================================================\n`;
    textOut += `${"DATE".padEnd(12)} ${"CATEGORY / MEMO".padEnd(22)} ${"NET CHANGE".padEnd(14)} ${"RUNNING BALANCE".padEnd(16)}\n`;
    textOut += `------------------------------------------------------------------\n`;
    
    if (ledgerRows.length === 0) {
      textOut += `           *** NO TRANSACTIONS REPORTED IN THIS PERIOD ***\n`;
    } else {
      ledgerRows.forEach(row => {
        const sign = row.type === 'income' ? '+' : '-';
        const changeStr = `${sign}${sym}${row.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
        const balanceStr = `${sym}${row.runningBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
        const categoryNote = row.note ? `${row.category} (${row.note})` : row.category;
        
        // Trim or pad to stay aligned
        const categoryCol = categoryNote.length > 20 ? categoryNote.substring(0, 18) + '..' : categoryNote;
        
        textOut += `${row.date.padEnd(12)} ${categoryCol.padEnd(22)} ${changeStr.padEnd(14)} ${balanceStr.padEnd(16)}\n`;
      });
    }
    textOut += `==================================================================\n`;
    textOut += `Disclaimer: WealthSnap is 100% server-side private, encrypted locally on machine.\n`;

    const blob = new Blob([textOut], { type: 'text/plain;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `statement_${account.name.toLowerCase().replace(/\s+/g, '_')}_${startDate}_${endDate}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Build CSV Download Block
  const handleCsvDownload = () => {
    const csvArray = [
      ["WEALTHSNAP SECURE DIGITAL BANKING - ACCOUNT STATEMENT"],
      ["Account Profile Details"],
      ["Account Title", account.name],
      ["Credential Category", account.type],
      ["Terminal Account Code", account.accountNumber || "N/A"],
      ["Effective Period", `${startDate} to ${endDate}`],
      ["System Currency", state.currency?.code ?? "USD"],
      [],
      ["STATEMENT RECONCILIATION SUMMARY"],
      ["Opening Running Balance", balanceAtStart.toFixed(2)],
      ["Period Total Inflow", totalInflow.toFixed(2)],
      ["Period Total Outflow", totalOutflow.toFixed(2)],
      ["Reconciled Closing Balance", balanceAtEnd.toFixed(2)],
      [],
      ["LEDGER TRANSACTIONS RECORD"],
      ["Date", "Category", "Note / Memo", "Flow Direction", "Change Amount", "Running Cumulative Balance"]
    ];

    ledgerRows.forEach(r => {
      csvArray.push([
        r.date,
        r.category,
        r.note || "",
        r.type.toUpperCase(),
        (r.type === 'income' ? '+' : '-') + r.amount.toFixed(2),
        r.runningBalance.toFixed(2)
      ]);
    });

    const csvContent = "data:text/csv;charset=utf-8," + csvArray.map(e => e.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `statement_${account.name.toLowerCase().replace(/\s+/g, '_')}_${startDate}_${endDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePdfDownload = () => {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });
    const sym = state.currency?.symbol ?? '$';
    
    // Page Dimensions: A4 is 210mm x 297mm
    let y = 18;
    
    // Draw Header Banner (WealthSnap)
    doc.setFillColor(74, 93, 78); // #4a5d4e Olive green
    doc.rect(14, y, 182, 18, 'F');
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(255, 255, 255);
    doc.text('WEALTHSNAP DIGITAL BANKING', 20, y + 11);
    
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(10);
    doc.text('ACCOUNT STATEMENT', 140, y + 11);
    
    y += 28;

    // Account Profile Info
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);
    doc.text('ACCOUNT SUMMARY', 14, y);
    doc.setDrawColor(220, 220, 220);
    doc.line(14, y + 2, 196, y + 2);
    
    y += 8;
    
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(45, 45, 42); // deep charcoal
    doc.text(`Account Name :`, 14, y);
    doc.setFont('helvetica', 'normal');
    doc.text(`${account.name}`, 48, y);
    
    // Right side: Statement Period
    doc.setFont('helvetica', 'bold');
    doc.text(`Statement Period:`, 115, y);
    doc.setFont('helvetica', 'normal');
    doc.text(`${startDate} to ${endDate}`, 152, y);
    
    y += 6;
    doc.setFont('helvetica', 'bold');
    doc.text(`Account Number:`, 14, y);
    doc.setFont('helvetica', 'normal');
    doc.text(`${account.accountNumber || "N/A"}`, 48, y);
    
    doc.setFont('helvetica', 'bold');
    doc.text(`Currency:`, 115, y);
    doc.setFont('helvetica', 'normal');
    doc.text(`${state.currency?.code ?? "USD"} (${sym})`, 152, y);
    
    y += 6;
    doc.setFont('helvetica', 'bold');
    doc.text(`Account Type :`, 14, y);
    doc.setFont('helvetica', 'normal');
    doc.text(`${account.type}`, 48, y);
    
    doc.setFont('helvetica', 'bold');
    doc.text(`Report Generated:`, 115, y);
    doc.setFont('helvetica', 'normal');
    doc.text(`${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`, 152, y);
    
    y += 12;
    
    // Summary Figures Box
    doc.setFillColor(245, 245, 240); // bg color
    doc.rect(14, y, 182, 18, 'F');
    doc.setDrawColor(230, 230, 225);
    doc.rect(14, y, 182, 18, 'S');
    
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(130, 130, 120);
    doc.text('OPENING BALANCE', 20, y + 5);
    doc.text('TOTAL DEPOSITS (+)', 65, y + 5);
    doc.text('TOTAL WITHDRAWALS (-)', 110, y + 5);
    doc.text('CLOSING BALANCE', 155, y + 5);
    
    doc.setFontSize(10);
    doc.setTextColor(45, 45, 42);
    doc.text(`${sym}${balanceAtStart.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, 20, y + 12);
    doc.setTextColor(61, 99, 86); // green deposits
    doc.text(`+${sym}${totalInflow.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, 65, y + 12);
    doc.setTextColor(139, 69, 19); // brown expenses
    doc.text(`-${sym}${totalOutflow.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, 110, y + 12);
    doc.setTextColor(45, 45, 42);
    doc.text(`${sym}${balanceAtEnd.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, 155, y + 12);
    
    y += 28;
    
    // Ledger Header
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);
    doc.text('TRANSACTION LEDGER', 14, y);
    doc.setDrawColor(200, 200, 200);
    doc.line(14, y + 2, 196, y + 2);
    
    y += 8;
    
    // Draw Table Headings
    doc.setFillColor(235, 235, 230);
    doc.rect(14, y, 182, 7, 'F');
    doc.setFontSize(8);
    doc.setTextColor(80, 80, 75);
    
    doc.text('DATE', 18, y + 5);
    doc.text('DESCRIPTION / CATEGORY / MEMO', 45, y + 5);
    doc.text('NET CHANGE', 135, y + 5, { align: 'right' });
    doc.text('RUNNING NET', 185, y + 5, { align: 'right' });
    
    y += 7;
    
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(45, 45, 42);
    
    if (ledgerRows.length === 0) {
      doc.setFont('helvetica', 'italic');
      doc.text('*** No transactions recorded in this period ***', 105, y + 10, { align: 'center' });
    } else {
      // Reverse copy or slice so latest transactions or ordered transactions is consistent with UI
      const rowList = ledgerRows.slice().reverse();
      
      rowList.forEach((row, index) => {
        // Page breaking utility
        if (y > 270) {
          doc.addPage();
          y = 18;
          
          // Reprint head columns
          doc.setFillColor(235, 235, 230);
          doc.rect(14, y, 182, 7, 'F');
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(8);
          doc.setTextColor(80, 80, 75);
          doc.text('DATE', 18, y + 5);
          doc.text('DESCRIPTION / CATEGORY / MEMO', 45, y + 5);
          doc.text('NET CHANGE', 135, y + 5, { align: 'right' });
          doc.text('RUNNING NET', 185, y + 5, { align: 'right' });
          y += 7;
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(45, 45, 42);
        }
        
        // Alternating background coloring
        if (index % 2 === 1) {
          doc.setFillColor(250, 250, 248);
          doc.rect(14, y, 182, 7.5, 'F');
        }
        
        doc.setFontSize(8);
        doc.text(row.date, 18, y + 5.5);
        
        const mainDesc = row.category;
        const memoStr = row.note ? ` - ${row.note}` : '';
        const limitChar = 52;
        let descriptionFull = mainDesc + memoStr;
        if (descriptionFull.length > limitChar) {
          descriptionFull = descriptionFull.substring(0, limitChar - 3) + '...';
        }
        doc.text(descriptionFull, 45, y + 5.5);
        
        // Change Amount text format
        const sign = row.type === 'income' ? '+' : '-';
        const changeStr = `${sign}${sym}${row.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
        if (row.type === 'income') {
          doc.setTextColor(61, 99, 86);
        } else {
          doc.setTextColor(139, 69, 19);
        }
        doc.setFont('helvetica', 'bold');
        doc.text(changeStr, 135, y + 5.5, { align: 'right' });
        
        // Running Net balance
        doc.setTextColor(45, 45, 42);
        const runningStr = `${sym}${row.runningBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
        doc.text(runningStr, 185, y + 5.5, { align: 'right' });
        
        y += 7.5;
        doc.setFont('helvetica', 'normal');
      });
    }
    
    // Page bottom notice info footer
    if (y > 265) {
      doc.addPage();
      y = 18;
    }
    y += 8;
    doc.setDrawColor(230, 230, 225);
    doc.line(14, y, 196, y);
    y += 5;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(150, 150, 150);
    doc.text('WealthSnap Client Statement Generator. Your records are store completely locally in your direct workspace state, safeguarding privacy.', 14, y);
    
    doc.save(`statement_${account.name.toLowerCase().replace(/\s+/g, '_')}_${startDate}_${endDate}.pdf`);
  };

  const executeDownload = () => {
    if (exportType === 'txt') {
      handleTxtDownload();
    } else if (exportType === 'csv') {
      handleCsvDownload();
    } else {
      handlePdfDownload();
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[120] flex items-end justify-center">
        {/* Backdrop overlay */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.5 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/40 backdrop-blur-sm"
        />

        {/* Dynamic sliding panel */}
        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 26, stiffness: 220 }}
          className="relative w-full max-w-2xl bg-[#f5f5f0] rounded-t-[36px] flex flex-col max-h-[92vh] overflow-hidden shadow-2xl z-[130]"
        >
          {/* Header */}
          <div className="flex justify-between items-center p-6 border-b border-[#efeee5] bg-white rounded-t-[36px]">
            <div className="flex flex-col gap-0.5">
              <span className="text-[9px] font-bold text-[#a3a398] uppercase tracking-[0.2em]">Official Vault Archive</span>
              <h2 className="text-xl font-serif italic text-[#4a5d4e] font-bold">Account Statement Sheet</h2>
            </div>
            <button
              onClick={onClose}
              className="w-10 h-10 rounded-full bg-[#f5f5f0] hover:bg-[#efeee5] flex items-center justify-center text-[#7a7a72] transition-colors"
              id="statement-close-btn"
            >
              <X size={18} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6">
            {/* Account Switcher Options */}
            <div className="flex flex-col gap-2">
              <label className="text-[9px] font-bold text-[#a3a398] uppercase tracking-widest">Active Account Select</label>
              <select
                value={selectedAccountId}
                onChange={(e) => setSelectedAccountId(e.target.value)}
                className="w-full bg-white border border-[#efeee5] p-3 rounded-2xl text-xs font-bold text-[#2d2d2a] shadow-sm outline-none"
                id="statement-account-selector"
              >
                {state.accounts.map(acc => (
                  <option key={acc.id} value={acc.id}>
                    {acc.name} {acc.accountNumber ? `(• ${acc.accountNumber})` : ''} — {state.currency?.symbol ?? '$'}{acc.balance.toLocaleString()}
                  </option>
                ))}
              </select>
            </div>

            {/* Date Picker Setup */}
            <div className="flex flex-col gap-3 bg-white p-5 rounded-[28px] border border-[#efeee5] shadow-sm">
              <div className="flex justify-between items-center pb-2 border-b border-[#efeee5]/60">
                <span className="text-[9px] font-bold text-[#a3a398] uppercase tracking-widest flex items-center gap-1.5">
                  <Calendar size={12} className="text-[#4a5d4e]" /> Range Parameters
                </span>
                <span className="text-[10px] text-[#4a5d4e] font-bold">Adjust bounds manually</span>
              </div>
              
              <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="flex flex-col gap-1.5 text-left">
                  <span className="text-[9px] font-bold text-[#a3a398] uppercase tracking-widest">Starting Date</span>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="bg-[#f5f5f0] text-xs font-bold text-[#2d2d2a] p-3 rounded-xl border border-[#efeee5] outline-none w-full"
                    id="statement-start-date"
                  />
                </div>
                <div className="flex flex-col gap-1.5 text-left">
                  <span className="text-[9px] font-bold text-[#a3a398] uppercase tracking-widest">Ending Date</span>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="bg-[#f5f5f0] text-xs font-bold text-[#2d2d2a] p-3 rounded-xl border border-[#efeee5] outline-none w-full"
                    id="statement-end-date"
                  />
                </div>
              </div>

              {/* Quick Range Selector Chips */}
              <div className="flex flex-wrap gap-1.5 pt-2">
                <button
                  onClick={() => applyQuickRange('this-month')}
                  className="px-3 py-1.5 bg-[#f5f5f0] hover:bg-[#efeee5] active:scale-95 text-[9px] font-bold uppercase text-[#4a5d4e] rounded-lg transition-all"
                >
                  MTD (This Month)
                </button>
                <button
                  onClick={() => applyQuickRange('last-30')}
                  className="px-3 py-1.5 bg-[#f5f5f0] hover:bg-[#efeee5] active:scale-95 text-[9px] font-bold uppercase text-[#4a5d4e] rounded-lg transition-all"
                >
                  Last 30 Days
                </button>
                <button
                  onClick={() => applyQuickRange('last-90')}
                  className="px-3 py-1.5 bg-[#f5f5f0] hover:bg-[#efeee5] active:scale-95 text-[9px] font-bold uppercase text-[#4a5d4e] rounded-lg transition-all"
                >
                  Last Quarter
                </button>
                <button
                  onClick={() => applyQuickRange('this-year')}
                  className="px-3 py-1.5 bg-[#f5f5f0] hover:bg-[#efeee5] active:scale-95 text-[9px] font-bold uppercase text-[#4a5d4e] rounded-lg transition-all"
                >
                  YTD (This Year)
                </button>
                <button
                  onClick={() => applyQuickRange('all-time')}
                  className="px-3 py-1.5 bg-[#f5f5f0] hover:bg-[#efeee5] active:scale-95 text-[9px] font-bold uppercase text-[#4a5d4e] rounded-lg transition-all"
                >
                  All Time
                </button>
              </div>
            </div>

            {/* Reconciliation Statement Sheet Overview */}
            <div className="flex flex-col gap-2">
              <label className="text-[9px] font-bold text-[#a3a398] uppercase tracking-widest">Period Reconciliation Summary</label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <Card className="bg-white border-[#efeee5] p-4 flex flex-col gap-0.5 justify-center shadow-none text-left">
                  <span className="text-[8px] font-bold text-[#a3a39af] uppercase tracking-[0.15em] block">Opening Net</span>
                  <span className="text-sm font-bold font-mono tracking-tight text-gray-800 truncate block">
                    {state.currency?.symbol ?? '$'}{balanceAtStart.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                </Card>
                <Card className="bg-[#e4ece6] border-none p-4 flex flex-col gap-0.5 justify-center shadow-none text-left text-[#3d6356]">
                  <span className="text-[8px] font-bold opacity-75 uppercase tracking-[0.15em] block">Deposits (+)</span>
                  <span className="text-sm font-bold font-mono tracking-tight text-[#3d6356] truncate block">
                    +{state.currency?.symbol ?? '$'}{totalInflow.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                </Card>
                <Card className="bg-[#fdebea] border-none p-4 flex flex-col gap-0.5 justify-center shadow-none text-left text-red-800">
                  <span className="text-[8px] font-bold opacity-75 uppercase tracking-[0.15em] block">Outflow (-)</span>
                  <span className="text-sm font-bold font-mono tracking-tight text-red-800 truncate block">
                    -{state.currency?.symbol ?? '$'}{totalOutflow.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                </Card>
                <Card className="bg-[#4a5d4e] text-white border-none p-4 flex flex-col gap-0.5 justify-center shadow-none text-left">
                  <span className="text-[8px] font-bold opacity-75 uppercase tracking-[0.15em] block">Closing Net</span>
                  <span className="text-sm font-bold font-mono tracking-tight truncate block">
                    {state.currency?.symbol ?? '$'}{balanceAtEnd.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                </Card>
              </div>
            </div>

            {/* Detailed Running Ledger List */}
            <div className="flex flex-col gap-2 flex-1 min-h-[220px]">
              <div className="flex justify-between items-center">
                <label className="text-[9px] font-bold text-[#a3a398] uppercase tracking-widest">Ledger Entries ({ledgerRows.length})</label>
                <span className="text-[9px] font-mono text-[#4a5d4e] tracking-tight">With Post-Tx Running Balance</span>
              </div>
              
              <div className="bg-white rounded-2xl border border-[#efeee5] shadow-sm overflow-hidden flex-1 flex flex-col min-h-0">
                {/* Visual table headers */}
                <div className="grid grid-cols-12 bg-[#fdfdfc] text-[8px] font-bold text-[#a3a398] uppercase border-b border-[#efeee5]/60 py-3 px-4 select-none tracking-widest">
                  <span className="col-span-3">Date</span>
                  <span className="col-span-4">Category / Memo</span>
                  <span className="col-span-2 text-right">Amount</span>
                  <span className="col-span-3 text-right">Running Net</span>
                </div>

                {/* Rows Area */}
                <div className="flex-1 overflow-y-auto divide-y divide-[#efeee5]/40 min-h-[160px]">
                  {ledgerRows.length === 0 ? (
                    <div className="flex flex-col items-center justify-center p-12 text-[#a3a398] gap-2 h-full">
                      <BarChart3 size={32} className="opacity-25 animate-pulse" />
                      <p className="text-xs italic font-semibold">No entries present in defined period</p>
                      <p className="text-[10px] opacity-70">Adjust starting/ending boundaries above</p>
                    </div>
                  ) : (
                    ledgerRows.slice().reverse().map((row) => (
                      <div key={row.id} className="grid grid-cols-12 items-center py-3 px-4 text-left transition-all hover:bg-[#fafaf8]">
                        {/* Date column */}
                        <span className="col-span-3 font-mono text-[10px] text-[#7a7a72] block">
                          {row.date}
                        </span>

                        {/* Category and memo details */}
                        <div className="col-span-4 pr-1">
                          <span className="text-xs font-semibold text-[#2d2d2a] block leading-tight truncate">
                            {row.category}
                          </span>
                          {row.note && (
                            <span className="text-[9px] font-medium text-[#7a7a72] block leading-tight truncate italic">
                              {row.note}
                            </span>
                          )}
                        </div>

                        {/* Net flow change column */}
                        <span className={`col-span-2 font-mono text-xs font-bold text-right truncate block ${row.type === 'income' ? 'text-[#3d6356]' : 'text-[#8b4513]'}`}>
                          {row.type === 'income' ? '+' : '-'}{state.currency?.symbol ?? '$'}{row.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </span>

                        {/* Post-transaction Running Balance column */}
                        <span className="col-span-3 font-mono text-[11px] font-bold text-[#2d2d2a] text-right block truncate">
                          {state.currency?.symbol ?? '$'}{row.runningBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Export Settings Panel Frame Footer */}
          <div className="p-6 bg-white border-t border-[#efeee5] flex flex-col sm:flex-row gap-4 justify-between items-center">
            {/* Format Picker */}
            <div className="flex items-center gap-3">
              <span className="text-[10px] font-bold text-[#a3a398] uppercase tracking-widest font-sans">Format:</span>
              <div className="inline-flex rounded-xl bg-[#f5f5f0] p-1 border border-[#efeee5]">
                <button
                  onClick={() => setExportType('txt')}
                  className={`px-3 py-1.5 rounded-lg text-[9px] font-bold uppercase transition-all ${
                    exportType === 'txt'
                      ? 'bg-white shadow-sm text-[#4a5d4e]'
                      : 'text-[#a3a398] hover:text-[#4a5d4e]'
                  }`}
                >
                  TXT
                </button>
                <button
                  onClick={() => setExportType('csv')}
                  className={`px-3 py-1.5 rounded-lg text-[9px] font-bold uppercase transition-all ${
                    exportType === 'csv'
                      ? 'bg-white shadow-sm text-[#4a5d4e]'
                      : 'text-[#a3a398] hover:text-[#4a5d4e]'
                  }`}
                >
                  CSV
                </button>
                <button
                  onClick={() => setExportType('pdf')}
                  className={`px-3 py-1.5 rounded-lg text-[9px] font-bold uppercase transition-all ${
                    exportType === 'pdf'
                      ? 'bg-white shadow-sm text-[#4a5d4e]'
                      : 'text-[#a3a398] hover:text-[#4a5d4e]'
                  }`}
                >
                  PDF
                </button>
              </div>
            </div>

            {/* Direct download operation action */}
            <Button
              variant="primary"
              onClick={executeDownload}
              className="py-3 px-6 text-xs tracking-wider uppercase font-bold w-full sm:w-auto"
              id="download-statement-btn"
            >
              <Download size={15} className="mr-2 inline" /> Download Ledger File
            </Button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
