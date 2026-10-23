/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useRef, useState, useId } from 'react';

const supportsSVGFiltersCheck = (filterId: string): boolean => {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return false;
  }

  const isWebkit = /Safari/.test(navigator.userAgent) && !/Chrome/.test(navigator.userAgent);
  const isFirefox = /Firefox/.test(navigator.userAgent);

  if (isWebkit || isFirefox) {
    return false;
  }

  const div = document.createElement('div');
  div.style.backdropFilter = `url(#${filterId})`;

  return div.style.backdropFilter !== '';
};

const supportsBackdropFilter = (): boolean => {
  if (typeof window === 'undefined') return false;
  return CSS.supports('backdrop-filter', 'blur(10px)');
};

export interface GlassSurfaceProps {
  children?: React.ReactNode;
  width?: number | string;
  height?: number | string;
  borderRadius?: number;
  borderWidth?: number;
  brightness?: number;
  opacity?: number;
  blur?: number;
  displace?: number;
  backgroundOpacity?: number;
  saturation?: number;
  distortionScale?: number;
  redOffset?: number;
  greenOffset?: number;
  blueOffset?: number;
  xChannel?: 'R' | 'G' | 'B' | 'A';
  yChannel?: 'R' | 'G' | 'B' | 'A';
  mixBlendMode?: string;
  refraction?: boolean | number;
  renderer?: 'svg' | 'css' | 'webgl' | 'auto';
  backdrop?: string | HTMLCanvasElement | HTMLImageElement | null;
  shape?: 'pill' | 'rect' | 'circle';
  overflow?: 'hidden' | 'visible';
  innerClassName?: string;
  className?: string;
  style?: React.CSSProperties;
}

