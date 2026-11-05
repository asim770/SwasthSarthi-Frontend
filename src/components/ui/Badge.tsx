import React from "react";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "success" | "warning" | "info" | "neutral" | "danger" | "teal" | "purple" | "royal";
  size?: "sm" | "md";
  dot?: boolean;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = "neutral",
  size = "md",
  dot = false,
  className = "",
  ...props
}) => {
  const baseStyles =
    "inline-flex items-center font-medium rounded-none border transition-colors select-none";

  const sizeStyles = {
    sm: "text-xs px-2 py-0.5 gap-1",
    md: "text-xs px-2.5 py-1 gap-1.5",
  };

  const variantStyles = {
    success: "bg-emerald-50 text-emerald-800 border-emerald-200",
    warning: "bg-amber-50 text-amber-800 border-amber-200",
    info: "bg-[#F0F7F6] text-[#0F766E] border-[#0F766E]/25 font-mono",
    neutral: "bg-[#F0F7F6] text-[#5C574F] border-[#D0E5E1]",
    danger: "bg-red-50 text-red-700 border-red-200",
    teal: "bg-[#0F766E]/10 text-[#0F766E] border-[#0F766E]/30",
    purple: "bg-[#0F766E]/10 text-[#0F766E] border-[#0F766E]/30",
    royal: "bg-[#0F766E]/10 text-[#0F766E] border-[#0F766E]/30",
  };

  const dotStyles = {
    success: "bg-emerald-600",
    warning: "bg-amber-600",
    info: "bg-[#0F766E]",
    neutral: "bg-[#7A746B]",
    danger: "bg-red-600",
    teal: "bg-[#0F766E]",
    purple: "bg-[#0F766E]",
    royal: "bg-[#0F766E]",
  };

  return (
    <span
      className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
      {...props}
    >
      {dot && <span className={`w-1.5 h-1.5 rounded-full ${dotStyles[variant]}`} />}
      {children}
    </span>
  );
};
