import { useState } from 'react';
import { Settings2, Eye, EyeOff, GripVertical } from 'lucide-react';
import { ALL_COLUMNS } from '../data/machines';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface ColumnManagerProps {
  visibleColumns: string[];
  columnOrder: string[];
  onToggleColumn: (key: string) => void;
  onReorderColumns: (newOrder: string[]) => void;
}

function SortableItem({ id, label, isVisible, onToggle }: {
  id: string;
  label: string;
  isVisible: boolean;
  onToggle: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });
  const style = { transform: CSS.Transform.toString(transform), transition };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm
                  ${isVisible ? 'bg-white' : 'bg-slate-50 text-slate-400'}`}
    >
      <button {...attributes} {...listeners} className="cursor-grab text-slate-400 hover:text-slate-600" aria-label="Drag to reorder">
        <GripVertical className="h-4 w-4" />
      </button>
      <button
        onClick={onToggle}
        className={`p-1 rounded ${isVisible ? 'text-blue-600' : 'text-slate-300'}`}
        aria-label={isVisible ? `Hide ${label}` : `Show ${label}`}
      >
        {isVisible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
      </button>
      <span className="flex-1">{label}</span>
    </div>
  );
}

export function ColumnManager({ visibleColumns, columnOrder, onToggleColumn, onReorderColumns }: ColumnManagerProps) {
  const [isOpen, setIsOpen] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = columnOrder.indexOf(active.id as string);
      const newIndex = columnOrder.indexOf(over.id as string);
      onReorderColumns(arrayMove(columnOrder, oldIndex, newIndex));
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-slate-600
                   hover:bg-slate-100 rounded-lg transition-colors border border-slate-200"
        aria-label="Manage columns"
        aria-expanded={isOpen}
      >
        <Settings2 className="h-4 w-4" />
        Columns
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 top-full mt-2 z-50 w-72 bg-white border border-slate-200
                          rounded-xl shadow-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-100">
              <h3 className="text-sm font-semibold text-slate-700">Manage Columns</h3>
              <p className="text-xs text-slate-400 mt-0.5">Drag to reorder, click eye to toggle</p>
            </div>
            <div className="max-h-96 overflow-auto p-2 space-y-1">
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={columnOrder} strategy={verticalListSortingStrategy}>
                  {columnOrder.map(key => {
                    const col = ALL_COLUMNS.find(c => c.key === key);
                    if (!col) return null;
                    return (
                      <SortableItem
                        key={key}
                        id={key}
                        label={col.label}
                        isVisible={visibleColumns.includes(key)}
                        onToggle={() => onToggleColumn(key)}
                      />
                    );
                  })}
                </SortableContext>
              </DndContext>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
