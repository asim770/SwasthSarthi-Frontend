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
    <div className={`flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-6 border-b border-[#d7eaea] mb-6 ${className}`}>
      <div>
        {breadcrumb && (
          <p className="text-xs font-semibold text-[#008080] mb-1 tracking-wide uppercase">
            {breadcrumb}
          </p>
        )}
        <div className="flex items-center gap-2.5 flex-wrap">
          <h1 className="text-xl md:text-2xl font-bold text-[#172033] tracking-tight">
            {title}
          </h1>
          {badge}
        </div>
        {description && (
          <p className="text-xs md:text-sm text-[#475569] mt-1 max-w-2xl leading-relaxed">
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
