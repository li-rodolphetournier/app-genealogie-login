import React from 'react';

type ButtonProps = {
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
  className?: string;
  children: React.ReactNode;
};

export default function Button({ onClick, type = 'button', className = '', children }: ButtonProps) {
  return (
    <button
      onClick={onClick}
      type={type}
      className={`w-full py-2 px-4 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 ${className}`}
    >
      {children}
    </button>
  );
}
