"use client";

import { useState } from "react";
import Link from "next/link";
import { useAppAwareRoute } from "@/lib/hooks/useAppAwareRoute";

interface RecipeIdea {
  id: string;
  name: string;
  notes?: string;
  createdAt: Date;
  completed: boolean;
}

export function RecipeIdeasList() {
  const [ideas, setIdeas] = useState<RecipeIdea[]>(() => {
    // Load from localStorage
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('recipeIdeas');
      return saved ? JSON.parse(saved) : [];
    }
    return [];
  });
  const [isAdding, setIsAdding] = useState(false);
  const [newIdea, setNewIdea] = useState({ name: "", notes: "" });

  const saveToStorage = (updatedIdeas: RecipeIdea[]) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('recipeIdeas', JSON.stringify(updatedIdeas));
    }
    setIdeas(updatedIdeas);
  };

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const idea: RecipeIdea = {
      id: Date.now().toString(),
      name: newIdea.name,
      notes: newIdea.notes,
      createdAt: new Date(),
      completed: false,
    };
    saveToStorage([idea, ...ideas]);
    setNewIdea({ name: "", notes: "" });
    setIsAdding(false);
  };

  const handleToggle = (id: string) => {
    saveToStorage(ideas.map(idea => 
      idea.id === id ? { ...idea, completed: !idea.completed } : idea
    ));
  };

  const handleDelete = (id: string) => {
    if (confirm("Delete this recipe idea?")) {
      saveToStorage(ideas.filter(idea => idea.id !== id));
    }
  };

  const activeIdeas = ideas.filter(i => !i.completed);
  const completedIdeas = ideas.filter(i => i.completed);

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Recipe Ideas</h3>
          <p className="text-sm text-gray-600">Keep track of recipes you want to create</p>
        </div>
        {!isAdding && (
          <button
            onClick={() => setIsAdding(true)}
            className="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white px-4 py-2 rounded-lg hover:shadow-lg transition-all duration-200 flex items-center gap-2 text-sm font-medium"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Idea
          </button>
        )}
      </div>

      {/* Add Form */}
      {isAdding && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 mb-4 animate-fade-in">
          <form onSubmit={handleAdd} className="space-y-3">
            <input
              type="text"
              value={newIdea.name}
              onChange={(e) => setNewIdea({ ...newIdea, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              placeholder="Recipe name..."
              required
              autoFocus
            />
            <textarea
              value={newIdea.notes}
              onChange={(e) => setNewIdea({ ...newIdea, notes: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 resize-none"
              placeholder="Notes or ideas..."
              rows={2}
            />
            <div className="flex gap-2">
              <button
                type="submit"
                className="flex-1 bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors font-medium text-sm"
              >
                Add Idea
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsAdding(false);
                  setNewIdea({ name: "", notes: "" });
                }}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium text-sm"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Active Ideas */}
      {activeIdeas.length > 0 && (
        <div className="space-y-2 mb-4">
          {activeIdeas.map((idea) => (
            <div
              key={idea.id}
              className="bg-white border border-gray-200 rounded-lg p-4 hover:border-emerald-300 hover:shadow-sm transition-all group"
            >
              <div className="flex items-start gap-3">
                <button
                  onClick={() => handleToggle(idea.id)}
                  className="mt-0.5 w-5 h-5 rounded border-2 border-gray-300 hover:border-emerald-500 transition-colors flex-shrink-0"
                >
                </button>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900">{idea.name}</p>
                  {idea.notes && (
                    <p className="text-sm text-gray-600 mt-1">{idea.notes}</p>
                  )}
                  <p className="text-xs text-gray-400 mt-2">
                    {new Date(idea.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Link
                    href={toAppRoute(`/dashboard/recipes/new?name=${encodeURIComponent(idea.name)}`)}
                    className="p-2 text-gray-600 hover:text-emerald-600 hover:bg-emerald-50 rounded transition-colors"
                    title="Create recipe"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  </Link>
                  <button
                    onClick={() => handleDelete(idea.id)}
                    className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                    title="Delete idea"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Completed Ideas (Collapsible) */}
      {completedIdeas.length > 0 && (
        <details className="group">
          <summary className="cursor-pointer text-sm text-gray-600 hover:text-gray-900 font-medium flex items-center gap-2">
            <svg className="w-4 h-4 transition-transform group-open:rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            Completed ({completedIdeas.length})
          </summary>
          <div className="mt-3 space-y-2">
            {completedIdeas.map((idea) => (
              <div
                key={idea.id}
                className="bg-gray-50 border border-gray-200 rounded-lg p-3 flex items-start gap-3 opacity-60"
              >
                <button
                  onClick={() => handleToggle(idea.id)}
                  className="mt-0.5 w-5 h-5 rounded border-2 border-emerald-500 bg-emerald-500 flex-shrink-0 flex items-center justify-center"
                >
                  <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </button>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-700 line-through">{idea.name}</p>
                  {idea.notes && (
                    <p className="text-sm text-gray-500 mt-1">{idea.notes}</p>
                  )}
                </div>
                <button
                  onClick={() => handleDelete(idea.id)}
                  className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        </details>
      )}

      {activeIdeas.length === 0 && !isAdding && (
        <div className="text-center py-12 text-gray-500">
          <svg className="w-16 h-16 text-gray-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
          <p className="text-sm font-medium mb-2">No recipe ideas yet</p>
          <p className="text-xs text-gray-400 mb-4">Jot down ideas for recipes you want to create</p>
          <button
            onClick={() => setIsAdding(true)}
            className="text-emerald-600 hover:text-emerald-700 text-sm font-medium"
          >
            Add your first idea →
          </button>
        </div>
      )}
    </div>
  );
}

