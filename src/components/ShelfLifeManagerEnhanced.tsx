"use client";

import { useState } from "react";
import { createShelfLifeOption, updateShelfLifeOption, deleteShelfLifeOption } from "@/app/shelf-life/actions";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface ShelfLifeOption {
  id: number;
  name: string;
  description: string | null;
  _count: {
    recipes: number;
  };
}

interface Props {
  shelfLifeOptions: ShelfLifeOption[];
}

export function ShelfLifeManagerEnhanced({ shelfLifeOptions: initialOptions }: Props) {
  const [options, setOptions] = useState(initialOptions);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
  });

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setOptions((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const data = new FormData();
    data.append("name", formData.name);
    data.append("description", formData.description);
    
    if (editingId) {
      await updateShelfLifeOption(editingId, data);
      setOptions(opts => opts.map(opt => 
        opt.id === editingId 
          ? { ...opt, name: formData.name, description: formData.description }
          : opt
      ));
    } else {
      const tempId = Date.now();
      setOptions([...options, {
        id: tempId,
        name: formData.name,
        description: formData.description,
        _count: { recipes: 0 },
      }]);
      await createShelfLifeOption(data);
    }
    
    setFormData({ name: "", description: "" });
    setIsAdding(false);
    setEditingId(null);
  };

  const handleEdit = (option: ShelfLifeOption) => {
    setFormData({
      name: option.name,
      description: option.description || "",
    });
    setEditingId(option.id);
    setIsAdding(true);
  };

  const handleDelete = async (id: number) => {
    if (confirm("Delete this shelf life option?")) {
      setOptions(opts => opts.filter(opt => opt.id !== id));
      await deleteShelfLifeOption(id);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Shelf Life Options</h3>
          <p className="text-sm text-gray-600">Drag to reorder</p>
        </div>
        {!isAdding && (
          <button
            onClick={() => setIsAdding(true)}
            className="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white px-3 py-1.5 rounded-lg hover:shadow-lg transition-all text-sm font-medium"
          >
            Add
          </button>
        )}
      </div>

      {isAdding && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
          <form onSubmit={handleSubmit} className="space-y-3">
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
              placeholder="e.g., 3 days refrigerated"
              required
            />
            <input
              type="text"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
              placeholder="Optional description..."
            />
            <div className="flex gap-2">
              <button type="submit" className="flex-1 bg-emerald-600 text-white px-3 py-2 rounded-lg hover:bg-emerald-700 text-sm font-medium">
                {editingId ? 'Update' : 'Create'}
              </button>
              <button type="button" onClick={() => { setIsAdding(false); setEditingId(null); setFormData({ name: "", description: "" }); }} className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm font-medium">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={options.map(o => o.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-2">
            {options.map((option) => (
              <SortableItem
                key={option.id}
                option={option}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {options.length === 0 && !isAdding && (
        <p className="text-center py-4 text-gray-500 text-sm">No options yet</p>
      )}
    </div>
  );
}

function SortableItem({
  option,
  onEdit,
  onDelete,
}: {
  option: ShelfLifeOption;
  onEdit: (option: ShelfLifeOption) => void;
  onDelete: (id: number) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: option.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`bg-white border rounded-lg p-3 flex items-center gap-3 ${
        isDragging ? 'border-emerald-500 shadow-lg' : 'border-gray-200'
      }`}
    >
      <div {...attributes} {...listeners} className="cursor-grab hover:cursor-grabbing p-1 text-gray-400 hover:text-emerald-600 rounded hover:bg-emerald-50">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
        </svg>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 truncate">{option.name}</p>
        {option.description && <p className="text-xs text-gray-600 truncate">{option.description}</p>}
      </div>
      <span className="text-xs text-gray-500">{option._count.recipes}</span>
      <div className="flex gap-1">
        <button onClick={() => onEdit(option)} className="p-1.5 text-gray-600 hover:text-emerald-600 hover:bg-emerald-50 rounded">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        </button>
        <button onClick={() => onDelete(option.id)} className="p-1.5 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>
    </div>
  );
}

