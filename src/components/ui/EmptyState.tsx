import React from "react";
import { FolderOpen } from "lucide-react";

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  action,
  className = "",
}) => {
  return (
    <div className={`flex flex-col items-center justify-center p-8 text-center bg-[#FAF7F2]/50 rounded-none border border-dashed border-[#D5CEC2] ${className}`}>
      <div className="w-12 h-12 rounded-none bg-white flex items-center justify-center text-[#57477D] mb-3 border border-[#EAE4D9]">
        {icon || <FolderOpen className="w-5 h-5 text-[#57477D]" />}
      </div>
      <h4 className="text-base font-editorial-serif font-bold text-[#1A1918] mb-1">{title}</h4>
      <p className="text-xs text-[#69655E] max-w-sm mb-4 leading-relaxed">{description}</p>
      {action && <div>{action}</div>}
    </div>
  );
};
