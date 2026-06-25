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
  const baseStyle = 'inline-block text-[8px] font-black uppercase font-mono px-2 py-0.5 rounded-full border';
  
  let computedStyle = '';

  if (variant === 'severity') {
    const val = (value || children || '').toString().trim().toLowerCase();
    if (val === 'critical') {
      computedStyle = 'bg-red-50 text-red-600 border-red-100';
    } else if (val === 'high') {
      computedStyle = 'bg-amber-50 text-amber-600 border-amber-100';
    } else {
      computedStyle = 'bg-blue-50 text-blue-600 border-blue-100';
    }
  } else if (variant === 'status') {
    const val = (value || children || '').toString().trim().toLowerCase();
    if (val === 'resolved' || val === 'active') {
      computedStyle = 'bg-emerald-50 text-emerald-700 border-emerald-100';
    } else if (val === 'verified') {
      computedStyle = 'bg-teal-50 text-teal-700 border-teal-100';
    } else if (val === 'in progress') {
      computedStyle = 'bg-indigo-50 text-indigo-700 border-indigo-100';
    } else {
      // Reported or others
      computedStyle = 'bg-slate-100 text-slate-600 border-slate-200';
    }
  } else if (variant === 'category') {
    computedStyle = 'bg-slate-100 text-slate-600 border-slate-150';
  } else {
    // Custom color classes
    computedStyle = colorClass || 'bg-slate-50 text-slate-600 border-slate-200';
  }

  return (
    <span className={`${baseStyle} ${computedStyle} ${className}`}>
      {children}
    </span>
  );
};

export default Badge;
