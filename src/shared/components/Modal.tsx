import React, { useEffect } from 'react';
import { LuX } from 'react-icons/lu';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  maxWidth?:
    | 'sm'
    | 'md'
    | 'lg'
    | 'xl'
    | '2xl'
    | '3xl'
    | '4xl'
    | '5xl'
    | '6xl'
    | '7xl'
    | 'full';
  contentClassName?: string;
  panelClassName?: string;
}

const MAX_WIDTH_CLASSES: Record<string, string> = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  '2xl': 'max-w-2xl',
  '3xl': 'max-w-3xl',
  '4xl': 'max-w-4xl',
  '5xl': 'max-w-5xl',
  '6xl': 'max-w-6xl',
  '7xl': 'max-w-7xl',
  full: 'max-w-full',
};

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  maxWidth = 'md',
  contentClassName = '',
  panelClassName = '',
}) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div
        className="modal-backdrop fixed inset-0 transition-opacity"
        onClick={onClose}
      />

      <div className="flex min-h-full items-center justify-center p-4 sm:p-6">
        <div
          className={`modal-panel max-h-[calc(100vh-2rem)] ${MAX_WIDTH_CLASSES[maxWidth]} ${panelClassName}`}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="modal-header">
            <h2 className="text-app text-xl font-semibold">{title}</h2>
            <button
              onClick={onClose}
              className="icon-button"
              aria-label="Close modal"
            >
              <LuX className="h-5 w-5" />
            </button>
          </div>

          <div className={`min-h-0 overflow-y-auto p-6 ${contentClassName}`}>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};
