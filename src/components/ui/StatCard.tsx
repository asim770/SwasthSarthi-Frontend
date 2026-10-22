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
    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs hover:border-slate-300 transition-colors">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
          {title}
        </span>
        <div className="w-9 h-9 rounded-lg bg-teal-50 border border-teal-100 flex items-center justify-center text-teal-700">
          {icon}
        </div>
      </div>
      <div className="flex items-baseline gap-2 mb-1">
        <span className="text-2xl font-bold text-slate-900 tracking-tight">{value}</span>
        {badge}
      </div>
      <div className="flex items-center justify-between text-xs text-slate-500">
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
