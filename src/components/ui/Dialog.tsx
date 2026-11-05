import React, { useEffect } from "react";
import { X } from "lucide-react";

export interface DialogProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  maxWidth?: "sm" | "md" | "lg" | "xl";
}

export const Dialog: React.FC<DialogProps> = ({
  isOpen,
  onClose,
  title,
  description,
  children,
  footer,
  maxWidth = "md",
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    if (isOpen) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const maxWidthStyles = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-lg",
    xl: "max-w-2xl",
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Card */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="dialog-title"
        className={`relative w-full ${maxWidthStyles[maxWidth]} bg-white rounded-none shadow-[0_16px_48px_rgba(26,25,24,0.14)] border border-[#D0E5E1] z-10 overflow-hidden transform transition-all`}
      >
        {/* Header */}
        <div className="flex items-start justify-between p-5 pb-4 border-b border-[#D0E5E1]">
          <div>
            <h2 id="dialog-title" className="text-base font-editorial-serif font-bold text-[#191817]">
              {title}
            </h2>
            {description && (
              <p className="text-xs text-[#5C574F] mt-1 leading-relaxed">
                {description}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            aria-label="Close dialog"
            className="text-[#7A746B] hover:text-[#191817] rounded-none p-1 hover:bg-[#F0F7F6] transition-colors cursor-pointer border border-transparent hover:border-[#D0E5E1]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body Content */}
        <div className="p-5 max-h-[70vh] overflow-y-auto text-sm text-[#5C574F]">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="p-4 bg-[#F0F7F6] border-t border-[#D0E5E1] flex items-center justify-end gap-2.5">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};
