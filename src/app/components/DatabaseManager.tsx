"use client";

import { useState } from "react";
import { Ingredient, Recipe, Supplier, Category, ShelfLifeOption, StorageOption } from "@/generated/prisma";

// Serialized types for Client Components (Decimal -> number)
type SerializedIngredient = Omit<Ingredient, 'packQuantity' | 'packPrice' | 'densityGPerMl'> & {
  packQuantity: number;
  packPrice: number;
  densityGPerMl: number | null;
};

type SerializedSupplier = Omit<Supplier, 'minimumOrder'> & {
  minimumOrder: number | null;
};

interface DatabaseManagerProps {
  ingredients: (SerializedIngredient & { supplierRef?: SerializedSupplier | null })[];
  recipes: (Recipe & { 
    categoryRef?: Category | null;
    storageRef?: StorageOption | null;
    shelfLifeRef?: ShelfLifeOption | null;
  })[];
  suppliers: SerializedSupplier[];
  categories: Category[];
  shelfLifeOptions: ShelfLifeOption[];
  storageOptions: StorageOption[];
}

type TabType = 'ingredients' | 'recipes' | 'suppliers' | 'categories' | 'options';

export function DatabaseManager({ 
  ingredients: initialIngredients, 
  recipes: initialRecipes, 
  suppliers: initialSuppliers, 
  categories: initialCategories, 
  shelfLifeOptions: initialShelfLifeOptions, 
  storageOptions: initialStorageOptions 
}: DatabaseManagerProps) {
  const [activeTab, setActiveTab] = useState<TabType>('ingredients');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedItems, setSelectedItems] = useState<Set<number>>(new Set());
  const [deleting, setDeleting] = useState(false);
  
  // Local state for data after deletion
  const [ingredients, setIngredients] = useState(initialIngredients);
  const [recipes, setRecipes] = useState(initialRecipes);
  const [suppliers, setSuppliers] = useState(initialSuppliers);
  const [categories, setCategories] = useState(initialCategories);
  const [shelfLifeOptions, setShelfLifeOptions] = useState(initialShelfLifeOptions);
  const [storageOptions, setStorageOptions] = useState(initialStorageOptions);

  const tabs = [
    { id: 'ingredients' as TabType, label: 'Ingredients', count: ingredients.length },
    { id: 'recipes' as TabType, label: 'Recipes', count: recipes.length },
    { id: 'suppliers' as TabType, label: 'Suppliers', count: suppliers.length },
    { id: 'categories' as TabType, label: 'Categories', count: categories.length },
    { id: 'options' as TabType, label: 'Options', count: shelfLifeOptions.length + storageOptions.length },
  ];

  const filteredIngredients = ingredients.filter(ing => 
    ing.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ing.supplierRef?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ing.supplier?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredRecipes = recipes.filter(recipe =>
    recipe.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    recipe.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    recipe.categoryRef?.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredSuppliers = suppliers.filter(supplier =>
    supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    supplier.contactName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredCategories = categories.filter(category =>
    category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    category.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatCurrency = (amount: number, currency: string = 'GBP') => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-GB', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(date));
  };

  const toggleSelectAll = () => {
    if (activeTab === 'ingredients') {
      if (selectedItems.size === filteredIngredients.length) {
        setSelectedItems(new Set());
      } else {
        setSelectedItems(new Set(filteredIngredients.map(i => i.id)));
      }
    } else if (activeTab === 'recipes') {
      if (selectedItems.size === filteredRecipes.length) {
        setSelectedItems(new Set());
      } else {
        setSelectedItems(new Set(filteredRecipes.map(r => r.id)));
      }
    } else if (activeTab === 'suppliers') {
      if (selectedItems.size === filteredSuppliers.length) {
        setSelectedItems(new Set());
      } else {
        setSelectedItems(new Set(filteredSuppliers.map(s => s.id)));
      }
    } else if (activeTab === 'categories') {
      if (selectedItems.size === filteredCategories.length) {
        setSelectedItems(new Set());
      } else {
        setSelectedItems(new Set(filteredCategories.map(c => c.id)));
      }
    }
  };

  const toggleSelectItem = (id: number) => {
    const newSelected = new Set(selectedItems);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedItems(newSelected);
  };

  const handleBulkDelete = async () => {
    if (selectedItems.size === 0) return;
    
    const confirmMessage = `Are you sure you want to delete ${selectedItems.size} ${activeTab}? This action cannot be undone.`;
    if (!confirm(confirmMessage)) return;

    setDeleting(true);
    try {
      const response = await fetch(`/api/${activeTab}/bulk-delete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: Array.from(selectedItems) }),
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.error || 'Failed to delete items');
        return;
      }

      // Update local state to remove deleted items
      if (activeTab === 'ingredients') {
        setIngredients(ingredients.filter(i => !selectedItems.has(i.id)));
      } else if (activeTab === 'recipes') {
        setRecipes(recipes.filter(r => !selectedItems.has(r.id)));
      } else if (activeTab === 'suppliers') {
        setSuppliers(suppliers.filter(s => !selectedItems.has(s.id)));
      } else if (activeTab === 'categories') {
        setCategories(categories.filter(c => !selectedItems.has(c.id)));
      }

      setSelectedItems(new Set());
      alert(data.message || `Successfully deleted items`);
      
      // Refresh the page if some items couldn't be deleted
      if (data.skippedCount && data.skippedCount > 0) {
        window.location.reload();
      }
    } catch (error) {
      console.error('Bulk delete error:', error);
      alert('Failed to delete items. Please try again.');
    } finally {
      setDeleting(false);
    }
  };

  // Clear selection when changing tabs
  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    setSelectedItems(new Set());
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold text-gray-900">Database Management</h2>
        <div className="text-sm text-gray-500">
          View and manage your data
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <input
          type="text"
          placeholder="Search across all data..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
        />
        <svg className="absolute right-3 top-2.5 h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-emerald-500 text-emerald-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label} ({tab.count})
            </button>
          ))}
        </nav>
      </div>

      {/* Bulk Actions Bar */}
      {selectedItems.size > 0 && activeTab !== 'options' && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-sm font-medium text-blue-900">
              {selectedItems.size} {activeTab} selected
            </span>
          </div>
          <button
            onClick={handleBulkDelete}
            disabled={deleting}
            className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            {deleting ? 'Deleting...' : 'Delete Selected'}
          </button>
        </div>
      )}

      {/* Content */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {activeTab === 'ingredients' && (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 w-12">
                    <input
                      type="checkbox"
                      checked={filteredIngredients.length > 0 && selectedItems.size === filteredIngredients.length}
                      onChange={toggleSelectAll}
                      className="h-4 w-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500 cursor-pointer"
                    />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Supplier</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pack Size</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Allergens</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredIngredients.map((ingredient) => (
                  <tr key={ingredient.id} className={`hover:bg-gray-50 ${selectedItems.has(ingredient.id) ? 'bg-blue-50' : ''}`}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={selectedItems.has(ingredient.id)}
                        onChange={() => toggleSelectItem(ingredient.id)}
                        className="h-4 w-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500 cursor-pointer"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{ingredient.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {ingredient.supplierRef?.name || ingredient.supplier || 'No supplier'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {Number(ingredient.packQuantity)} {ingredient.packUnit}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {formatCurrency(Number(ingredient.packPrice), ingredient.currency)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {ingredient.allergens.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {ingredient.allergens.map((allergen: string, index: number) => (
                              <span key={index} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                                {allergen}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-gray-400">None</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(ingredient.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredIngredients.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                {searchTerm ? 'No ingredients found matching your search.' : 'No ingredients found.'}
              </div>
            )}
          </div>
        )}

        {activeTab === 'recipes' && (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 w-12">
                    <input
                      type="checkbox"
                      checked={filteredRecipes.length > 0 && selectedItems.size === filteredRecipes.length}
                      onChange={toggleSelectAll}
                      className="h-4 w-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500 cursor-pointer"
                    />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Yield</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bake Time</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Storage</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredRecipes.map((recipe) => (
                  <tr key={recipe.id} className={`hover:bg-gray-50 ${selectedItems.has(recipe.id) ? 'bg-blue-50' : ''}`}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={selectedItems.has(recipe.id)}
                        onChange={() => toggleSelectItem(recipe.id)}
                        className="h-4 w-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500 cursor-pointer"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{recipe.name}</div>
                      {recipe.description && (
                        <div className="text-sm text-gray-500 truncate max-w-xs">{recipe.description}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {recipe.categoryRef?.name || recipe.category || 'No category'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {Number(recipe.yieldQuantity)} {recipe.yieldUnit}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {recipe.bakeTime ? `${recipe.bakeTime} min` : 'N/A'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {recipe.storageRef?.name || recipe.storage || 'N/A'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(recipe.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredRecipes.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                {searchTerm ? 'No recipes found matching your search.' : 'No recipes found.'}
              </div>
            )}
          </div>
        )}

        {activeTab === 'suppliers' && (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 w-12">
                    <input
                      type="checkbox"
                      checked={filteredSuppliers.length > 0 && selectedItems.size === filteredSuppliers.length}
                      onChange={toggleSelectAll}
                      className="h-4 w-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500 cursor-pointer"
                    />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Delivery Days</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Website</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredSuppliers.map((supplier) => (
                  <tr key={supplier.id} className={`hover:bg-gray-50 ${selectedItems.has(supplier.id) ? 'bg-blue-50' : ''}`}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={selectedItems.has(supplier.id)}
                        onChange={() => toggleSelectItem(supplier.id)}
                        className="h-4 w-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500 cursor-pointer"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{supplier.name}</div>
                      {supplier.description && (
                        <div className="text-sm text-gray-500">{supplier.description}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{supplier.contactName || 'N/A'}</div>
                      {supplier.email && (
                        <div className="text-sm text-gray-500">{supplier.email}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {supplier.deliveryDays.length > 0 ? supplier.deliveryDays.join(', ') : 'N/A'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {supplier.website ? (
                          <a href={supplier.website} target="_blank" rel="noopener noreferrer" className="text-emerald-600 hover:text-emerald-800">
                            {supplier.website}
                          </a>
                        ) : 'N/A'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(supplier.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredSuppliers.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                {searchTerm ? 'No suppliers found matching your search.' : 'No suppliers found.'}
              </div>
            )}
          </div>
        )}

        {activeTab === 'categories' && (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 w-12">
                    <input
                      type="checkbox"
                      checked={filteredCategories.length > 0 && selectedItems.size === filteredCategories.length}
                      onChange={toggleSelectAll}
                      className="h-4 w-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500 cursor-pointer"
                    />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Color</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredCategories.map((category) => (
                  <tr key={category.id} className={`hover:bg-gray-50 ${selectedItems.has(category.id) ? 'bg-blue-50' : ''}`}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={selectedItems.has(category.id)}
                        onChange={() => toggleSelectItem(category.id)}
                        className="h-4 w-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500 cursor-pointer"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{category.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        {category.color && (
                          <div 
                            className="w-4 h-4 rounded-full border border-gray-300" 
                            style={{ backgroundColor: category.color }}
                          />
                        )}
                        <span className="text-sm text-gray-900">{category.color || 'No color'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{category.description || 'No description'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(category.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredCategories.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                {searchTerm ? 'No categories found matching your search.' : 'No categories found.'}
              </div>
            )}
          </div>
        )}

        {activeTab === 'options' && (
          <div className="p-6">
            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Shelf Life Options</h3>
                <div className="space-y-2">
                  {shelfLifeOptions.map((option) => (
                    <div key={option.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <div>
                        <div className="font-medium text-gray-900">{option.name}</div>
                        {option.description && (
                          <div className="text-sm text-gray-500">{option.description}</div>
                        )}
                      </div>
                      <div className="text-sm text-gray-500">
                        {formatDate(option.createdAt)}
                      </div>
                    </div>
                  ))}
                  {shelfLifeOptions.length === 0 && (
                    <div className="text-center py-4 text-gray-500">No shelf life options</div>
                  )}
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Storage Options</h3>
                <div className="space-y-2">
                  {storageOptions.map((option) => (
                    <div key={option.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        {option.icon && (
                          <div className="w-6 h-6 text-gray-600">
                            <svg viewBox="0 0 24 24" fill="currentColor">
                              <path d={option.icon} />
                            </svg>
                          </div>
                        )}
                        <div>
                          <div className="font-medium text-gray-900">{option.name}</div>
                          {option.description && (
                            <div className="text-sm text-gray-500">{option.description}</div>
                          )}
                        </div>
                      </div>
                      <div className="text-sm text-gray-500">
                        {formatDate(option.createdAt)}
                      </div>
                    </div>
                  ))}
                  {storageOptions.length === 0 && (
                    <div className="text-center py-4 text-gray-500">No storage options</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="text-2xl font-bold text-gray-900">{ingredients.length}</div>
          <div className="text-sm text-gray-500">Ingredients</div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="text-2xl font-bold text-gray-900">{recipes.length}</div>
          <div className="text-sm text-gray-500">Recipes</div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="text-2xl font-bold text-gray-900">{suppliers.length}</div>
          <div className="text-sm text-gray-500">Suppliers</div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="text-2xl font-bold text-gray-900">{categories.length}</div>
          <div className="text-sm text-gray-500">Categories</div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="text-2xl font-bold text-gray-900">{shelfLifeOptions.length + storageOptions.length}</div>
          <div className="text-sm text-gray-500">Options</div>
        </div>
      </div>
    </div>
  );
}
