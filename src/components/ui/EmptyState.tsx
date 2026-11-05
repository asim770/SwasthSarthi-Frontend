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
    <div className={`flex flex-col items-center justify-center p-10 sm:p-14 text-center bg-white rounded-none border border-[#EAE4D9] shadow-[0_4px_20px_rgba(26,25,24,0.03)] ${className}`}>
      <div className="w-12 h-12 rounded-none bg-[#FAF7F2] flex items-center justify-center text-[#57477D] mb-3.5 border border-[#EAE4D9]">
        {icon || <FolderOpen className="w-5 h-5 text-[#57477D]" />}
      </div>
      <h4 className="text-base font-editorial-serif font-bold text-[#191817] mb-1.5">{title}</h4>
      <p className="text-xs text-[#5C574F] max-w-md mb-4 leading-relaxed">{description}</p>
      {action && <div>{action}</div>}
    </div>
  );
};
