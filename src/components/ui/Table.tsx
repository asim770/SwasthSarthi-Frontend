import React from "react";

export const Table: React.FC<React.TableHTMLAttributes<HTMLTableElement>> = ({
  children,
  className = "",
  ...props
}) => {
  return (
    <div className="w-full overflow-x-auto">
      <table className={`w-full text-left text-sm text-[#1A1918] border-collapse ${className}`} {...props}>
        {children}
      </table>
    </div>
  );
};

export const TableHeader: React.FC<React.HTMLAttributes<HTMLTableSectionElement>> = ({
  children,
  className = "",
  ...props
}) => {
  return (
    <thead className={`bg-[#FAF7F2] border-b border-[#EAE4D9] text-[11px] font-mono font-medium text-[#69655E] uppercase tracking-wider ${className}`} {...props}>
      {children}
    </thead>
  );
};

export const TableBody: React.FC<React.HTMLAttributes<HTMLTableSectionElement>> = ({
  children,
  className = "",
  ...props
}) => {
  return <tbody className={`divide-y divide-[#EAE4D9] bg-white ${className}`} {...props}>{children}</tbody>;
};

export const TableRow: React.FC<React.HTMLAttributes<HTMLTableRowElement>> = ({
  children,
  className = "",
  ...props
}) => {
  return (
    <tr
      className={`hover:bg-[#FAF7F2]/80 transition-colors border-b border-[#EAE4D9] ${className}`}
      {...props}
    >
      {children}
    </tr>
  );
};

export const TableHead: React.FC<React.ThHTMLAttributes<HTMLTableCellElement>> = ({
  children,
  className = "",
  ...props
}) => {
  return (
    <th className={`px-4 py-3 text-left font-mono text-[11px] uppercase tracking-wider text-[#69655E] ${className}`} {...props}>
      {children}
    </th>
  );
};

export const TableCell: React.FC<React.TdHTMLAttributes<HTMLTableCellElement>> = ({
  children,
  className = "",
  ...props
}) => {
  return (
    <td className={`px-4 py-3.5 align-middle text-[#1A1918] ${className}`} {...props}>
      {children}
    </td>
  );
};
