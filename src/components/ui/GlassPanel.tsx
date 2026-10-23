import React from "react";

export interface GlassPanelProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  interactive?: boolean;
}

export const GlassPanel: React.FC<GlassPanelProps> = ({
  children,
  className = "",
  interactive = false,
  ...props
}) => {
  return (
    <div
      className={`rounded-2xl ${
        interactive ? "glass-panel-interactive cursor-pointer" : "glass-panel"
      } ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};
