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
      borderRadius={18}
      backgroundOpacity={0.78}
      blur={8}
      saturation={1.3}
      renderer="css"
      innerClassName="p-0"
      className={`w-full box-border border border-[#d7eaea] shadow-[0_6px_24px_rgba(15,23,42,0.05)] ${
        interactive
          ? "cursor-pointer hover:bg-white/95 hover:border-[#b2d8d8] hover:shadow-[0_8px_30px_rgba(0,128,128,0.06)] transition-all duration-150"
          : ""
      } ${className}`}
      {...props}
    >
      <div className="w-full h-full text-[var(--text-primary,#172033)] p-3 sm:p-4">
        {children}
      </div>
    </GlassSurface>
  );
};

export default GlassPanel;
