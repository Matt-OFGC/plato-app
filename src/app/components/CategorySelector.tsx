"use client";

import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";

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
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [newCategoryName, setNewCategoryName] = useState("");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 });
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [mounted, setMounted] = useState(false);

  const selectedCategory = categories.find(c => c.id === value);
  
  // If we just created a category and it's not in the list yet, create a temporary display object
  const displayCategory = selectedCategory || (value ? { id: value, name: "New Category", description: null, color: null } : null);

  // Deduplicate categories by ID (in case of duplicates)
  const uniqueCategories = Array.from(
    new Map(categories.map(cat => [cat.id, cat])).values()
  );

  const filteredCategories = uniqueCategories.filter(category =>
    (category.name || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  useEffect(() => {
    setMounted(true);
  }, []);


  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + 8,
        left: rect.left,
        width: rect.width,
      });
    }
  }, [isOpen]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      // Don't close if clicking inside the dropdown or button
      if (
        dropdownRef.current && 
        !dropdownRef.current.contains(target) &&
        buttonRef.current &&
        !buttonRef.current.contains(target)
      ) {
        setIsOpen(false);
        setSearchTerm("");
        setShowCreateForm(false);
        setNewCategoryName("");
      }
    }

    // Only add listeners when dropdown is open and create form is not showing
    // (to prevent closing when user is typing in the create form)
    if (isOpen && !showCreateForm) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("scroll", handleClickOutside, true);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
        document.removeEventListener("scroll", handleClickOutside, true);
      };
    }
    // Return empty cleanup function when condition is false
    return () => {};
  }, [isOpen, showCreateForm]);

  const handleSelect = (categoryId: number | null) => {
    onChange(categoryId);
    setIsOpen(false);
    setSearchTerm("");
  };

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) {
      alert("Please enter a category name");
      return;
    }
    
    if (isCreating) return; // Prevent double submissions
    
    setIsCreating(true);
    
    try {
      console.log("Creating category:", newCategoryName.trim());
      const response = await fetch("/api/quick-create/category", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newCategoryName.trim() }),
      });

      const data = await response.json();
      console.log("Category creation response:", data);

      if (response.ok && data.success && data.category) {
        console.log("Category created successfully, ID:", data.category.id);
        
        // Call the callback if provided (for backward compatibility)
        if (onCreateCategory) {
          onCreateCategory(newCategoryName.trim());
        }
        
        // Immediately select the new category (optimistic update)
        console.log("Calling onChange with category ID:", data.category.id);
        onChange(data.category.id);
        console.log("onChange called");
        
        // Clear form state and close dropdown
        setNewCategoryName("");
        setShowCreateForm(false);
        setSearchTerm("");
        setIsOpen(false);
        setIsCreating(false);
        
        // Refresh the router to get updated categories list in the background
        router.refresh();
      } else {
        const errorMsg = data.error || data.details?.[0]?.message || "Failed to create category";
        console.error("Category creation failed:", errorMsg, data);
        alert(`Error: ${errorMsg}`);
        setIsCreating(false);
      }
    } catch (error) {
      console.error("Error creating category:", error);
      alert(`Failed to create category: ${error instanceof Error ? error.message : "Unknown error"}`);
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
        className={`w-full px-3 py-2 text-left rounded-xl flex items-center justify-between transition-all duration-200 bg-white/80 backdrop-blur-xl border border-gray-200/60 hover:bg-white hover:border-gray-300 hover:shadow-md ${
          isOpen 
            ? 'border-emerald-500 shadow-lg ring-2 ring-emerald-500/20 bg-white' 
            : ''
        }`}
      >
        <div className="flex items-center gap-2">
          {displayCategory ? (
            <>
              <div
                className="w-3 h-3 rounded-full shadow-sm"
                style={{ backgroundColor: displayCategory.color || "#3B82F6" }}
              />
              <span className="text-gray-800">{displayCategory.name}</span>
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

      {isOpen && mounted && createPortal(
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-[10000] bg-black/5"
            onClick={(e) => {
              // Only close if clicking directly on backdrop, not on dropdown content
              if (e.target === e.currentTarget) {
                setIsOpen(false);
                setSearchTerm("");
                setShowCreateForm(false);
                setNewCategoryName("");
              }
            }}
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
              ref={inputRef}
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Search categories..."
              className="w-full px-3 py-2 text-sm bg-white/60 backdrop-blur-sm border border-gray-200/50 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-gray-800 placeholder:text-gray-400"
              autoFocus
            />
          </div>

          <div className="overflow-y-auto overflow-x-visible" style={{ maxHeight: showCreateForm ? '400px' : '192px', minHeight: '100px' }}>
            {/* Clear selection option */}
            <button
              onClick={() => handleSelect(null)}
              className="w-full px-3 py-2 text-left text-sm text-gray-600 hover:bg-emerald-50 hover:text-emerald-700 transition-all duration-200 flex items-center gap-2 rounded-lg mx-1 my-0.5"
            >
              <div className="w-3 h-3 rounded-full border border-gray-300" />
              <span>No category</span>
            </button>

            {/* Category options */}
            {filteredCategories.map((category) => (
              <button
                key={category.id}
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  console.log("Category button clicked:", category.id, category.name);
                  handleSelect(category.id);
                }}
                className={`w-full px-3 py-2 text-left text-sm flex items-center gap-2 transition-all duration-200 rounded-lg mx-1 my-0.5 ${
                  category.id === value
                    ? 'bg-emerald-50 text-emerald-700 font-medium'
                    : 'hover:bg-gray-50 text-gray-800'
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
            {allowCreate && (
              <>
                {/* Show "No categories found" only when not showing create form */}
                {filteredCategories.length === 0 && searchTerm && !showCreateForm && (
                  <div className="px-3 py-2 text-sm text-gray-500 border-t border-gray-200/50">
                    No categories found
                  </div>
                )}
                
                {/* Show create form when showCreateForm is true */}
                {showCreateForm && (
                  <div className="border-t border-gray-200 mt-2 pt-2">
                    <div className="px-3 py-2">
                      <div className="text-xs font-medium text-gray-700 mb-2">Create new category</div>
                      <input
                        type="text"
                        value={newCategoryName}
                        onChange={(e) => {
                          setNewCategoryName(e.target.value);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            e.stopPropagation();
                            handleCreateCategory();
                          } else if (e.key === "Escape") {
                            setShowCreateForm(false);
                            setNewCategoryName("");
                          }
                        }}
                        placeholder="Category name"
                        className="w-full px-3 py-2 text-sm bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-gray-800 placeholder:text-gray-400 mb-2"
                        autoFocus
                      />
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleCreateCategory();
                          }}
                          disabled={isCreating}
                          className="flex-1 px-4 py-2 text-sm font-medium bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isCreating ? "Creating..." : "Create"}
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setShowCreateForm(false);
                            setNewCategoryName("");
                          }}
                          className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Show create button when there's a search term that doesn't match and form is not showing */}
                {!showCreateForm && searchTerm && !uniqueCategories.some(c => (c.name || '').toLowerCase() === searchTerm.toLowerCase()) && (
                  <div className="border-t border-gray-200/50 mt-1">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        const nameToUse = searchTerm.trim() || "New Category";
                        setNewCategoryName(nameToUse);
                        setShowCreateForm(true);
                      }}
                      className="w-full px-3 py-2 text-left text-sm text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700 transition-colors flex items-center gap-2 rounded-lg mx-1 my-0.5"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      <span>Create "{searchTerm}"</span>
                    </button>
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
