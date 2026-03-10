import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger';
  isLoading?: boolean;
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  isLoading = false,
  children,
  className = '',
  disabled,
  ...props
}) => {
  const baseStyles =
    'relative px-6 py-3 font-medium text-sm rounded-full transition-all duration-300 ease-out overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed';

  const variantStyles = {
    primary:
      'bg-gradient-to-br from-gray-900 to-black text-white shadow-md hover:shadow-md hover:shadow-gray-900/50 hover:scale-105 active:scale-95 before:absolute before:inset-0 before:bg-white before:opacity-0 before:transition-opacity before:duration-300 hover:before:opacity-20',
    secondary:
      'bg-gradient-to-br from-gray-100 to-gray-200 text-gray-800 shadow-md hover:shadow-xl hover:shadow-gray-300/50 hover:scale-105 active:scale-95 border border-gray-300 before:absolute before:inset-0 before:bg-black before:opacity-0 before:transition-opacity before:duration-300 hover:before:opacity-5',
    danger:
      'bg-gradient-to-br from-red-500 to-red-700 text-white shadow-md hover:shadow-xl hover:shadow-red-500/50 hover:scale-105 active:scale-95 before:absolute before:inset-0 before:bg-white before:opacity-0 before:transition-opacity before:duration-300 hover:before:opacity-20',
  };

  return (
    <button
      className={`${baseStyles} ${variantStyles[variant]} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      <span className="relative z-10 inline-flex items-center justify-center gap-2">
        {isLoading ? (
          <>
            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
                fill="none"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            Loading...
          </>
        ) : (
          children
        )}
      </span>
    </button>
  );
};
