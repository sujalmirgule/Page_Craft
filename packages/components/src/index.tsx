import React from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  className,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled,
  ...props
}) => {
  const base = 'inline-flex items-center justify-center font-medium rounded-lg transition-colors focus:outline-none select-none disabled:opacity-50 disabled:pointer-events-none';
  
  const variants = {
    primary: 'bg-cyan-600 hover:bg-cyan-500 text-white shadow-sm',
    secondary: 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700',
    outline: 'border border-cyan-700/60 text-cyan-400 hover:bg-cyan-950/40',
    ghost: 'hover:bg-slate-800/60 text-slate-300 hover:text-white',
    danger: 'bg-rose-600 hover:bg-rose-500 text-white shadow-sm',
  };

  const sizes = {
    sm: 'text-xs px-2.5 py-1',
    md: 'text-sm px-4 py-2',
    lg: 'text-base px-6 py-2.5',
  };

  return (
    <button
      className={cn(base, variants[variant], sizes[size], className)}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <span className="flex items-center gap-2">
          <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          <span>Loading...</span>
        </span>
      ) : children}
    </button>
  );
};

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'success' | 'warning' | 'info' | 'danger';
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  className,
  variant = 'default',
  ...props
}) => {
  const variants = {
    default: 'bg-slate-900 border-slate-800 text-slate-400',
    success: 'bg-emerald-950/80 border-emerald-800/60 text-emerald-400',
    warning: 'bg-amber-950/80 border-amber-800/60 text-amber-400',
    info: 'bg-cyan-950/80 border-cyan-800/60 text-cyan-400',
    danger: 'bg-rose-950/80 border-rose-800/60 text-rose-400',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center text-[10px] font-mono px-2 py-0.5 rounded border',
        variants[variant],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
};

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hoverEffect?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  className,
  hoverEffect = false,
  ...props
}) => {
  return (
    <div
      className={cn(
        'rounded-xl border border-slate-800 bg-[#0d1424] p-4 text-slate-200',
        hoverEffect && 'hover:border-slate-700 transition-colors',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};
