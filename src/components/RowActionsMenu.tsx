import { useState, useRef, useEffect, useCallback } from 'react';
import { MoreVertical, Pencil, ArrowRightLeft } from 'lucide-react';
import type { MachineRecord } from '../types';

interface RowActionsMenuProps {
  record: MachineRecord;
  onEdit: (id: number) => void;
  onMoveMachine: (ids: number[]) => void;
}

interface MenuPosition {
  top: number;
  right: number;
}

export function RowActionsMenu({ record, onEdit, onMoveMachine }: RowActionsMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [pos, setPos] = useState<MenuPosition>({ top: 0, right: 0 });
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const openMenu = useCallback(() => {
    if (!buttonRef.current) return;
    const rect = buttonRef.current.getBoundingClientRect();
    const MENU_HEIGHT = 88; // approx two items
    const openUpward = rect.bottom + MENU_HEIGHT + 8 > window.innerHeight;
    setPos({
      top: openUpward ? rect.top - MENU_HEIGHT - 4 : rect.bottom + 4,
      right: window.innerWidth - rect.right,
    });
    setIsOpen(true);
  }, []);

  const closeMenu = useCallback(() => setIsOpen(false), []);

  useEffect(() => {
    if (!isOpen) return;
    function handleClick(e: MouseEvent) {
      if (
        menuRef.current && !menuRef.current.contains(e.target as Node) &&
        buttonRef.current && !buttonRef.current.contains(e.target as Node)
      ) {
        closeMenu();
      }
    }
    function handleScroll() { closeMenu(); }
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        closeMenu();
        buttonRef.current?.focus();
      }
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        const items = menuRef.current?.querySelectorAll<HTMLButtonElement>('[role="menuitem"]');
        if (!items || items.length === 0) return;
        const active = document.activeElement;
        const idx = Array.from(items).indexOf(active as HTMLButtonElement);
        const next = e.key === 'ArrowDown'
          ? (idx + 1) % items.length
          : (idx - 1 + items.length) % items.length;
        items[next].focus();
      }
    }
    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleKeyDown);
    window.addEventListener('scroll', handleScroll, true);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('scroll', handleScroll, true);
    };
  }, [isOpen, closeMenu]);

  // Focus the first item when menu opens
  useEffect(() => {
    if (isOpen) {
      const firstItem = menuRef.current?.querySelector<HTMLButtonElement>('[role="menuitem"]');
      firstItem?.focus();
    }
  }, [isOpen]);

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        onClick={isOpen ? closeMenu : openMenu}
        aria-label={`Actions for ${record.site} — ${record.uniqueMachineNumber}`}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        className={`inline-flex items-center justify-center w-7 h-7 rounded
                    text-slate-400 transition-all
                    hover:text-slate-700 hover:bg-slate-100
                    focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1
                    opacity-0 group-hover/row:opacity-100 focus-visible:opacity-100
                    ${isOpen ? '!opacity-100 bg-slate-100 text-slate-700' : ''}`}
      >
        <MoreVertical className="h-4 w-4" aria-hidden="true" />
      </button>

      {isOpen && (
        <div
          ref={menuRef}
          role="menu"
          aria-label={`Row actions for ${record.site}`}
          style={{ position: 'fixed', top: pos.top, right: pos.right, zIndex: 9999 }}
          className="w-44 bg-white border border-slate-200 rounded-lg shadow-lg py-1 overflow-hidden"
        >
          <button
            role="menuitem"
            type="button"
            className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-slate-700
                       hover:bg-slate-50 focus-visible:bg-slate-50 focus-visible:outline-none
                       focus-visible:ring-inset focus-visible:ring-2 focus-visible:ring-blue-400
                       transition-colors"
            onClick={() => { onEdit(record.id); closeMenu(); }}
          >
            <Pencil className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" aria-hidden="true" />
            Edit
          </button>
          <button
            role="menuitem"
            type="button"
            className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-slate-700
                       hover:bg-slate-50 focus-visible:bg-slate-50 focus-visible:outline-none
                       focus-visible:ring-inset focus-visible:ring-2 focus-visible:ring-blue-400
                       transition-colors"
            onClick={() => { onMoveMachine([record.id]); closeMenu(); }}
          >
            <ArrowRightLeft className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" aria-hidden="true" />
            Move Machine
          </button>
        </div>
      )}
    </>
  );
}
