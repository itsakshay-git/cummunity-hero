/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'severity' | 'status' | 'category' | 'color';
  value?: string;
  colorClass?: string; // Optional custom overrides
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'color',
  value,
  colorClass = '',
  className = ''
}) => {
  const baseStyle = 'inline-flex items-center gap-1.5 text-[8px] font-bold font-mono tracking-wider uppercase px-2 py-0.5 rounded-md border';
  
  let computedStyle = '';
  let dotColor = '';

  if (variant === 'severity') {
    const val = (value || children || '').toString().trim().toLowerCase();
    if (val === 'critical') {
      computedStyle = 'bg-rose-50/50 text-rose-600 border-rose-200/50';
      dotColor = 'bg-rose-500';
    } else if (val === 'high') {
      computedStyle = 'bg-amber-50/50 text-amber-600 border-amber-200/50';
      dotColor = 'bg-amber-500';
    } else {
      computedStyle = 'bg-blue-50/50 text-blue-600 border-blue-200/50';
      dotColor = 'bg-blue-500';
    }
  } else if (variant === 'status') {
    const val = (value || children || '').toString().trim().toLowerCase();
    const cleanVal = val.replace(/_/g, ' ');
    if (cleanVal === 'resolved') {
      computedStyle = 'bg-emerald-50/50 text-emerald-700 border-emerald-200/50';
      dotColor = 'bg-emerald-500';
    } else if (cleanVal === 'verified' || cleanVal === 'community verified') {
      computedStyle = 'bg-teal-50/50 text-teal-700 border-teal-200/50';
      dotColor = 'bg-teal-500';
    } else if (cleanVal === 'in progress') {
      computedStyle = 'bg-indigo-50/50 text-indigo-700 border-indigo-200/50';
      dotColor = 'bg-indigo-500';
    } else {
      computedStyle = 'bg-slate-50 text-slate-500 border-slate-200/80';
      dotColor = 'bg-slate-400';
    }
  } else if (variant === 'category') {
    computedStyle = 'bg-slate-50 text-slate-500 border-slate-200/80';
  } else {
    // Custom color classes
    computedStyle = colorClass || 'bg-slate-50 text-slate-500 border-slate-200/80';
  }

  return (
    <span className={`${baseStyle} ${computedStyle} ${className}`}>
      {dotColor && <span className={`w-1 h-1 rounded-full ${dotColor}`} />}
      {children}
    </span>
  );
};

export default Badge;
