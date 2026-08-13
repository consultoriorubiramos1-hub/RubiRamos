import clsx from 'clsx';
import { ReactNode } from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
}

export function Button({
  children,
  className,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled,
  ...rest
}: ButtonProps) {
  const baseClasses = clsx(
    'font-medium rounded-lg transition-colors duration-200 flex items-center justify-center gap-2',
    'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#6B8E7B]',
    'disabled:opacity-60 disabled:cursor-not-allowed',
    {
      'px-4 py-2 text-sm': size === 'sm',
      'px-6 py-3 text-base': size === 'md',
      'px-8 py-4 text-lg': size === 'lg',
      
      'bg-[#BD7D4A] text-white hover:bg-[#F58634] shadow-sm': variant === 'primary',
      'bg-[#6B8E7B] text-white hover:bg-[#4A7C6A] shadow-sm': variant === 'secondary',
      'bg-transparent border border-[#6B8E7B] text-[#6B8E7B] hover:bg-[#FAF9F7]': variant === 'outline',
      'bg-transparent text-[#6B8E7B] hover:bg-[#FAF9F7]': variant === 'ghost',
    },
    className
  );

  return (
    <button
      {...rest}
      className={baseClasses}
      disabled={disabled || loading}
    >
      {loading && (
        <svg 
          className="animate-spin h-5 w-5" 
          xmlns="http://www.w3.org/2000/svg" 
          fill="none" 
          viewBox="0 0 24 24"
        >
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      )}
      {children}
    </button>
  );
}