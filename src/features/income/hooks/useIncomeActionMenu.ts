import type { RefObject } from 'react';
import { useEffect, useRef, useState } from 'react';

import type { ActionMenuPosition } from '../types/incomeView';

interface UseIncomeActionMenuResult {
  actionMenuPosition: ActionMenuPosition | null;
  actionMenuRef: RefObject<HTMLDivElement | null>;
  openActionMenuSourceId: number | null;
  closeActionMenu: () => void;
  toggleActionMenu: (sourceId: number, button: HTMLButtonElement) => void;
}

export function useIncomeActionMenu(): UseIncomeActionMenuResult {
  const [openActionMenuSourceId, setOpenActionMenuSourceId] = useState<
    number | null
  >(null);
  const [actionMenuPosition, setActionMenuPosition] =
    useState<ActionMenuPosition | null>(null);
  const actionMenuRef = useRef<HTMLDivElement | null>(null);
  const actionMenuTriggerRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (openActionMenuSourceId === null) {
      return;
    }

    const handleClickOutside = (event: MouseEvent) => {
      if (
        actionMenuRef.current &&
        !actionMenuRef.current.contains(event.target as Node)
      ) {
        setOpenActionMenuSourceId(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [openActionMenuSourceId]);

  useEffect(() => {
    if (openActionMenuSourceId === null || !actionMenuTriggerRef.current) {
      return;
    }

    const updatePosition = () => {
      if (!actionMenuTriggerRef.current) {
        return;
      }

      const rect = actionMenuTriggerRef.current.getBoundingClientRect();
      setActionMenuPosition({
        top: rect.bottom + 8,
        left: rect.right,
      });
    };

    updatePosition();
    window.addEventListener('scroll', updatePosition, true);
    window.addEventListener('resize', updatePosition);

    return () => {
      window.removeEventListener('scroll', updatePosition, true);
      window.removeEventListener('resize', updatePosition);
    };
  }, [openActionMenuSourceId]);

  const closeActionMenu = () => {
    setOpenActionMenuSourceId(null);
    setActionMenuPosition(null);
    actionMenuTriggerRef.current = null;
  };

  const toggleActionMenu = (sourceId: number, button: HTMLButtonElement) => {
    setOpenActionMenuSourceId((current) => {
      if (current === sourceId) {
        actionMenuTriggerRef.current = null;
        setActionMenuPosition(null);
        return null;
      }

      actionMenuTriggerRef.current = button;
      const rect = button.getBoundingClientRect();
      setActionMenuPosition({
        top: rect.bottom + 8,
        left: rect.right,
      });
      return sourceId;
    });
  };

  return {
    actionMenuPosition,
    actionMenuRef,
    openActionMenuSourceId,
    closeActionMenu,
    toggleActionMenu,
  };
}
