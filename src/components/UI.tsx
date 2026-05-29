/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'dark';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  children?: React.ReactNode;
  className?: string;
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
  disabled?: boolean;
  id?: string;
  type?: 'button' | 'submit' | 'reset';
}

export function Button({ 
  variant = 'primary', 
  size = 'md', 
  className = '', 
  children, 
  ...props 
}: ButtonProps) {
  const baseStyles = 'inline-flex items-center justify-center rounded-2xl font-semibold transition-all active:scale-95 disabled:opacity-50';
  
  const variants = {
    primary: 'bg-[#4a5d4e] text-white hover:bg-[#3d4d40]',
    secondary: 'bg-[#efeee5] text-[#4a5d4e] hover:bg-[#e5e4d9]',
    outline: 'border border-[#d1d1ca] text-[#7a7a72] hover:bg-[#fafaf8]',
    ghost: 'text-[#7a7a72] hover:bg-[#efeee5]',
    dark: 'bg-[#2d2d2a] text-white hover:bg-black',
  };

  const sizes = {
    sm: 'px-4 py-2 text-xs uppercase tracking-widest font-bold',
    md: 'px-6 py-3 text-sm font-semibold',
    lg: 'px-8 py-4 text-base w-full font-bold uppercase tracking-widest',
    icon: 'p-3',
  };

  return (
    <button 
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`} 
      {...props}
    >
      {children}
    </button>
  );
}

export function Card({ className = '', children, ...props }: { className?: string, children: React.ReactNode } & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={`bg-white rounded-[32px] p-6 shadow-sm border border-[#efeee5] ${className}`} {...props}>
      {children}
    </div>
  );
}
