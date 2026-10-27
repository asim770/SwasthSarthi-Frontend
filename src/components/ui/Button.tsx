import React from "react";
import { Loader2 } from "lucide-react";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = "primary",
  size = "md",
  isLoading = false,
  leftIcon,
  rightIcon,
  className = "",
  disabled,
  ...props
}) => {
  const baseStyles =
    "inline-flex items-center justify-center font-medium transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-[#008080] focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed select-none rounded-[12px] cursor-pointer";

  const sizeStyles = {
    sm: "text-xs px-2.5 py-1.5 gap-1.5",
    md: "text-sm px-3.5 py-2 gap-2",
    lg: "text-base px-4 py-2.5 gap-2.5",
  };

  const variantStyles = {
    primary: "bg-[#008080] text-white hover:bg-[#006666] active:bg-[#004c4c] shadow-xs",
    secondary: "bg-white text-[#008080] border border-[#d7eaea] hover:bg-[#f0fdfa] hover:border-[#b2d8d8] shadow-xs",
    outline: "bg-transparent text-[#008080] border border-[#b2d8d8] hover:bg-[#f0fdfa]",
    ghost: "bg-transparent text-[#475569] hover:bg-[#f0fdfa] hover:text-[#008080]",
    danger: "bg-rose-600 text-white hover:bg-rose-700 active:bg-rose-800 shadow-xs",
  };

  return (
    <button
      className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <Loader2 className="w-4 h-4 animate-spin text-current" />
      ) : (
        leftIcon && <span className="inline-flex shrink-0">{leftIcon}</span>
      )}
      <span>{children}</span>
      {!isLoading && rightIcon && <span className="inline-flex shrink-0">{rightIcon}</span>}
    </button>
  );
};
