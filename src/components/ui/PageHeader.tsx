import React from "react";

export interface PageHeaderProps {
  title: string;
  description?: string;
  breadcrumb?: string;
  badge?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  description,
  breadcrumb,
  badge,
  actions,
  className = "",
}) => {
  return (
    <div className={`flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-5 border-b border-[#EAE4D9] mb-6 ${className}`}>
      <div>
        {breadcrumb && (
          <p className="text-[11px] font-mono font-bold text-[#57477D] mb-1 tracking-wider uppercase">
            {breadcrumb}
          </p>
        )}
        <div className="flex items-center gap-2.5 flex-wrap">
          <h1 className="text-2xl md:text-3xl font-editorial-serif font-bold text-[#191817] tracking-tight">
            {title}
          </h1>
          {badge}
        </div>
        {description && (
          <p className="text-xs md:text-sm text-[#5C574F] mt-1 max-w-2xl leading-relaxed">
            {description}
          </p>
        )}
      </div>

      {actions && (
        <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
          {actions}
        </div>
      )}
    </div>
  );
};
