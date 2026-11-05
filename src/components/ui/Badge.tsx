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
    info: "bg-[#FAF7F2] text-[#57477D] border-[#57477D]/25 font-mono",
    neutral: "bg-[#FAF7F2] text-[#5C574F] border-[#EAE4D9]",
    danger: "bg-red-50 text-red-700 border-red-200",
    teal: "bg-[#57477D]/10 text-[#57477D] border-[#57477D]/30",
    purple: "bg-[#57477D]/10 text-[#57477D] border-[#57477D]/30",
    royal: "bg-[#57477D]/10 text-[#57477D] border-[#57477D]/30",
  };

  const dotStyles = {
    success: "bg-emerald-600",
    warning: "bg-amber-600",
    info: "bg-[#57477D]",
    neutral: "bg-[#7A746B]",
    danger: "bg-red-600",
    teal: "bg-[#57477D]",
    purple: "bg-[#57477D]",
    royal: "bg-[#57477D]",
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
