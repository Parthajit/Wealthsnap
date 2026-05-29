/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Home, ArrowLeftRight, PieChart, ShieldCheck, FileText, Sparkles } from 'lucide-react';
import { motion } from 'motion/react';

interface BottomNavProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export default function BottomNav({ activeTab, onTabChange }: BottomNavProps) {
  const tabs = [
    { id: 'sanctuary', label: 'SANCTUARY', icon: Home },
    { id: 'flow', label: 'FLOW', icon: ArrowLeftRight },
    { id: 'reports', label: 'REPORTS', icon: FileText },
    { id: 'insights', label: 'INSIGHTS', icon: Sparkles },
    { id: 'vault', label: 'VAULT', icon: ShieldCheck },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-[#efeee5] px-4 py-2 pb-8 z-50">
      <div className="flex justify-around items-center max-w-md mx-auto">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;
          
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className="flex flex-col items-center gap-1.5 relative group"
              id={`tab-${tab.id}`}
            >
              <div 
                className={`p-2 transition-all duration-300 ${
                  isActive ? 'text-[#4a5d4e]' : 'text-[#a3a398]'
                }`}
              >
                <Icon size={24} strokeWidth={isActive ? 2.5 : 2} />
              </div>
              <span 
                className={`text-[9px] font-bold tracking-[0.15em] transition-colors ${
                  isActive ? 'text-[#4a5d4e]' : 'text-[#a3a398]'
                }`}
              >
                {tab.label}
              </span>
              {isActive && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute -top-1 w-1 h-1 bg-[#4a5d4e] rounded-full"
                />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
