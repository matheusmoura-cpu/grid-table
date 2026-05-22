import { useState, useRef, useEffect, useCallback, useId } from 'react';
import { MoreVertical } from 'lucide-react';
import type { TableAction, ActionDispatch } from '../types/actions';
import type { MachineRecord } from '../types';

interface RowActionsMenuProps {
  record: MachineRecord;
  actions: TableAction[];
  onAction: ActionDispatch;
}

interface MenuCoords {
  top: number;
  right: number;
}

export function RowActionsMenu({ record, actions, onAction }: RowActionsMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [coords, setCoords] = useState<MenuCoords>({ top: 0, right: 0 });
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const menuId = useId();

  // Compute menu position and open it.
  const openMenu = useCallback(() => {
    const btn = triggerRef.current;
    if (!btn) return;
    const rect = btn.getBoundingClientRect();
    // Each action item is ~36px tall; add 8px padding top/bottom.
    const estimatedHeight = actions.length * 36 + 16;
    const openUpward = rect.bottom + estimatedHeight + 4 > window.innerHeight;
    setCoords({
      top: openUpward ? rect.top - estimatedHeight - 4 : rect.bottom + 4,
      right: window.innerWidth - rect.right,
    });
    setIsOpen(true);
  }, [actions.length]);

  const closeMenu = useCallback(() => setIsOpen(false), []);

  const toggleMenu = useCallback(() => {
    if (isOpen) closeMenu();
    else openMenu();
  }, [isOpen, closeMenu, openMenu]);

  // Close on outside click, Escape key, or any scroll.
  useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (e: PointerEvent) => {
      const target = e.target as Node;
      if (
        !menuRef.current?.contains(target) &&
        !triggerRef.current?.contains(target)
      ) {
        closeMenu();
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeMenu();
        triggerRef.current?.focus();
        return;
      }
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        const items = Array.from(
          menuRef.current?.querySelectorAll<HTMLButtonElement>('[role="menuitem"]') ?? [],
        );
        if (!items.length) return;
        const idx = items.indexOf(document.activeElement as HTMLButtonElement);
        const next =
          e.key === 'ArrowDown'
            ? (idx + 1) % items.length
            : (idx - 1 + items.length) % items.length;
        items[next].focus();
      }
    };

    const handleScroll = () => closeMenu();

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    window.addEventListener('scroll', handleScroll, { capture: true, passive: true });

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('scroll', handleScroll, { capture: true });
    };
  }, [isOpen, closeMenu]);

  // Focus first item when menu opens.
  useEffect(() => {
    if (!isOpen) return;
    const firstItem = menuRef.current?.querySelector<HTMLButtonElement>('[role="menuitem"]');
    // Small delay so the element is rendered before focusing.
    const id = requestAnimationFrame(() => firstItem?.focus());
    return () => cancelAnimationFrame(id);
  }, [isOpen]);

  const handleItemClick = (actionId: string) => {
    onAction(actionId, [record.id]);
    closeMenu();
  };

  const rowLabel = `${record.site} — ${record.uniqueMachineNumber}`;

  return (
    <>
      {/* Trigger button */}
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-controls={isOpen ? menuId : undefined}
        aria-label={`Actions for ${rowLabel}`}
        onClick={toggleMenu}
        className={[
          'inline-flex items-center justify-center w-7 h-7 rounded',
          'text-slate-400 transition-all duration-100',
          'hover:text-slate-700 hover:bg-slate-100',
          'focus-visible:outline-none focus-visible:ring-2',
          'focus-visible:ring-blue-500 focus-visible:ring-offset-1',
          // Hidden until row hover or keyboard focus; always visible when open.
          'opacity-0 group-hover/row:opacity-100 focus-visible:opacity-100',
          isOpen ? '!opacity-100 bg-slate-100 text-slate-700' : '',
        ].join(' ')}
      >
        <MoreVertical className="h-4 w-4" aria-hidden="true" />
      </button>

      {/* Dropdown menu — rendered via fixed positioning to escape overflow clipping */}
      {isOpen && (
        <div
          ref={menuRef}
          id={menuId}
          role="menu"
          aria-label={`Actions for ${rowLabel}`}
          style={{
            position: 'fixed',
            top: coords.top,
            right: coords.right,
            zIndex: 9999,
          }}
          className="min-w-[160px] bg-white border border-slate-200 rounded-lg
                     shadow-lg py-1 overflow-hidden"
        >
          {actions.map(action => {
            const Icon = action.icon;
            const isDanger = action.variant === 'danger';
            return (
              <button
                key={action.id}
                role="menuitem"
                type="button"
                onClick={() => handleItemClick(action.id)}
                aria-label={action.description ?? action.label}
                className={[
                  'w-full flex items-center gap-2.5 px-3 py-2 text-sm transition-colors',
                  'focus-visible:outline-none focus-visible:bg-slate-50',
                  'focus-visible:ring-inset focus-visible:ring-2 focus-visible:ring-blue-400',
                  isDanger
                    ? 'text-red-600 hover:bg-red-50'
                    : 'text-slate-700 hover:bg-slate-50',
                ].join(' ')}
              >
                <Icon
                  className={`h-3.5 w-3.5 flex-shrink-0 ${isDanger ? 'text-red-400' : 'text-slate-400'}`}
                  aria-hidden="true"
                />
                {action.label}
              </button>
            );
          })}
        </div>
      )}
    </>
  );
}