export const GlassSurface: React.FC<GlassSurfaceProps> = ({
  children,
  width = '100%',
  height = 'auto',
  borderRadius = 20,
  borderWidth = 0.07,
  brightness = 96,
  opacity = 0.92,
  blur = 12,
  displace = 0,
  backgroundOpacity = 0.68,
  saturation = 1.4,
  distortionScale = -70,
  redOffset = 0,
  greenOffset = 8,
  blueOffset = 16,
  xChannel = 'R',
  yChannel = 'G',
  mixBlendMode = 'difference',
  refraction = false,
  renderer = 'auto',
  shape = 'rect',
  overflow = 'hidden',
  innerClassName = 'p-2',
  className = '',
  style = {},
}) => {
  const uniqueId = useId().replace(/:/g, '-');
  const filterId = `glass-filter-${uniqueId}`;
  const redGradId = `red-grad-${uniqueId}`;
  const blueGradId = `blue-grad-${uniqueId}`;

  const [svgSupported, setSvgSupported] = useState(false);

  // Determine if SVG displacement should be active for this surface
  const wantsSvg = renderer === 'svg' || (renderer === 'auto' && Boolean(refraction));
  const shouldUseSvg = wantsSvg && svgSupported;

  const containerRef = useRef<HTMLDivElement>(null);
  const feImageRef = useRef<SVGFEImageElement>(null);
  const redChannelRef = useRef<SVGFEDisplacementMapElement>(null);
  const greenChannelRef = useRef<SVGFEDisplacementMapElement>(null);
  const blueChannelRef = useRef<SVGFEDisplacementMapElement>(null);
  const gaussianBlurRef = useRef<SVGFEGaussianBlurElement>(null);

  useEffect(() => {
    if (wantsSvg) {
      setSvgSupported(supportsSVGFiltersCheck(filterId));
    }
  }, [filterId, wantsSvg]);

  const generateDisplacementMap = () => {
    const rect = containerRef.current?.getBoundingClientRect();
    const actualWidth = Math.max(10, Math.round(rect?.width || (typeof width === 'number' ? width : 400)));
    const actualHeight = Math.max(10, Math.round(rect?.height || (typeof height === 'number' ? height : 68)));
    const edgeSize = Math.max(1, Math.min(actualWidth, actualHeight) * (borderWidth * 0.5));
    const effectiveRadius = shape === 'pill' ? Math.round(Math.min(actualWidth, actualHeight) / 2) : borderRadius;

    const svgContent = `
      <svg viewBox="0 0 ${actualWidth} ${actualHeight}" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="${redGradId}" x1="100%" y1="0%" x2="0%" y2="0%">
            <stop offset="0%" stop-color="#0000"/>
            <stop offset="100%" stop-color="rgba(255,0,0,0.35)"/>
          </linearGradient>
          <linearGradient id="${blueGradId}" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stop-color="#0000"/>
            <stop offset="100%" stop-color="rgba(0,0,255,0.35)"/>
          </linearGradient>
        </defs>
        <rect x="0" y="0" width="${actualWidth}" height="${actualHeight}" fill="#ffffff" fill-opacity="0.05"></rect>
        <rect x="0" y="0" width="${actualWidth}" height="${actualHeight}" rx="${effectiveRadius}" fill="url(#${redGradId})" />
        <rect x="0" y="0" width="${actualWidth}" height="${actualHeight}" rx="${effectiveRadius}" fill="url(#${blueGradId})" style="mix-blend-mode: ${mixBlendMode}" />
        <rect x="${edgeSize}" y="${edgeSize}" width="${Math.max(1, actualWidth - edgeSize * 2)}" height="${Math.max(1, actualHeight - edgeSize * 2)}" rx="${effectiveRadius}" fill="hsl(210 25% ${brightness}% / ${opacity})" style="filter:blur(${blur}px)" />
      </svg>
    `;

    return `data:image/svg+xml,${encodeURIComponent(svgContent)}`;
  };

  const updateDisplacementMap = () => {
    if (!shouldUseSvg) return;
    if (feImageRef.current) {
      feImageRef.current.setAttribute('href', generateDisplacementMap());
    }
  };

  useEffect(() => {
    if (!shouldUseSvg) return;

    updateDisplacementMap();
    [
      { ref: redChannelRef, offset: redOffset },
      { ref: greenChannelRef, offset: greenOffset },
      { ref: blueChannelRef, offset: blueOffset },
    ].forEach(({ ref, offset }) => {
      if (ref.current) {
        ref.current.setAttribute('scale', (distortionScale + offset).toString());
        ref.current.setAttribute('xChannelSelector', xChannel);
        ref.current.setAttribute('yChannelSelector', yChannel);
      }
    });

    gaussianBlurRef.current?.setAttribute('stdDeviation', displace.toString());
  }, [
    shouldUseSvg,
    width,
    height,
    borderRadius,
    borderWidth,
    brightness,
    opacity,
    blur,
    displace,
    distortionScale,
    redOffset,
    greenOffset,
    blueOffset,
    xChannel,
    yChannel,
    mixBlendMode,
    shape,
  ]);

  // Clean ResizeObserver & Visibility handler only attached for active SVG surfaces
  useEffect(() => {
    if (!shouldUseSvg || !containerRef.current) return;

    let timeoutId: ReturnType<typeof setTimeout>;
    const handleResize = () => {
      if (typeof document !== 'undefined' && document.hidden) return;
      clearTimeout(timeoutId);
      timeoutId = setTimeout(updateDisplacementMap, 60);
    };

    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(containerRef.current);

    const handleVisibility = () => {
      if (!document.hidden) updateDisplacementMap();
    };
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      clearTimeout(timeoutId);
      resizeObserver.disconnect();
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [shouldUseSvg]);

  const getContainerStyles = (): React.CSSProperties => {
    const effectiveRadius = shape === 'pill' ? 9999 : borderRadius;
    const baseStyles: React.CSSProperties = {
      ...style,
      width: typeof width === 'number' ? `${width}px` : width,
      height: typeof height === 'number' ? `${height}px` : height,
      borderRadius: `${effectiveRadius}px`,
      boxSizing: 'border-box',
    };

    const backdropFilterSupported = supportsBackdropFilter();

    if (shouldUseSvg) {
      return {
        ...baseStyles,
        background: `rgba(255, 255, 255, ${backgroundOpacity})`,
        backdropFilter: `url(#${filterId}) saturate(${saturation})`,
        WebkitBackdropFilter: `url(#${filterId}) saturate(${saturation})`,
        border: '1px solid rgba(255, 255, 255, 0.78)',
        boxShadow: `
          0 6px 24px rgba(15, 23, 42, 0.06),
          0 1px 3px rgba(15, 23, 42, 0.03),
          inset 0 1px 1px 0 rgba(255, 255, 255, 0.9),
          0 0 0 1px rgba(226, 232, 240, 0.35)
        `,
      };
    } else if (backdropFilterSupported) {
      return {
        ...baseStyles,
        background: `rgba(255, 255, 255, ${backgroundOpacity})`,
        backdropFilter: `blur(${blur}px) saturate(${saturation})`,
        WebkitBackdropFilter: `blur(${blur}px) saturate(${saturation})`,
        border: '1px solid rgba(255, 255, 255, 0.78)',
        boxShadow: `
          0 6px 24px rgba(15, 23, 42, 0.06),
          0 1px 3px rgba(15, 23, 42, 0.03),
          inset 0 1px 1px 0 rgba(255, 255, 255, 0.9),
          0 0 0 1px rgba(226, 232, 240, 0.35)
        `,
      };
    } else {
      return {
        ...baseStyles,
        background: 'rgba(255, 255, 255, 0.92)',
        border: '1px solid rgba(226, 232, 240, 0.8)',
        boxShadow: '0 6px 20px rgba(15, 23, 42, 0.05)',
      };
    }
  };

  const overflowClass = overflow === 'visible' ? 'overflow-visible' : 'overflow-hidden';
  const glassSurfaceClasses =
    `relative flex items-center justify-center ${overflowClass} transition-all duration-200 ease-out`;

  const focusVisibleClasses =
    'focus-visible:outline-2 focus-visible:outline-teal-600 focus-visible:outline-offset-2';

  return (
    <div
      ref={containerRef}
      className={`${glassSurfaceClasses} ${focusVisibleClasses} ${className}`}
      style={getContainerStyles()}
    >
      {shouldUseSvg && (
        <svg
          className="w-full h-full pointer-events-none absolute inset-0 opacity-0 -z-10"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <defs>
            <filter id={filterId} colorInterpolationFilters="sRGB" x="0%" y="0%" width="100%" height="100%">
              <feImage ref={feImageRef} x="0" y="0" width="100%" height="100%" preserveAspectRatio="none" result="map" />

              <feDisplacementMap ref={redChannelRef} in="SourceGraphic" in2="map" id="redchannel" result="dispRed" />
              <feColorMatrix
                in="dispRed"
                type="matrix"
                values="1 0 0 0 0
                        0 0 0 0 0
                        0 0 0 0 0
                        0 0 0 1 0"
                result="red"
              />

              <feDisplacementMap
                ref={greenChannelRef}
                in="SourceGraphic"
                in2="map"
                id="greenchannel"
                result="dispGreen"
              />
              <feColorMatrix
                in="dispGreen"
                type="matrix"
                values="0 0 0 0 0
                        0 1 0 0 0
                        0 0 0 0 0
                        0 0 0 1 0"
                result="green"
              />

              <feDisplacementMap ref={blueChannelRef} in="SourceGraphic" in2="map" id="bluechannel" result="dispBlue" />
              <feColorMatrix
                in="dispBlue"
                type="matrix"
                values="0 0 0 0 0
                        0 0 0 0 0
                        0 0 1 0 0
                        0 0 0 1 0"
                result="blue"
              />

              <feBlend in="red" in2="green" mode="screen" result="rg" />
              <feBlend in="rg" in2="blue" mode="screen" result="output" />
              <feGaussianBlur ref={gaussianBlurRef} in="output" stdDeviation="0.4" />
            </filter>
          </defs>
        </svg>
      )}

      <div className={`w-full h-full flex items-center justify-center rounded-[inherit] relative z-10 ${innerClassName}`}>
        {children}
      </div>
    </div>
  );
};

export default GlassSurface;
