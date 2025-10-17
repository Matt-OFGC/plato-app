"use client";

import { useState, useRef, useEffect } from "react";

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
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [newOptionName, setNewOptionName] = useState("");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedOption = storageOptions.find(o => o.id === value);

  const filteredOptions = storageOptions.filter(option =>
    option.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchTerm("");
        setShowCreateForm(false);
        setNewOptionName("");
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (optionId: number | null) => {
    onChange(optionId);
    setIsOpen(false);
    setSearchTerm("");
  };

  const handleCreateOption = () => {
    if (newOptionName.trim() && onCreateStorage) {
      onCreateStorage(newOptionName.trim());
      setNewOptionName("");
      setShowCreateForm(false);
      setSearchTerm("");
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
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-3 py-2 text-left border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent bg-white flex items-center justify-between"
      >
        <div className="flex items-center gap-2">
          {selectedOption ? (
            <>
              {selectedOption.icon && (
                <svg className="w-4 h-4 text-[var(--muted-foreground)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={selectedOption.icon} />
                </svg>
              )}
              <span className="text-[var(--foreground)]">{selectedOption.name}</span>
            </>
          ) : (
            <span className="text-[var(--muted-foreground)]">{placeholder}</span>
          )}
        </div>
        <svg
          className={`w-4 h-4 text-[var(--muted-foreground)] transition-transform ${isOpen ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-hidden">
          <div className="p-2 border-b border-gray-200">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Search options..."
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
              autoFocus
            />
          </div>

          <div className="max-h-48 overflow-y-auto">
            {/* Clear selection option */}
            <button
              onClick={() => handleSelect(null)}
              className="w-full px-3 py-2 text-left text-sm text-[var(--muted-foreground)] hover:bg-gray-50 flex items-center gap-2"
            >
              <span>No storage</span>
            </button>

            {/* Option items */}
            {filteredOptions.map((option) => (
              <button
                key={option.id}
                onClick={() => handleSelect(option.id)}
                className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
              >
                {option.icon && (
                  <svg className="w-4 h-4 text-[var(--muted-foreground)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={option.icon} />
                  </svg>
                )}
                <div>
                  <div className="font-medium text-[var(--foreground)]">{option.name}</div>
                  {option.description && (
                    <div className="text-xs text-[var(--muted-foreground)]">{option.description}</div>
                  )}
                </div>
              </button>
            ))}

            {/* Create new option */}
            {allowCreate && onCreateStorage && (
              <>
                {filteredOptions.length === 0 && searchTerm && (
                  <div className="px-3 py-2 text-sm text-[var(--muted-foreground)] border-t border-gray-200">
                    No options found
                  </div>
                )}
                
                {searchTerm && !storageOptions.some(o => o.name.toLowerCase() === searchTerm.toLowerCase()) && (
                  <div className="border-t border-gray-200">
                    {!showCreateForm ? (
                      <button
                        onClick={() => setShowCreateForm(true)}
                        className="w-full px-3 py-2 text-left text-sm text-[var(--primary)] hover:bg-gray-50 flex items-center gap-2"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Create "{searchTerm}"
                      </button>
                    ) : (
                      <div className="p-3 border-t border-gray-200">
                        <div className="flex gap-2">
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
                            placeholder="Option name"
                            className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-[var(--primary)] focus:border-transparent"
                            autoFocus
                          />
                          <button
                            onClick={handleCreateOption}
                            className="px-3 py-1 text-sm bg-[var(--primary)] text-[var(--primary-foreground)] rounded hover:bg-[var(--accent)] transition-colors"
                          >
                            Create
                          </button>
                          <button
                            onClick={() => {
                              setShowCreateForm(false);
                              setNewOptionName("");
                            }}
                            className="px-3 py-1 text-sm bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors"
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
