/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Bell, UtensilsCrossed, ShoppingBag, Car, Home, Sparkles, TrendingUp } from 'lucide-react';
import { useWealth } from '../WealthContext';
import { Card, Button } from '../components/UI';
import { useState, useEffect } from 'react';
import { generateWealthInsights } from '../utils/aiUtils';
import { motion } from 'motion/react';

const ICON_MAP: Record<string, any> = {
  utensils: UtensilsCrossed,
  shopping: ShoppingBag,
  car: Car,
  home: Home
};

export default function Insights() {
  const { state } = useWealth();
  const [insights, setInsights] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const now = new Date();
  const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
  const weekExpenses = state.transactions
    .filter(t => t.type === 'expense' && new Date(t.date) >= startOfWeek)
    .reduce((acc, curr) => acc + curr.amount, 0);

  useEffect(() => {
    async function load() {
      const data = await generateWealthInsights(state);
      setInsights(data);
      setLoading(false);
    }
    load();
  }, [state]);

  return (
    <div className="flex flex-col gap-8 pb-24 animate-in slide-in-from-bottom duration-500">
      {/* Header */}
      <h1 className="text-3xl font-serif italic text-[#4a5d4e] font-bold tracking-tight">Wealth Insights</h1>

      {/* Weekly Summary */}
      <div className="bg-[#4a5d4e] rounded-[32px] p-8 text-white relative shadow-md">
        <span className="text-[10px] font-bold opacity-80 uppercase tracking-[0.2em] mb-4 block">Weekly Summary</span>
        <div className="text-3xl font-serif italic leading-none mb-3 tracking-tight">
          Spent {state.currency?.symbol ?? '$'}{weekExpenses.toLocaleString(undefined, { minimumFractionDigits: 2 })}
        </div>
        <p className="text-white/75 text-xs font-medium tracking-tight">
          Against your weekly goal of <span className="font-mono font-bold text-amber-100">{state.currency?.symbol ?? '$'}{state.weeklyGoal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
        </p>
      </div>

      {/* Recent Discoveries */}
      <section className="flex flex-col gap-6">
        <h2 className="text-xs font-bold uppercase tracking-widest text-[#a3a398]">Recent Discoveries</h2>
        <div className="flex flex-col gap-4">
          <div className="bg-[#efeee5] p-6 rounded-[32px] flex flex-col gap-5">
            {loading ? (
              <div className="space-y-4">
                {[1, 2].map(i => (
                  <div key={i} className="h-20 bg-white/50 rounded-2xl animate-pulse" />
                ))}
              </div>
            ) : (
              insights.map((insight) => (
                <div key={insight.id} className="p-4 bg-white/50 rounded-2xl border border-white/50 shadow-sm text-xs leading-relaxed text-[#2d2d2a]">
                  <p className="text-[10px] font-serif italic text-[#4a5d4e] mb-1 uppercase tracking-widest font-bold">
                    {insight.type === 'positive' ? 'Smart Tip' : 'Observation'}
                  </p>
                  {insight.description}
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      {/* Tip of the Week */}
      <Card className="bg-[#4a5d4e] text-white p-8 relative overflow-hidden border-none shadow-md">
        <div className="flex items-center gap-2 bg-white/10 w-fit px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest mb-6">
          <Sparkles size={12} />
          Rule of Thumb
        </div>
        <h3 className="text-2xl font-serif italic leading-tight mb-4">Master the 48-Hour Rule</h3>
        <p className="text-white/70 text-xs leading-relaxed mb-8">
          Wait 48 hours before any non-essential purchase. Often, the "need" fades, leaving you with more clarity and a healthier balance.
        </p>
        <Button variant="primary" className="bg-white text-[#4a5d4e] hover:bg-[#efeee5] font-bold text-[10px] tracking-widest">
          Read Guide
        </Button>
      </Card>

      {/* Spending Flow */}
      <section className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-widest text-[#a3a398]">Month Snapshot</h2>
          <div className="flex items-center gap-2 bg-[#efeee5] p-1 rounded-full scale-90">
            <button className="px-3 py-1 rounded-full bg-white text-[#4a5d4e] text-[9px] font-bold uppercase">Week</button>
            <button className="px-3 py-1 rounded-full text-[#a3a398] text-[9px] font-bold uppercase">Month</button>
          </div>
        </div>
        <Card className="bg-white border-none shadow-sm flex flex-col gap-6">
          <div className="flex items-end gap-2 h-24 px-2">
            {[0.3, 0.5, 0.7, 0.4, 0.6, 1, 0.8].map((val, i) => (
              <motion.div 
                key={i}
                initial={{ height: 0 }}
                animate={{ height: `${val * 100}%` }}
                className={`flex-1 rounded-t-md ${i === 5 ? 'bg-[#4a5d4e]' : 'bg-[#efeee5]'}`}
              />
            ))}
          </div>
          <p className="text-[9px] text-center text-[#a3a398] uppercase tracking-widest font-bold">Last 7 Days Activity</p>
        </Card>
      </section>
    </div>
  );
}
