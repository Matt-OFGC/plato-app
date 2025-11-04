"use client";

import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";

interface StorageOption {
  id: number;
  name: string;
  description: string | null;
  icon: string | null;
}

interface Props {
  storageOptions: StorageOption[];
  value?: number | null;
  onChange: (optionId: number | null) => void;
  placeholder?: string;
  allowCreate?: boolean;
  onCreateStorage?: (name: string) => void;
}

export function StorageSelector({ 
  storageOptions, 
  value, 
  onChange, 
  placeholder = "Select storage...",
  allowCreate = false,
  onCreateStorage 
}: Props) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [newOptionName, setNewOptionName] = useState("");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0, openUpward: false });
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [mounted, setMounted] = useState(false);

  const selectedOption = storageOptions.find(o => o.id === value);

  const filteredOptions = storageOptions.filter(option =>
    option.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      
      // Always open upward for bottom bar selectors
      // Position dropdown directly above button with small gap
      // Use a smaller estimated height so it appears closer
      const estimatedHeight = 150; // Smaller estimate for tighter positioning
      const gap = 8; // Small gap between button and dropdown
      
      setDropdownPosition({
        top: rect.top - estimatedHeight - gap,
        left: rect.left,
        width: rect.width,
        openUpward: true,
      });
    }
  }, [isOpen]);
  
  // Adjust position after dropdown renders to account for actual height
  useEffect(() => {
    if (isOpen && dropdownRef.current && buttonRef.current) {
      const buttonRect = buttonRef.current.getBoundingClientRect();
      const dropdownRect = dropdownRef.current.getBoundingClientRect();
      const actualHeight = dropdownRect.height;
      const gap = 8;
      
      // Recalculate top position based on actual height
      setDropdownPosition(prev => ({
        ...prev,
        top: buttonRect.top - actualHeight - gap,
      }));
    }
  }, [isOpen, filteredOptions.length, showCreateForm]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      if (
        dropdownRef.current && 
        !dropdownRef.current.contains(target) &&
        buttonRef.current &&
        !buttonRef.current.contains(target)
      ) {
        setIsOpen(false);
        setSearchTerm("");
        setShowCreateForm(false);
        setNewOptionName("");
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("scroll", handleClickOutside, true);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("scroll", handleClickOutside, true);
    };
  }, [isOpen]);

  const handleSelect = (optionId: number | null) => {
    onChange(optionId);
    setIsOpen(false);
    setSearchTerm("");
  };

  const handleCreateOption = async () => {
    if (!newOptionName.trim()) {
      alert("Please enter a storage option name");
      return;
    }
    
    if (isCreating) return; // Prevent double submissions
    
    setIsCreating(true);
    
    try {
      const response = await fetch("/api/quick-create/storage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newOptionName.trim() }),
      });

      const data = await response.json();

      if (response.ok && data.success && data.option) {
        // Call the callback if provided (for backward compatibility)
        if (onCreateStorage) {
          onCreateStorage(newOptionName.trim());
        }
        
        // Immediately select the new option (optimistic update)
        onChange(data.option.id);
        
        // Clear form state and close dropdown
        setNewOptionName("");
        setShowCreateForm(false);
        setSearchTerm("");
        setIsOpen(false);
        setIsCreating(false);
        
        // Refresh the router to get updated options list in the background
        router.refresh();
      } else {
        const errorMsg = data.error || data.details?.[0]?.message || "Failed to create storage option";
        alert(`Error: ${errorMsg}`);
        setIsCreating(false);
      }
    } catch (error) {
      console.error("Error creating storage option:", error);
      alert(`Failed to create storage option: ${error instanceof Error ? error.message : "Unknown error"}`);
      setIsCreating(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      setIsOpen(false);
      setSearchTerm("");
      setShowCreateForm(false);
    }
  };

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full text-xs px-2 py-1.5 text-left border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white/80 backdrop-blur-xl border-gray-200/60 hover:bg-white hover:border-gray-300 hover:shadow-md flex items-center justify-between transition-all ${
          isOpen 
            ? 'border-emerald-500 shadow-lg ring-2 ring-emerald-500/20 bg-white' 
            : ''
        }`}
      >
        <div className="flex items-center gap-1.5 min-w-0">
          {selectedOption ? (
            <>
              {selectedOption.icon && (
                <svg className="w-3 h-3 text-gray-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={selectedOption.icon} />
                </svg>
              )}
              <span className="text-gray-700 truncate">{selectedOption.name}</span>
            </>
          ) : (
            <span className="text-gray-500 truncate">{placeholder}</span>
          )}
        </div>
        <svg
          className={`w-3 h-3 text-gray-500 flex-shrink-0 ml-1 transition-transform ${isOpen ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && mounted && createPortal(
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-[10000] bg-black/5"
            onClick={() => setIsOpen(false)}
          />
          {/* Dropdown */}
          <div 
            ref={dropdownRef}
            className="fixed z-[10001] bg-white border border-gray-200 rounded-xl shadow-2xl"
            style={{
              top: `${dropdownPosition.top}px`,
              left: `${dropdownPosition.left}px`,
              width: `${Math.max(dropdownPosition.width, 280)}px`, // Minimum 280px, match button width
              maxWidth: 'calc(100vw - 2rem)',
              maxHeight: showCreateForm ? '500px' : '240px',
              overflowY: 'auto',
              overflowX: 'hidden',
            }}
          >
          <div className="p-2 border-b border-gray-200/50">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Search options..."
              className="w-full px-2 py-1.5 text-xs bg-white/60 backdrop-blur-sm border border-gray-200/50 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-gray-800 placeholder:text-gray-400"
              autoFocus
            />
          </div>

          <div className="overflow-y-auto overflow-x-visible" style={{ maxHeight: showCreateForm ? '400px' : '192px', minHeight: '100px' }}>
            {/* Clear selection option */}
            <button
              onClick={() => handleSelect(null)}
              className="w-full px-2 py-1.5 text-left text-xs text-gray-600 hover:bg-emerald-50 hover:text-emerald-700 transition-all flex items-center gap-2 rounded-lg mx-0.5 my-0.5"
            >
              <span>No storage</span>
            </button>

            {/* Option items */}
            {filteredOptions.map((option) => (
              <button
                key={option.id}
                onClick={() => handleSelect(option.id)}
                className="w-full px-2 py-1.5 text-left text-xs hover:bg-gray-50 transition-all flex items-center gap-2 rounded-lg mx-0.5 my-0.5"
              >
                {option.icon && (
                  <svg className="w-3 h-3 text-gray-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={option.icon} />
                  </svg>
                )}
                <div className="min-w-0">
                  <div className="font-medium text-gray-900 truncate">{option.name}</div>
                  {option.description && (
                    <div className="text-xs text-gray-500 truncate">{option.description}</div>
                  )}
                </div>
              </button>
            ))}

            {/* Create new option */}
            {allowCreate && onCreateStorage && (
              <>
                {filteredOptions.length === 0 && searchTerm && (
                  <div className="px-2 py-1.5 text-xs text-gray-500 border-t border-gray-200">
                    No options found
                  </div>
                )}
                
                {searchTerm && !storageOptions.some(o => o.name.toLowerCase() === searchTerm.toLowerCase()) && (
                  <div className="border-t border-gray-200">
                    {!showCreateForm ? (
                      <button
                        type="button"
                        onClick={() => {
                          const nameToUse = searchTerm.trim() || "New Storage Option";
                          setNewOptionName(nameToUse);
                          setShowCreateForm(true);
                        }}
                        className="w-full px-2 py-1.5 text-left text-xs text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700 transition-colors flex items-center gap-2 rounded-lg mx-0.5 my-0.5"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        <span>Create "{searchTerm}"</span>
                      </button>
                    ) : (
                      <div className="border-t border-gray-200 mt-2 pt-2">
                        <div className="px-2 py-2">
                          <div className="text-xs font-medium text-gray-700 mb-2">Create new storage option</div>
                          <input
                            type="text"
                            value={newOptionName}
                            onChange={(e) => setNewOptionName(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault();
                                handleCreateOption();
                              } else if (e.key === "Escape") {
                                setShowCreateForm(false);
                                setNewOptionName("");
                              }
                            }}
                            placeholder="Storage option name"
                            className="w-full px-2 py-1.5 text-xs bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-gray-800 placeholder:text-gray-400 mb-2"
                            autoFocus
                          />
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={handleCreateOption}
                              disabled={isCreating}
                              className="flex-1 px-2 py-1.5 text-xs font-medium bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {isCreating ? "Creating..." : "Create"}
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setShowCreateForm(false);
                                setNewOptionName("");
                              }}
                              className="flex-1 px-2 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
        </>,
        document.body
      )}
    </div>
  );
}
