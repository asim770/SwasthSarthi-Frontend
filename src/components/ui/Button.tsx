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
    "inline-flex items-center justify-center font-medium transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-[#1A1918] focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed select-none rounded-none cursor-pointer";

  const sizeStyles = {
    sm: "text-xs px-2.5 py-1.5 gap-1.5",
    md: "text-sm px-3.5 py-2 gap-2",
    lg: "text-base px-4 py-2.5 gap-2.5",
  };

  const variantStyles = {
    primary: "bg-[#1A1918] text-white hover:bg-[#2E2C2A] active:bg-[#121110] shadow-2xs border border-[#1A1918]",
    secondary: "bg-white text-[#191817] border border-[#B6D6D0] hover:bg-[#F0F7F6] hover:border-[#1A1918] shadow-2xs",
    outline: "bg-transparent text-[#191817] border border-[#B6D6D0] hover:bg-[#F0F7F6] hover:border-[#1A1918]",
    ghost: "bg-transparent text-[#5C574F] hover:bg-[#F0F7F6] hover:text-[#191817]",
    danger: "bg-[#991B1B] text-white hover:bg-[#7F1D1D] active:bg-[#681717] shadow-2xs border border-[#991B1B]",
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
