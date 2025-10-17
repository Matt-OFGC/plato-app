"use client";

import { useState } from "react";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { ALL_NAVIGATION_ITEMS, NavigationItem, DEFAULT_NAVIGATION_ITEMS } from "@/lib/navigation-config";

interface NavigationSettingsProps {
  currentItems: string[];
  onSave: (items: string[]) => void;
}

export function NavigationSettings({ currentItems, onSave }: NavigationSettingsProps) {
  const [selectedItems, setSelectedItems] = useState<string[]>(currentItems);
  const [isDragging, setIsDragging] = useState(false);

  // Get the selected navigation items with their details
  const getSelectedItems = () => {
    return ALL_NAVIGATION_ITEMS.filter(item => selectedItems.includes(item.value));
  };

  // Get available items (not currently selected)
  const getAvailableItems = () => {
    return ALL_NAVIGATION_ITEMS.filter(item => !selectedItems.includes(item.value));
  };

  const handleDragEnd = (result: DropResult) => {
    setIsDragging(false);
    
    if (!result.destination) return;

    const { source, destination } = result;

    if (source.droppableId === destination.droppableId) {
      // Reordering within the same list
      if (source.droppableId === "selected") {
        const newItems = Array.from(selectedItems);
        const [reorderedItem] = newItems.splice(source.index, 1);
        newItems.splice(destination.index, 0, reorderedItem);
        setSelectedItems(newItems);
      }
    } else {
      // Moving between lists
      if (source.droppableId === "available" && destination.droppableId === "selected") {
        // Adding item to selected
        if (selectedItems.length < 4) {
          const itemToAdd = getAvailableItems()[source.index];
          const newSelected = Array.from(selectedItems);
          newSelected.splice(destination.index, 0, itemToAdd.value);
          setSelectedItems(newSelected);
        }
      } else if (source.droppableId === "selected" && destination.droppableId === "available") {
        // Removing item from selected
        const newSelected = Array.from(selectedItems);
        newSelected.splice(source.index, 1);
        setSelectedItems(newSelected);
      }
    }
  };

  const handleSave = () => {
    onSave(selectedItems);
  };

  const handleReset = () => {
    setSelectedItems(DEFAULT_NAVIGATION_ITEMS);
  };

  return (
    <div className="space-y-6">
      {/* Preview */}
      <div className="bg-gray-50 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Preview</h3>
        <div className="floating-nav rounded-3xl px-4 py-2 mx-auto max-w-md">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-1 flex-1">
              {getSelectedItems().slice(0, 4).map((item, index) => (
                <div
                  key={item.value}
                  className="floating-nav-item flex-1 flex flex-col items-center justify-center p-2 rounded-2xl transition-all duration-200 text-gray-500 hover:text-gray-700 hover:bg-gray-100/50"
                >
                  <div className="text-gray-500">
                    {item.icon}
                  </div>
                  <span className="text-xs font-medium mt-1 truncate max-w-[60px]">
                    {item.shortLabel}
                  </span>
                </div>
              ))}
              
              {/* More button */}
              <div className="floating-nav-item flex-1 flex flex-col items-center justify-center p-2 rounded-2xl transition-all duration-200 text-gray-500 hover:text-gray-700 hover:bg-gray-100/50">
                <div className="text-gray-500">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </div>
                <span className="text-xs font-medium mt-1">More</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Drag and Drop Interface */}
      <DragDropContext onDragEnd={handleDragEnd} onDragStart={() => setIsDragging(true)}>
        <div className="grid md:grid-cols-2 gap-6">
          {/* Selected Items */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Selected Items ({selectedItems.length}/4)
            </h3>
            <Droppable droppableId="selected">
              {(provided, snapshot) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className={`min-h-[200px] p-4 rounded-xl border-2 border-dashed transition-colors ${
                    snapshot.isDraggingOver 
                      ? "border-emerald-300 bg-emerald-50" 
                      : "border-gray-300 bg-gray-50"
                  }`}
                >
                  {getSelectedItems().map((item, index) => (
                    <Draggable key={item.value} draggableId={item.value} index={index}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          className={`mb-2 p-3 bg-white rounded-lg border transition-all ${
                            snapshot.isDragging ? "shadow-lg rotate-2" : "shadow-sm"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className="text-gray-500">
                              {item.icon}
                            </div>
                            <span className="font-medium text-gray-900">{item.label}</span>
                            <div className="ml-auto text-gray-400">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
                              </svg>
                            </div>
                          </div>
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                  
                  {selectedItems.length < 4 && (
                    <div className="text-sm text-gray-500 text-center py-4">
                      Drag items here to add them to your navigation
                    </div>
                  )}
                </div>
              )}
            </Droppable>
          </div>

          {/* Available Items */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Available Items</h3>
            <Droppable droppableId="available">
              {(provided, snapshot) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className={`min-h-[200px] p-4 rounded-xl border-2 border-dashed transition-colors ${
                    snapshot.isDraggingOver 
                      ? "border-blue-300 bg-blue-50" 
                      : "border-gray-300 bg-gray-50"
                  }`}
                >
                  {getAvailableItems().map((item, index) => (
                    <Draggable key={item.value} draggableId={item.value} index={index}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          className={`mb-2 p-3 bg-white rounded-lg border transition-all ${
                            snapshot.isDragging ? "shadow-lg rotate-2" : "shadow-sm"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className="text-gray-500">
                              {item.icon}
                            </div>
                            <span className="font-medium text-gray-900">{item.label}</span>
                            <div className="ml-auto text-gray-400">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
                              </svg>
                            </div>
                          </div>
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                  
                  {getAvailableItems().length === 0 && (
                    <div className="text-sm text-gray-500 text-center py-4">
                      All items are selected
                    </div>
                  )}
                </div>
              )}
            </Droppable>
          </div>
        </div>
      </DragDropContext>

      {/* Actions */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-200">
        <button
          onClick={handleReset}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
        >
          Reset to Default
        </button>
        
        <div className="flex items-center gap-3">
          <div className="text-sm text-gray-500">
            {selectedItems.length}/4 items selected
          </div>
          <button
            onClick={handleSave}
            disabled={selectedItems.length !== 4}
            className="px-6 py-2 bg-emerald-500 hover:bg-emerald-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors"
          >
            Save Navigation
          </button>
        </div>
      </div>
    </div>
  );
}