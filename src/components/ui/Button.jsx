import React from 'react';

export const Button = ({ children, variant = 'primary', className = '', ...props }) => {
  const baseStyles = "inline-flex items-center justify-center font-medium transition-colors rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-background disabled:opacity-50 disabled:pointer-events-none";
  
  const variants = {
    primary: "bg-primary text-white hover:bg-blue-700 shadow-soft focus:ring-primary",
    secondary: "bg-card text-white hover:bg-slate-700 border border-slate-700 focus:ring-slate-500",
    accent: "bg-accent text-white hover:bg-teal-600 shadow-soft focus:ring-accent",
    ghost: "bg-transparent text-gray-300 hover:bg-slate-800 hover:text-white"
  };

  const sizes = {
    sm: "h-9 px-4 text-sm",
    md: "h-11 px-6 text-base",
    lg: "h-14 px-8 text-lg"
  };

  const sizeClass = sizes[props.size] || sizes.md;

  return (
    <button 
      className={`${baseStyles} ${variants[variant]} ${sizeClass} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};
