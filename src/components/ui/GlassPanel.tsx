import React from "react";
import { GlassSurface } from "./GlassSurface";

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
    <GlassSurface
      borderRadius={20}
      backgroundOpacity={0.78}
      blur={8}
      saturation={1.3}
      renderer="css"
      innerClassName="p-0"
      className={`w-full box-border ${interactive ? "cursor-pointer hover:bg-white/90 hover:shadow-md transition-all duration-150" : ""} ${className}`}
      {...props}
    >
      <div className="w-full h-full text-[var(--text-primary,#172033)] p-3 sm:p-4">
        {children}
      </div>
    </GlassSurface>
  );
};

export default GlassPanel;
