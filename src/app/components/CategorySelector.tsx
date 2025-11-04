"use client";

import { useState, useRef, useEffect } from "react";

interface Category {
  id: number;
  name: string;
  description: string | null;
  color: string | null;
}

interface Props {
  categories: Category[];
  value?: number | null;
  onChange: (categoryId: number | null) => void;
  placeholder?: string;
  allowCreate?: boolean;
  onCreateCategory?: (name: string) => void;
}

export function CategorySelector({ 
  categories, 
  value, 
  onChange, 
  placeholder = "Select a category...",
  allowCreate = false,
  onCreateCategory 
}: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [newCategoryName, setNewCategoryName] = useState("");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selectedCategory = categories.find(c => c.id === value);

  const filteredCategories = categories.filter(category =>
    category.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchTerm("");
        setShowCreateForm(false);
        setNewCategoryName("");
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (categoryId: number | null) => {
    onChange(categoryId);
    setIsOpen(false);
    setSearchTerm("");
  };

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) return;
    
    try {
      const response = await fetch("/api/quick-create/category", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newCategoryName.trim() }),
      });

      const data = await response.json();

      if (response.ok && data.success && data.category) {
        // Call the callback if provided (for backward compatibility)
        if (onCreateCategory) {
          onCreateCategory(newCategoryName.trim());
        }
        // Update the selection to the new category
        onChange(data.category.id);
        setNewCategoryName("");
        setShowCreateForm(false);
        setSearchTerm("");
        setIsOpen(false);
        // Refresh the page to get updated categories list
        window.location.reload();
      } else {
        alert(data.error || "Failed to create category");
      }
    } catch (error) {
      console.error("Error creating category:", error);
      alert("Failed to create category. Please try again.");
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
    <div className="relative" ref={dropdownRef}>
      {/* Backdrop blur when open */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/10 backdrop-blur-sm animate-spring"
          onClick={() => setIsOpen(false)}
          style={{ animation: 'fadeIn 0.2s ease-out' }}
        />
      )}
      
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full px-3 py-2 text-left rounded-lg flex items-center justify-between transition-all duration-300 bg-white border border-neutral-300 hover:border-neutral-400 hover:bg-neutral-50 ${
          isOpen 
            ? 'border-2 border-emerald-500 shadow-md ring-2 ring-emerald-500/20' 
            : ''
        }`}
      >
        <div className="flex items-center gap-2">
          {selectedCategory ? (
            <>
              <div
                className="w-3 h-3 rounded-full shadow-sm"
                style={{ backgroundColor: selectedCategory.color || "#3B82F6" }}
              />
              <span className="text-gray-800">{selectedCategory.name}</span>
            </>
          ) : (
            <span className="text-gray-500">{placeholder}</span>
          )}
        </div>
        <svg
          className={`w-4 h-4 text-gray-500 transition-transform duration-300 animate-spring ${isOpen ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div 
          className="absolute z-50 w-full mt-2 bg-white border border-neutral-200 rounded-lg shadow-lg max-h-60 overflow-hidden"
        >
          <div className="p-2 border-b border-neutral-200">
            <input
              ref={inputRef}
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Search categories..."
              className="w-full px-3 py-2 text-sm bg-neutral-50 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-neutral-800 placeholder:text-neutral-400"
              autoFocus
            />
          </div>

          <div className="max-h-48 overflow-y-auto">
            {/* Clear selection option */}
            <button
              onClick={() => handleSelect(null)}
              className="w-full px-3 py-2 text-left text-sm text-gray-600 hover:bg-white/20 hover:text-emerald-700 transition-all duration-200 flex items-center gap-2 rounded-lg mx-1 my-0.5 hover:scale-[1.01]"
            >
              <div className="w-3 h-3 rounded-full border border-gray-300" />
              <span>No category</span>
            </button>

            {/* Category options */}
            {filteredCategories.map((category) => (
              <button
                key={category.id}
                onClick={() => handleSelect(category.id)}
                className={`w-full px-3 py-2 text-left text-sm flex items-center gap-2 transition-all duration-200 rounded-lg mx-1 my-0.5 ${
                  category.id === value
                    ? 'bg-emerald-50 text-emerald-700 font-medium'
                    : 'hover:bg-neutral-50 text-neutral-800'
                }`}
              >
                <div
                  className="w-3 h-3 rounded-full shadow-sm"
                  style={{ backgroundColor: category.color || "#3B82F6" }}
                />
                <div>
                  <div className="font-medium">{category.name}</div>
                  {category.description && (
                    <div className="text-xs text-gray-500">{category.description}</div>
                  )}
                </div>
                {category.id === value && (
                  <span className="ml-auto text-emerald-600">✓</span>
                )}
              </button>
            ))}

            {/* Create new category option */}
            {allowCreate && onCreateCategory && (
              <>
                {filteredCategories.length === 0 && searchTerm && (
                  <div className="px-3 py-2 text-sm text-gray-500 border-t border-white/20">
                    No categories found
                  </div>
                )}
                
                {searchTerm && !categories.some(c => c.name.toLowerCase() === searchTerm.toLowerCase()) && (
                  <div className="border-t border-white/20">
                    {!showCreateForm ? (
                      <button
                        onClick={() => setShowCreateForm(true)}
                        className="w-full px-3 py-2 text-left text-sm text-emerald-600 hover:bg-white/20 hover:text-emerald-700 transition-all duration-200 flex items-center gap-2 rounded-lg mx-1 my-0.5 hover:scale-[1.01]"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Create "{searchTerm}"
                      </button>
                    ) : (
                      <div className="p-3 border-t border-white/20">
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={newCategoryName}
                            onChange={(e) => setNewCategoryName(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault();
                                handleCreateCategory();
                              } else if (e.key === "Escape") {
                                setShowCreateForm(false);
                                setNewCategoryName("");
                              }
                            }}
                            placeholder="Category name"
                            className="flex-1 px-2 py-1 text-sm bg-neutral-50 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-neutral-800 placeholder:text-neutral-400"
                            autoFocus
                          />
                          <button
                            onClick={handleCreateCategory}
                            className="px-3 py-1 text-sm bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 active:scale-95 transition-all duration-200 shadow-sm"
                          >
                            Create
                          </button>
                          <button
                            onClick={() => {
                              setShowCreateForm(false);
                              setNewCategoryName("");
                            }}
                            className="px-3 py-1 text-sm bg-neutral-100 text-neutral-700 rounded-lg hover:bg-neutral-200 transition-all duration-200"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
