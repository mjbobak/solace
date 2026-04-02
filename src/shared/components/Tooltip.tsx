import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';

interface TooltipProps {
  content: string;
  children: React.ReactNode;
  delay?: number; // milliseconds before showing tooltip
  stacked?: boolean;
  followCursor?: boolean;
}

interface TooltipPosition {
  top: number;
  left: number;
  arrowLeft: number; // Position arrow relative to tooltip, pointing to trigger center
}

/**
 * Tooltip component that shows content on hover
 * Uses React Portal to render at document root, ensuring it's never clipped by overflow containers
 * Displays above the trigger element by default, switches to below if near top edge
 */
export const Tooltip: React.FC<TooltipProps> = ({
  content,
  children,
  delay = 300,
  stacked = false,
  followCursor = false,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [timeoutId, setTimeoutId] = useState<ReturnType<
    typeof setTimeout
  > | null>(null);
  const [position, setPosition] = useState<TooltipPosition | null>(null);

  const triggerRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const pointerPositionRef = useRef<{ x: number; y: number } | null>(null);

  const calculatePosition = (): TooltipPosition => {
    if (!triggerRef.current || !tooltipRef.current) {
      return { top: 0, left: 0, arrowLeft: 0 };
    }

    const triggerRect = triggerRef.current.getBoundingClientRect();
    const tooltipRect = tooltipRef.current.getBoundingClientRect();
    const PADDING = 8;
    const GAP = 8; // Space between trigger and tooltip

    const anchorX = followCursor
      ? (pointerPositionRef.current?.x ?? triggerRect.left + triggerRect.width / 2)
      : triggerRect.left + triggerRect.width / 2;
    const anchorY = followCursor
      ? (pointerPositionRef.current?.y ?? triggerRect.top)
      : triggerRect.top;

    // Default: center tooltip above the trigger or pointer
    let top = anchorY - tooltipRect.height - GAP;
    let left = anchorX - tooltipRect.width / 2;

    // Edge detection: adjust if off-screen
    if (left < PADDING) left = PADDING;
    if (left + tooltipRect.width > window.innerWidth - PADDING) {
      left = window.innerWidth - tooltipRect.width - PADDING;
    }

    // If tooltip goes above viewport, show below trigger instead
    if (top < PADDING) {
      top = (followCursor ? anchorY : triggerRect.bottom) + GAP;
    }

    // Arrow should point to center of trigger or current pointer
    const arrowLeft = anchorX - left;

    return { top, left, arrowLeft };
  };

  const handleMouseEnter = () => {
    const id = setTimeout(() => {
      setIsVisible(true);
    }, delay);
    setTimeoutId(id);
  };

  const showTooltipImmediately = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
      setTimeoutId(null);
    }
    setIsVisible(true);
  };

  const handleMouseLeave = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
      setTimeoutId(null);
    }
    setIsVisible(false);
  };

  const handleMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!followCursor) {
      return;
    }

    pointerPositionRef.current = {
      x: event.clientX,
      y: event.clientY,
    };

    if (isVisible) {
      setPosition(calculatePosition());
    }
  };

  // Calculate position when tooltip becomes visible
  useEffect(() => {
    if (isVisible && triggerRef.current && tooltipRef.current) {
      setPosition(calculatePosition());
    }
  }, [isVisible]);

  // Recalculate position on scroll/resize while visible
  useEffect(() => {
    if (!isVisible) return;

    const handlePositionUpdate = () => {
      setPosition(calculatePosition());
    };

    // Use capture phase (true) to catch scroll events in all containers
    window.addEventListener('scroll', handlePositionUpdate, true);
    window.addEventListener('resize', handlePositionUpdate);

    return () => {
      window.removeEventListener('scroll', handlePositionUpdate, true);
      window.removeEventListener('resize', handlePositionUpdate);
    };
  }, [isVisible]);

  return (
    <>
      {/* Trigger element with ref */}
      <div
        ref={triggerRef}
        className="inline-block"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onMouseMove={handleMouseMove}
        onFocus={showTooltipImmediately}
        onBlur={handleMouseLeave}
      >
        {children}
      </div>

      {/* Tooltip rendered at document root via Portal */}
      {isVisible &&
        createPortal(
          <div
            ref={tooltipRef}
            className={`fixed z-50 rounded px-3 py-2 text-xs shadow-lg transition-opacity duration-150 ${
              stacked ? 'whitespace-pre-line' : 'whitespace-nowrap'
            } ${position ? 'opacity-100' : 'opacity-0'}`}
            style={
              position
                ? {
                    top: `${position.top}px`,
                    left: `${position.left}px`,
                    backgroundColor: 'var(--color-overlay-strong)',
                    color: 'var(--color-inverse)',
                  }
                : { top: '-9999px', left: '-9999px' }
            }
          >
            {content}
            <div
              className="absolute top-full border-4 border-transparent"
              style={{
                left: `${position?.arrowLeft ?? 0}px`,
                transform: 'translateX(-50%)',
                borderTopColor: 'var(--color-overlay-strong)',
              }}
            />
          </div>,
          document.body,
        )}
    </>
  );
};
