import React, { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

const VIEWPORT_PADDING = 12;
const POPOVER_GAP = 10;

interface PopoverPosition {
  top: number;
  left: number;
  maxHeight: number;
}

interface AnchoredPopoverProps {
  isOpen: boolean;
  anchorElement: HTMLElement | null;
  onClose: () => void;
  /** 'start' aligns the popover's left edge with the anchor; 'end' aligns its right edge. */
  align?: 'start' | 'end';
  className?: string;
  children: React.ReactNode;
}

function getPopoverPosition(params: {
  anchorElement: HTMLElement | null;
  popoverElement: HTMLDivElement | null;
  align: 'start' | 'end';
}): PopoverPosition {
  const { anchorElement, popoverElement, align } = params;

  if (!anchorElement || !popoverElement) {
    return {
      top: VIEWPORT_PADDING,
      left: VIEWPORT_PADDING,
      maxHeight: window.innerHeight - VIEWPORT_PADDING * 2,
    };
  }

  const anchorRect = anchorElement.getBoundingClientRect();
  const popoverRect = popoverElement.getBoundingClientRect();
  const spaceBelow = window.innerHeight - anchorRect.bottom - VIEWPORT_PADDING;
  const spaceAbove = anchorRect.top - VIEWPORT_PADDING;
  const shouldPlaceBelow =
    spaceBelow >= Math.min(popoverRect.height, 320) || spaceBelow >= spaceAbove;

  let top = shouldPlaceBelow
    ? anchorRect.bottom + POPOVER_GAP
    : anchorRect.top - popoverRect.height - POPOVER_GAP;
  let left =
    align === 'end'
      ? anchorRect.right - popoverRect.width
      : anchorRect.left;

  if (left + popoverRect.width > window.innerWidth - VIEWPORT_PADDING) {
    left = window.innerWidth - popoverRect.width - VIEWPORT_PADDING;
  }
  if (left < VIEWPORT_PADDING) {
    left = VIEWPORT_PADDING;
  }
  if (top < VIEWPORT_PADDING) {
    top = VIEWPORT_PADDING;
  }

  return {
    top,
    left,
    maxHeight: Math.max(window.innerHeight - top - VIEWPORT_PADDING, 240),
  };
}

export const AnchoredPopover: React.FC<AnchoredPopoverProps> = ({
  isOpen,
  anchorElement,
  onClose,
  align = 'start',
  className = '',
  children,
}) => {
  const [position, setPosition] = useState<PopoverPosition | null>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) {
      setPosition(null);
    }
  }, [isOpen]);

  const calculatePosition = useCallback((): PopoverPosition => {
    return getPopoverPosition({
      anchorElement,
      popoverElement: popoverRef.current,
      align,
    });
  }, [align, anchorElement]);

  useEffect(() => {
    if (!isOpen || !anchorElement || !popoverRef.current) {
      return;
    }

    const updatePosition = () => {
      setPosition(calculatePosition());
    };

    updatePosition();
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);

    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [anchorElement, calculatePosition, isOpen]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (popoverRef.current?.contains(target)) {
        return;
      }
      if (anchorElement?.contains(target)) {
        return;
      }
      onClose();
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [anchorElement, isOpen, onClose]);

  if (!isOpen) {
    return null;
  }

  return createPortal(
    <div
      ref={popoverRef}
      className={`fixed z-50 transition-opacity ${
        position ? 'opacity-100' : 'opacity-0'
      } ${className}`}
      style={
        position
          ? {
              top: `${position.top}px`,
              left: `${position.left}px`,
              maxHeight: `${position.maxHeight}px`,
            }
          : {
              top: '-9999px',
              left: '-9999px',
            }
      }
    >
      {children}
    </div>,
    document.body,
  );
};
