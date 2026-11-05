import React from "react";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  helperText?: string;
  error?: string;
  leftIcon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, helperText, error, leftIcon, className = "", id, ...props }, ref) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={inputId} className="block text-xs font-semibold text-[#172033] mb-1.5">
            {label}
          </label>
        )}
        <div className="relative rounded-none shadow-2xs">
          {leftIcon && (
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#7A746B]">
              {leftIcon}
            </div>
          )}
          <input
            id={inputId}
            ref={ref}
            className={`w-full rounded-none border text-sm text-[#191817] placeholder:text-[#9B958B] bg-[#F0F7F6] transition-colors focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#1A1918] focus:border-[#1A1918] disabled:bg-[#E4F1EE] disabled:text-[#9B958B] disabled:cursor-not-allowed ${leftIcon ? "pl-9.5 pr-3.5" : "px-3.5"
              } py-2 ${error
                ? "border-red-400 focus:ring-red-600 focus:border-red-600"
                : "border-[#B6D6D0]"
              } ${className}`}
            {...props}
          />
        </div>
        {error ? (
          <p className="mt-1 text-xs text-red-600">{error}</p>
        ) : helperText ? (
          <p className="mt-1 text-xs text-[#64748b]">{helperText}</p>
        ) : null}
      </div>
    );
  }
);

Input.displayName = "Input";
