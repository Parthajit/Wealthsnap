/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { WealthProvider } from './WealthContext';
import Sanctuary from './pages/Sanctuary';
import Flow from './pages/Flow';
import Reports from './pages/Reports';
import Insights from './pages/Insights';
import Vault from './pages/Vault';
import BottomNav from './components/BottomNav';
import AddAccountModal from './components/AddAccountModal';
import AddTransactionModal from './components/AddTransactionModal';
import { Transaction } from './types';

function AppContent() {
  const [activeTab, setActiveTab] = useState('sanctuary');
  const [isAddAccountOpen, setIsAddAccountOpen] = useState(false);
  const [isAddTransactionOpen, setIsAddTransactionOpen] = useState(false);
  const [transactionToEdit, setTransactionToEdit] = useState<Transaction | null>(null);

  const handleEditTransaction = (tx: Transaction) => {
    setTransactionToEdit(tx);
    setIsAddTransactionOpen(true);
  };

  const handleCloseTransactionModal = () => {
    setIsAddTransactionOpen(false);
    setTransactionToEdit(null);
  };

  const renderPage = () => {
    switch (activeTab) {
      case 'sanctuary':
        return <Sanctuary 
                 onAddTransaction={() => { setTransactionToEdit(null); setIsAddTransactionOpen(true); }} 
                 onAddAccount={() => setIsAddAccountOpen(true)} 
                 onEditTransaction={handleEditTransaction}
               />;
      case 'flow':
        return <Flow 
                 onAddTransaction={() => { setTransactionToEdit(null); setIsAddTransactionOpen(true); }} 
                 onAddAccount={() => setIsAddAccountOpen(true)}
                 onEditTransaction={handleEditTransaction}
               />;
      case 'reports':
        return <Reports onEditTransaction={handleEditTransaction} />;
      case 'insights':
        return <Insights />;
      case 'vault':
        return <Vault onAddAccount={() => setIsAddAccountOpen(true)} />;
      default:
        return <Sanctuary 
                 onAddTransaction={() => { setTransactionToEdit(null); setIsAddTransactionOpen(true); }} 
                 onAddAccount={() => setIsAddAccountOpen(true)} 
                 onEditTransaction={handleEditTransaction}
               />;
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-[#2D5A4C] font-sans selection:bg-[#BCEAD5] selection:text-[#2D5A4C]">
      <main className="max-w-md mx-auto px-6 pt-12 pb-32">
        {renderPage()}
      </main>

      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />

      <AddAccountModal 
        isOpen={isAddAccountOpen} 
        onClose={() => setIsAddAccountOpen(false)} 
      />
      
      <AddTransactionModal 
        isOpen={isAddTransactionOpen} 
        onClose={handleCloseTransactionModal} 
        transactionToEdit={transactionToEdit}
      />
    </div>
  );
}

export default function App() {
  return (
    <WealthProvider>
      <AppContent />
    </WealthProvider>
  );
}
