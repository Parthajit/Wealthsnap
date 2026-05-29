/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useWealth } from '../WealthContext';
import { Card, Button } from './UI';
import { X, Download, FileText, Calendar, ArrowUpRight, ArrowDownLeft, TrendingUp } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { jsPDF } from 'jspdf';
import { Transaction } from '../types';

interface IncomeExpenseStatementModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'income' | 'expense';
}

export default function IncomeExpenseStatementModal({ isOpen, onClose, type }: IncomeExpenseStatementModalProps) {
  const { state } = useWealth();
  const [exportType, setExportType] = useState<'txt' | 'csv' | 'pdf'>('pdf');

  if (!isOpen) return null;

  const currencySymbol = state.currency?.symbol ?? '$';
  const isIncome = type === 'income';

  // Get current month info
  const now = new Date();
  const currentMonthName = now.toLocaleString(undefined, { month: 'long', year: 'numeric' });
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfMonthStr = startOfMonth.toISOString().split('T')[0];
  const todayStr = now.toISOString().split('T')[0];

  // Filter transactions for current month of correct type (income or expense)
  const currentMonthTx = state.transactions.filter(t => {
    const txDate = new Date(t.date);
    return txDate >= startOfMonth && t.type === type;
  }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()); // Sort ascending for statement flow

  // Group by category to show a mini breakdown
  const categorySummary = currentMonthTx.reduce((acc, curr) => {
    acc[curr.category] = (acc[curr.category] || 0) + curr.amount;
    return acc;
  }, {} as Record<string, number>);

  const sortedCategories = (Object.entries(categorySummary) as [string, number][]).sort((a, b) => b[1] - a[1]);

  const totalSum = currentMonthTx.reduce((acc, curr) => acc + curr.amount, 0);

  // Download logic for Monospace TXT
  const handleTxtDownload = () => {
    let t = `==================================================================\n`;
    t += `                 WEALTHSNAP DIGITAL BANKING RECORD\n`;
    t += `                  MONTHLY ${type.toUpperCase()} STATEMENT\n`;
    t += `==================================================================\n\n`;
    t += `PERIOD METRICS\n`;
    t += `--------------\n`;
    t += `Statement Period : ${currentMonthName} (Current Month)\n`;
    t += `Statement Type   : ${type.toUpperCase()} Analysis\n`;
    t += `Currency         : ${state.currency?.code ?? 'USD'} (${currencySymbol})\n`;
    t += `Total Amount     : ${currencySymbol}${totalSum.toLocaleString(undefined, { minimumFractionDigits: 2 })}\n`;
    t += `Generated Epoch  : ${new Date().toLocaleString()}\n\n`;

    t += `CATEGORY BREAKDOWN\n`;
    t += `------------------\n`;
    if (sortedCategories.length === 0) {
      t += `No categories reported.\n`;
    } else {
      sortedCategories.forEach(([cat, val]) => {
        const pct = totalSum > 0 ? ((val / totalSum) * 100).toFixed(1) : '0.0';
        t += `${cat.padEnd(20)}: ${currencySymbol}${val.toLocaleString(undefined, { minimumFractionDigits: 2 })} (${pct}%)\n`;
      });
    }
    t += `\n`;

    t += `TRANSACTION DETAIL LEDGER\n`;
    t += `==================================================================\n`;
    t += `${"DATE".padEnd(12)} ${"CATEGORY / MEMO".padEnd(25)} ${"ACCOUNT".padEnd(14)} ${"AMOUNT".padEnd(12)}\n`;
    t += `------------------------------------------------------------------\n`;

    if (currentMonthTx.length === 0) {
      t += `           *** NO TRANSACTIONS REPORTED IN THIS PERIOD ***\n`;
    } else {
      currentMonthTx.forEach(row => {
        const acc = state.accounts.find(a => a.id === row.accountId);
        const accName = acc ? acc.name : 'Cash';
        const notes = row.note ? `${row.category} (${row.note})` : row.category;
        const notesCol = notes.length > 23 ? notes.substring(0, 21) + '..' : notes;
        
        t += `${row.date.padEnd(12)} ${notesCol.padEnd(25)} ${accName.substring(0, 12).padEnd(14)} ${currencySymbol}${row.amount.toLocaleString(undefined, { minimumFractionDigits: 2 }).padEnd(12)}\n`;
      });
    }
    t += `==================================================================\n`;

    const blob = new Blob([t], { type: 'text/plain;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `monthly_${type}_statement_${now.getFullYear()}_${now.getMonth() + 1}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Download logic for CSV
  const handleCsvDownload = () => {
    const csvArray = [
      [`WEALTHSNAP DIGITAL BANKING - MONTHLY ${type.toUpperCase()} STATEMENT`],
      ["Statement Metadata"],
      ["Statement Period", currentMonthName],
      ["Statement Focus", type.toUpperCase()],
      ["System Currency", state.currency?.code ?? "USD"],
      ["Aggregated Total", totalSum.toFixed(2)],
      [],
      ["CATEGORY ANALYSIS SUMMARY"],
      ["Category", "Volume Amount", "Percentage Contribution"]
    ];

    sortedCategories.forEach(([cat, val]) => {
      const pct = totalSum > 0 ? ((val / totalSum) * 100).toFixed(1) + "%" : "0%";
      csvArray.push([cat, val.toFixed(2), pct]);
    });

    csvArray.push([], ["DETAILED LEDGER INDEX"], ["Date", "Category", "Note / Memo", "Target Account", "Amount"]);

    currentMonthTx.forEach(row => {
      const acc = state.accounts.find(a => a.id === row.accountId);
      csvArray.push([
        row.date,
        row.category,
        row.note || "",
        acc ? acc.name : "Cash",
        row.amount.toFixed(2)
      ]);
    });

    const csvContent = "data:text/csv;charset=utf-8," + csvArray.map(e => e.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `monthly_${type}_statement_${now.getFullYear()}_${now.getMonth() + 1}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Download logic for PDF
  const handlePdfDownload = () => {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    let y = 18;

    // Header Banner Style (Teal Green for Income, deep brown/coral for Expense)
    if (isIncome) {
      doc.setFillColor(74, 93, 78); // #4a5d4e Olive green
    } else {
      doc.setFillColor(139, 69, 19); // Brown style
    }
    doc.rect(14, y, 182, 18, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(255, 255, 255);
    doc.text('WEALTHSNAP PRIVATE WEALTH', 20, y + 11);

    doc.setFont('helvetica', 'italic');
    doc.setFontSize(9.5);
    doc.text(`MONTHLY ${type.toUpperCase()} STATEMENT`, 130, y + 11);

    y += 28;

    // Period Details
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);
    doc.text('STATEMENT OF ACCOUNT', 14, y);
    doc.setDrawColor(220, 220, 220);
    doc.line(14, y + 2, 196, y + 2);

    y += 8;
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(45, 45, 42);
    doc.text(`Statement Cycle :`, 14, y);
    doc.setFont('helvetica', 'normal');
    doc.text(`${currentMonthName}`, 48, y);

    doc.setFont('helvetica', 'bold');
    doc.text(`Total Period ${type.charAt(0).toUpperCase() + type.slice(1)}:`, 110, y);
    doc.setFont('helvetica', 'normal');
    const displaySum = `${currencySymbol}${totalSum.toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
    doc.text(displaySum, 155, y);

    y += 6;
    doc.setFont('helvetica', 'bold');
    doc.text(`Currency Account :`, 14, y);
    doc.setFont('helvetica', 'normal');
    doc.text(`${state.currency?.code ?? 'USD'} (${currencySymbol})`, 48, y);

    doc.setFont('helvetica', 'bold');
    doc.text(`Report Timestamp :`, 110, y);
    doc.setFont('helvetica', 'normal');
    doc.text(`${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`, 155, y);

    y += 12;

    // Category Summary Box
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);
    doc.text('CATEGORY ALLOCATION BREAKDOWN', 14, y);
    doc.line(14, y + 2, 196, y + 2);

    y += 8;
    if (sortedCategories.length === 0) {
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(8.5);
      doc.setTextColor(120, 120, 120);
      doc.text('No categories parsed in this month.', 14, y);
      y += 6;
    } else {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setFillColor(245, 245, 240);
      doc.rect(14, y, 182, 6, 'F');
      doc.setTextColor(80, 80, 75);
      doc.text('CATEGORY NAME', 18, y + 4.5);
      doc.text('ALLOCATION VOLUME', 105, y + 4.5, { align: 'right' });
      doc.text('SHARE CONTRIBUTION', 150, y + 4.5, { align: 'right' });
      y += 6;

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(45, 45, 42);
      sortedCategories.forEach(([cat, val], idx) => {
        if (idx % 2 === 1) {
          doc.setFillColor(250, 250, 248);
          doc.rect(14, y, 182, 6, 'F');
        }
        doc.text(cat, 18, y + 4.5);
        doc.text(`${currencySymbol}${val.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, 105, y + 4.5, { align: 'right' });
        const pct = totalSum > 0 ? ((val / totalSum) * 100).toFixed(1) + "%" : '0%';
        doc.text(pct, 150, y + 4.5, { align: 'right' });
        y += 6;
      });
    }

    y += 10;

    // Ledgers Header
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);
    doc.text('DETAILED FLOW LEDGER', 14, y);
    doc.line(14, y + 2, 196, y + 2);

    y += 8;

    // Table Header Columns
    doc.setFillColor(235, 235, 230);
    doc.rect(14, y, 182, 7, 'F');
    doc.setFontSize(8);
    doc.setTextColor(80, 80, 75);
    doc.text('DATE', 18, y + 5);
    doc.text('MEMO / CATEGORY / NOTE', 45, y + 5);
    doc.text('ACCOUNT TYPE', 130, y + 5);
    doc.text('AMOUNT', 185, y + 5, { align: 'right' });

    y += 7;

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(45, 45, 42);

    if (currentMonthTx.length === 0) {
      doc.setFont('helvetica', 'italic');
      doc.text('*** No transactions of this type logged in current month ***', 105, y + 8, { align: 'center' });
    } else {
      const reversedTx = currentMonthTx.slice().reverse();
      reversedTx.forEach((row, index) => {
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
          doc.text('MEMO / CATEGORY / NOTE', 45, y + 5);
          doc.text('ACCOUNT TYPE', 130, y + 5);
          doc.text('AMOUNT', 185, y + 5, { align: 'right' });
          y += 7;
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(45, 45, 42);
        }

        if (index % 2 === 1) {
          doc.setFillColor(250, 250, 248);
          doc.rect(14, y, 182, 7.5, 'F');
        }

        doc.text(row.date, 18, y + 5);
        
        const fullMemo = row.note ? `${row.category} (${row.note})` : row.category;
        doc.text(fullMemo.length > 50 ? fullMemo.substring(0, 48) + '..' : fullMemo, 45, y + 5);

        const acc = state.accounts.find(a => a.id === row.accountId);
        doc.text(acc ? acc.name : 'Cash', 130, y + 5);

        const amtStr = `${isIncome ? '+' : '-'}${currencySymbol}${row.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
        
        if (isIncome) {
          doc.setTextColor(61, 99, 86);
        } else {
          doc.setTextColor(139, 69, 19);
        }
        doc.setFont('helvetica', 'bold');
        doc.text(amtStr, 185, y + 5, { align: 'right' });

        y += 7.5;
        doc.setTextColor(45, 45, 42);
        doc.setFont('helvetica', 'normal');
      });
    }

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
    doc.text('WealthSnap Client Statement Generator. Secure, Private, 100% on-device cryptography & workspace storage.', 14, y);

    doc.save(`monthly_${type}_statement_${now.getFullYear()}_${now.getMonth() + 1}.pdf`);
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

        {/* Sliding panel */}
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
              <span className="text-[9px] font-bold text-[#a3a398] uppercase tracking-[0.2em]">{currentMonthName} Flow Status</span>
              <h2 className="text-xl font-serif italic text-[#4a5d4e] font-bold">
                Monthly {isIncome ? 'Income' : 'Expense'} Statement
              </h2>
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
            {/* Period Total */}
            <div className="bg-white p-6 rounded-[28px] border border-[#efeee5] text-center shadow-sm">
              <span className="text-[10px] font-bold text-[#a3a398] uppercase tracking-widest block mb-1">
                Total Month Spend/Gain Category Snapshot
              </span>
              <h2 className={`text-4xl font-serif italic font-bold my-1 ${isIncome ? 'text-[#4a5d4e]' : 'text-[#8b4513]'}`}>
                {isIncome ? '+' : '-'}{currencySymbol}{totalSum.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </h2>
              <p className="text-[#a3a398] text-[9px] uppercase tracking-widest font-sans font-bold">
                From {startOfMonthStr} to {todayStr}
              </p>
            </div>

            {/* Aggregated Categories Progress Bars */}
            <div className="flex flex-col gap-3 bg-white p-5 rounded-[28px] border border-[#efeee5] shadow-sm text-left">
              <span className="text-[9px] font-bold text-[#a3a398] uppercase tracking-widest flex items-center gap-1.5 border-b border-[#efeee5]/60 pb-2">
                <TrendingUp size={12} className="text-[#4a5d4e]" /> Category Distribution Breakdown
              </span>

              {sortedCategories.length === 0 ? (
                <p className="text-xs italic text-[#7a7a72] text-center py-4">No categories recorded yet for this month</p>
              ) : (
                <div className="flex flex-col gap-3.5 pt-1">
                  {sortedCategories.map(([cat, val]) => {
                    const ratio = totalSum > 0 ? (val / totalSum) * 100 : 0;
                    return (
                      <div key={cat} className="flex flex-col gap-1">
                        <div className="flex justify-between items-center text-xs">
                          <span className="font-semibold text-[#2d2d2a]">{cat}</span>
                          <span className="font-bold font-mono tracking-tight text-[#2d2d2a]">
                            {currencySymbol}{val.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            <span className="text-[#a3a398] font-bold text-[9px] font-mono ml-1.5">({ratio.toFixed(1)}%)</span>
                          </span>
                        </div>
                        <div className="h-2 bg-[#f5f5f0] rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${ratio}%` }}
                            className={`h-full rounded-full ${isIncome ? 'bg-[#4a5d4e]' : 'bg-[#8b4513]'}`}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Detailed Transactions List */}
            <div className="flex flex-col gap-2 flex-1 min-h-[220px]">
              <div className="flex justify-between items-center">
                <label className="text-[9px] font-bold text-[#a3a398] uppercase tracking-widest">
                  Statement Ledger Lines ({currentMonthTx.length})
                </label>
              </div>

              <div className="bg-white rounded-2xl border border-[#efeee5] shadow-sm overflow-hidden flex-1 flex flex-col min-h-0">
                {/* Headers */}
                <div className="grid grid-cols-12 bg-[#fdfdfc] text-[8px] font-bold text-[#a3a398] uppercase border-b border-[#efeee5]/60 py-3 px-4 select-none tracking-widest text-left">
                  <span className="col-span-3">Date</span>
                  <span className="col-span-4">Category / Note</span>
                  <span className="col-span-2">Account</span>
                  <span className="col-span-3 text-right">Amount</span>
                </div>

                {/* Rows */}
                <div className="flex-1 overflow-y-auto divide-y divide-[#efeee5]/40 min-h-[160px]">
                  {currentMonthTx.length === 0 ? (
                    <div className="flex flex-col items-center justify-center p-12 text-[#a3a398] gap-2 h-full">
                      <FileText size={32} className="opacity-25" />
                      <p className="text-xs italic font-semibold">No entries present in the current month</p>
                    </div>
                  ) : (
                    currentMonthTx.slice().reverse().map((row) => {
                      const accObj = state.accounts.find(a => a.id === row.accountId);
                      return (
                        <div key={row.id} className="grid grid-cols-12 items-center py-3 px-4 text-left transition-all hover:bg-[#fafaf8]">
                          {/* Date */}
                          <span className="col-span-3 font-mono text-[10px] text-[#7a7a72] block">
                            {row.date}
                          </span>

                          {/* Description info */}
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

                          {/* Account */}
                          <span className="col-span-2 text-[10px] text-[#7a7a72] truncate font-medium">
                            {accObj?.name || 'Cash'}
                          </span>

                          {/* Amount */}
                          <span className={`col-span-3 font-mono text-xs font-bold text-right truncate block ${isIncome ? 'text-[#3d6356]' : 'text-[#8b4513]'}`}>
                            {isIncome ? '+' : '-'}{currencySymbol}{row.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Footer controls */}
          <div className="p-6 bg-white border-t border-[#efeee5] flex flex-col sm:flex-row gap-4 justify-between items-center">
            {/* Format choice picker */}
            <div className="flex items-center gap-3">
              <span className="text-[10px] font-bold text-[#a3a398] uppercase tracking-widest font-sans">Export Type:</span>
              <div className="inline-flex rounded-xl bg-[#f5f5f0] p-1 border border-[#efeee5]">
                <button
                  onClick={() => setExportType('pdf')}
                  className={`px-3 py-1.5 rounded-lg text-[9px] font-bold uppercase transition-all ${
                    exportType === 'pdf'
                      ? 'bg-white shadow-sm text-[#4a5d4e]'
                      : 'text-[#a3a398] hover:text-[#4a5d4e]'
                  }`}
                  id="iep-pdf"
                >
                  PDF
                </button>
                <button
                  onClick={() => setExportType('txt')}
                  className={`px-3 py-1.5 rounded-lg text-[9px] font-bold uppercase transition-all ${
                    exportType === 'txt'
                      ? 'bg-white shadow-sm text-[#4a5d4e]'
                      : 'text-[#a3a398] hover:text-[#4a5d4e]'
                  }`}
                  id="iep-txt"
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
                  id="iep-csv"
                >
                  CSV
                </button>
              </div>
            </div>

            {/* Trigger download button */}
            <Button
              variant="primary"
              onClick={executeDownload}
              className="py-3 px-6 text-xs tracking-wider uppercase font-bold w-full sm:w-auto"
              id="iep-download-btn"
            >
              <Download size={15} className="mr-2 inline" /> Download Statement
            </Button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
