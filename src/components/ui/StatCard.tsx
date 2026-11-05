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
    <div className="bg-white border border-[#EAE4D9] rounded-none p-5 hover:border-[#D5CEC2] transition-colors">
      <div className="flex items-center justify-between mb-3">
        <span className="text-[11px] font-mono font-semibold text-[#69655E] uppercase tracking-wider">
          {title}
        </span>
        <div className="w-9 h-9 rounded-none bg-[#FAF7F2] border border-[#EAE4D9] flex items-center justify-center text-[#57477D]">
          {icon}
        </div>
      </div>
      <div className="flex items-baseline gap-2 mb-1">
        <span className="text-2xl font-editorial-serif font-bold text-[#1A1918] tracking-tight">{value}</span>
        {badge}
      </div>
      <div className="flex items-center justify-between text-xs text-[#69655E]">
        {subtitle && <span>{subtitle}</span>}
        {trend && (
          <span
            className={`font-mono text-xs font-medium ${
              trend.isPositive ? "text-emerald-700" : "text-amber-700"
            }`}
          >
            {trend.value}
          </span>
        )}
      </div>
    </div>
  );
};
