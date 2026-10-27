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
    <div className={`flex flex-col items-center justify-center p-8 text-center bg-white rounded-[18px] border border-dashed border-[#b2d8d8] ${className}`}>
      <div className="w-12 h-12 rounded-full bg-[#f0fdfa] flex items-center justify-center text-[#008080] mb-3 border border-[#d7eaea]">
        {icon || <FolderOpen className="w-5 h-5 text-[#008080]" />}
      </div>
      <h4 className="text-sm font-semibold text-[#172033] mb-1">{title}</h4>
      <p className="text-xs text-[#475569] max-w-sm mb-4 leading-relaxed">{description}</p>
      {action && <div>{action}</div>}
    </div>
  );
};
