import React from "react";

export interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  badge?: React.ReactNode;
  trend?: {
    value: string;
    isPositive?: boolean;
  };
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  badge,
  trend,
}) => {
  return (
    <div className="bg-white border border-[#d7eaea] rounded-[18px] p-5 shadow-[0_6px_24px_rgba(15,23,42,0.05)] hover:border-[#b2d8d8] transition-all">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold text-[#64748b] uppercase tracking-wider">
          {title}
        </span>
        <div className="w-9 h-9 rounded-xl bg-[#f0fdfa] border border-[#d7eaea] flex items-center justify-center text-[#008080]">
          {icon}
        </div>
      </div>
      <div className="flex items-baseline gap-2 mb-1">
        <span className="text-2xl font-bold text-[#172033] tracking-tight">{value}</span>
        {badge}
      </div>
      <div className="flex items-center justify-between text-xs text-[#64748b]">
        {subtitle && <span>{subtitle}</span>}
        {trend && (
          <span
            className={`font-medium ${
              trend.isPositive ? "text-emerald-600" : "text-amber-600"
            }`}
          >
            {trend.value}
          </span>
        )}
      </div>
    </div>
  );
};
