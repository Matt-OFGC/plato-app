"use client";

import { useState } from 'react';

export default function FloatingNavMockup() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState('recipes');
  const [selectedItem, setSelectedItem] = useState('chocolate-croissant');
  const [expandedSections, setExpandedSections] = useState({
    recipes: true,
    ingredients: true,
    recent: false
  });
  const [activeTab, setActiveTab] = useState(0);

  // Page configurations with their floating nav tabs
  const pages = {
    recipes: {
      title: 'Chocolate Croissant',
      subtitle: 'Recipe Details',
      tabs: ['Overview', 'Ingredients', 'Instructions', 'Costing', 'History']
    },
    ingredients: {
      title: 'Sourdough Flour',
      subtitle: 'Ingredient Details',
      tabs: ['Details', 'Usage', 'Suppliers', 'History', 'Pricing']
    },
    costing: {
      title: 'Cost Analysis',
      subtitle: 'Menu Pricing & Margins',
      tabs: ['Dashboard', 'Recipe Costs', 'Menu Pricing', 'Trends', 'Reports']
    },
    suppliers: {
      title: 'Suppliers',
      subtitle: 'Manage Your Vendors',
      tabs: ['All Suppliers', 'Active Orders', 'Deliveries', 'Invoices', 'Analytics']
    },
    staff: {
      title: 'Team',
      subtitle: 'Staff Management',
      tabs: ['Team Members', 'Schedule', 'Timesheets', 'Payroll', 'Documents']
    },
    insight: {
      title: 'Business Insights',
      subtitle: 'Performance Analytics',
      tabs: ['Overview', 'Sales', 'Costs', 'Performance', 'Custom Reports']
    }
  };

  // Sidebar sections data
  const sidebarSections = {
    recipes: {
      items: [
        { id: 'chocolate-croissant', title: 'Chocolate Croissant', detail: '£0.85', page: 'recipes' },
        { id: 'sourdough', title: 'Sourdough Loaf', detail: '£1.20', page: 'recipes' },
        { id: 'almond-tart', title: 'Almond Tart', detail: '£2.30', page: 'recipes' },
        { id: 'pain-chocolat', title: 'Pain au Chocolat', detail: '£0.75', page: 'recipes' },
      ]
    },
    ingredients: {
      items: [
        { id: 'flour', title: 'Sourdough Flour', detail: '45kg', page: 'ingredients' },
        { id: 'butter', title: 'Butter (Unsalted)', detail: '12kg', page: 'ingredients' },
        { id: 'chocolate', title: 'Dark Chocolate', detail: '8kg', page: 'ingredients' },
      ]
    },
    recent: {
      items: [
        { id: 'recent-1', title: 'Baguette', detail: '£0.60', page: 'recipes' },
        { id: 'recent-2', title: 'Croissant Plain', detail: '£0.55', page: 'recipes' },
      ]
    }
  };

  const currentPageData = pages[currentPage as keyof typeof pages];

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const handleItemClick = (item: typeof sidebarSections.recipes.items[0]) => {
    setSelectedItem(item.id);
    setCurrentPage(item.page);
    setActiveTab(0); // Reset to first tab
    setSidebarOpen(false);
  };

  return (
    <div className="h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex overflow-hidden" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Helvetica Neue", sans-serif' }}>
      {/* Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 transition-opacity duration-300"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`fixed left-0 top-0 h-full w-80 bg-white/70 backdrop-blur-2xl border-r border-gray-200/80 flex flex-col z-50 transform transition-transform duration-300 ease-out ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        {/* Sidebar Header */}
        <div className="px-4 py-3 border-b border-gray-200/80">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-red-500 rounded-full"></div>
              <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            </div>
            <button 
              onClick={() => setSidebarOpen(false)}
              className="text-gray-500 hover:text-gray-700 p-1 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <svg className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search"
              className="w-full bg-gray-100/80 rounded-lg pl-9 pr-9 py-1.5 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
            />
            <button className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
            </button>
          </div>
        </div>

        {/* Sidebar Content */}
        <div className="flex-1 overflow-y-auto">
          {/* Recipes Section */}
          <div className="px-2 py-2">
            <button
              onClick={() => toggleSection('recipes')}
              className="w-full flex items-center justify-between px-2 py-1 text-xs font-semibold text-gray-500 hover:text-gray-700 uppercase tracking-wider transition-colors"
            >
              <span>Recipes</span>
              <div className="flex items-center gap-1">
                <span className="text-gray-400">Detail</span>
                <svg className={`w-3 h-3 transform transition-transform ${expandedSections.recipes ? 'rotate-0' : '-rotate-90'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </button>
            
            {expandedSections.recipes && (
              <div className="mt-1 space-y-0.5">
                {sidebarSections.recipes.items.map(item => (
                  <button
                    key={item.id}
                    onClick={() => handleItemClick(item)}
                    className={`w-full flex items-center justify-between px-2 py-1.5 rounded-md text-sm transition-colors ${
                      selectedItem === item.id
                        ? 'bg-blue-500/10 text-blue-600'
                        : 'text-gray-700 hover:bg-gray-100/60'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <svg className={`w-3.5 h-3.5 ${selectedItem === item.id ? 'fill-blue-500 text-blue-500' : 'text-gray-300'}`} fill="currentColor" viewBox="0 0 24 24">
                        <circle cx="12" cy="12" r="10" />
                      </svg>
                      <span className="font-medium">{item.title}</span>
                    </div>
                    <span className="text-xs text-gray-400">{item.detail}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Ingredients Section */}
          <div className="px-2 py-2">
            <button
              onClick={() => toggleSection('ingredients')}
              className="w-full flex items-center justify-between px-2 py-1 text-xs font-semibold text-gray-500 hover:text-gray-700 uppercase tracking-wider transition-colors"
            >
              <span>Ingredients</span>
              <div className="flex items-center gap-1">
                <span className="text-gray-400">Detail</span>
                <svg className={`w-3 h-3 transform transition-transform ${expandedSections.ingredients ? 'rotate-0' : '-rotate-90'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </button>
            
            {expandedSections.ingredients && (
              <div className="mt-1 space-y-0.5">
                {sidebarSections.ingredients.items.map(item => (
                  <button
                    key={item.id}
                    onClick={() => handleItemClick(item)}
                    className={`w-full flex items-center justify-between px-2 py-1.5 rounded-md text-sm transition-colors ${
                      selectedItem === item.id
                        ? 'bg-blue-500/10 text-blue-600'
                        : 'text-gray-700 hover:bg-gray-100/60'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <svg className={`w-3.5 h-3.5 ${selectedItem === item.id ? 'fill-blue-500 text-blue-500' : 'text-gray-300'}`} fill="currentColor" viewBox="0 0 24 24">
                        <circle cx="12" cy="12" r="10" />
                      </svg>
                      <span className="font-medium">{item.title}</span>
                    </div>
                    <span className="text-xs text-gray-400">{item.detail}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Recent Section */}
          <div className="px-2 py-2">
            <button
              onClick={() => toggleSection('recent')}
              className="w-full flex items-center justify-between px-2 py-1 text-xs font-semibold text-gray-500 hover:text-gray-700 uppercase tracking-wider transition-colors"
            >
              <span>Recent</span>
              <div className="flex items-center gap-1">
                <span className="text-gray-400">Detail</span>
                <svg className={`w-3 h-3 transform transition-transform ${expandedSections.recent ? 'rotate-0' : '-rotate-90'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </button>
            
            {expandedSections.recent && (
              <div className="mt-1 space-y-0.5">
                {sidebarSections.recent.items.map(item => (
                  <button
                    key={item.id}
                    onClick={() => handleItemClick(item)}
                    className={`w-full flex items-center justify-between px-2 py-1.5 rounded-md text-sm transition-colors ${
                      selectedItem === item.id
                        ? 'bg-blue-500/10 text-blue-600'
                        : 'text-gray-700 hover:bg-gray-100/60'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <svg className={`w-3.5 h-3.5 ${selectedItem === item.id ? 'fill-blue-500 text-blue-500' : 'text-gray-300'}`} fill="currentColor" viewBox="0 0 24 24">
                        <circle cx="12" cy="12" r="10" />
                      </svg>
                      <span className="font-medium">{item.title}</span>
                    </div>
                    <span className="text-xs text-gray-400">{item.detail}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Navigation Links */}
          <div className="px-2 py-2 border-t border-gray-200/80 mt-4">
            <div className="space-y-0.5">
              {[
                { id: 'dashboard', label: 'Dashboard', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
                { id: 'production', label: 'Production', icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' },
                { id: 'wholesale', label: 'Wholesale', icon: 'M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z' },
                { id: 'analytics', label: 'Analytics', icon: 'M13 7h8m0 0v8m0-8l-8 8-4-4-6 6' },
                { id: 'settings', label: 'Settings', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z' },
              ].map(nav => (
                <button
                  key={nav.id}
                  className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm text-gray-700 hover:bg-gray-100/60 transition-colors"
                >
                  <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={nav.icon} />
                  </svg>
                  <span className="font-medium">{nav.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden relative">
        {/* Floating Menu Button - Top Left */}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="absolute top-6 left-6 z-30 bg-white/80 backdrop-blur-xl shadow-lg border border-gray-200/50 p-3 rounded-full hover:bg-white hover:shadow-xl transition-all duration-200"
        >
          <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        {/* Floating Navigation Tabs - Top Center */}
        <div className="absolute top-6 left-1/2 -translate-x-1/2 z-30">
          <div className="flex items-center gap-1 bg-white/80 backdrop-blur-xl shadow-lg border border-gray-200/50 rounded-full px-2 py-2">
            {currentPageData.tabs.map((tab, index) => (
              <button
                key={index}
                onClick={() => setActiveTab(index)}
                className={`px-5 py-1.5 rounded-full text-sm font-medium transition-all duration-200 ${
                  activeTab === index
                    ? 'bg-white shadow-md text-gray-900'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Floating Action Buttons - Top Right */}
        <div className="absolute top-6 right-6 z-30 flex items-center gap-2">
          <button className="bg-white/80 backdrop-blur-xl shadow-lg border border-gray-200/50 p-3 rounded-full hover:bg-white hover:shadow-xl transition-all duration-200">
            <svg className="w-4.5 h-4.5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </button>
          <button className="bg-white/80 backdrop-blur-xl shadow-lg border border-gray-200/50 p-3 rounded-full hover:bg-white hover:shadow-xl transition-all duration-200">
            <svg className="w-4.5 h-4.5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
          </button>
          <button className="bg-blue-500 shadow-lg px-5 py-3 rounded-full hover:bg-blue-600 hover:shadow-xl transition-all duration-200 flex items-center gap-2">
            <svg className="w-4.5 h-4.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span className="text-white font-medium text-sm">New</span>
          </button>
        </div>

        {/* Content Area with proper padding for floating elements */}
        <div className="flex-1 overflow-auto pt-24 px-8 pb-8">
          <div className="max-w-5xl mx-auto">
            {/* Large Title */}
            <div className="mb-8">
              <h1 className="text-5xl font-bold text-gray-900 tracking-tight mb-2">
                {currentPageData.title}
              </h1>
              <p className="text-gray-500 text-lg">
                {currentPageData.subtitle}
              </p>
            </div>

            {/* Content Cards */}
            <div className="space-y-4">
              {/* Cost Breakdown Card */}
              <div className="bg-white/60 backdrop-blur-xl rounded-2xl border border-gray-200/60 p-8 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Cost Breakdown</h3>
                    <p className="text-4xl font-bold text-gray-900">£0.85</p>
                  </div>
                  <button className="text-blue-600 text-sm font-medium hover:text-blue-700 bg-blue-50 px-4 py-2 rounded-full transition-colors">
                    Edit
                  </button>
                </div>
                
                <div className="space-y-4">
                  <div className="flex justify-between items-center pb-4 border-b border-gray-100">
                    <span className="text-gray-600 font-medium">Butter</span>
                    <span className="text-gray-900 font-semibold">£0.24</span>
                  </div>
                  <div className="flex justify-between items-center pb-4 border-b border-gray-100">
                    <span className="text-gray-600 font-medium">Flour</span>
                    <span className="text-gray-900 font-semibold">£0.18</span>
                  </div>
                  <div className="flex justify-between items-center pb-4 border-b border-gray-100">
                    <span className="text-gray-600 font-medium">Dark Chocolate</span>
                    <span className="text-gray-900 font-semibold">£0.32</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 font-medium">Other Ingredients</span>
                    <span className="text-gray-900 font-semibold">£0.11</span>
                  </div>
                </div>
              </div>

              {/* Pricing Card */}
              <div className="bg-white/60 backdrop-blur-xl rounded-2xl border border-gray-200/60 p-8 shadow-sm hover:shadow-md transition-shadow">
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-6">Pricing</h3>
                <div className="grid grid-cols-3 gap-8">
                  <div>
                    <p className="text-xs text-gray-500 mb-2 uppercase tracking-wider">Sell Price</p>
                    <p className="text-3xl font-bold text-gray-900">£2.95</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-2 uppercase tracking-wider">Margin</p>
                    <p className="text-3xl font-bold text-green-600">71%</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-2 uppercase tracking-wider">Food Cost %</p>
                    <p className="text-3xl font-bold text-gray-900">29%</p>
                  </div>
                </div>
              </div>

              {/* Instructions Card */}
              <div className="bg-white/60 backdrop-blur-xl rounded-2xl border border-gray-200/60 p-8 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Instructions</h3>
                  <button className="text-blue-600 text-sm font-medium hover:text-blue-700 bg-blue-50 px-4 py-2 rounded-full transition-colors">
                    Edit
                  </button>
                </div>
                <div className="prose prose-sm text-gray-600 leading-relaxed space-y-3">
                  <p>1. Prepare the dough by mixing flour, water, salt, and yeast.</p>
                  <p>2. Laminate the dough with butter using multiple folds.</p>
                  <p>3. Roll out and cut into triangles.</p>
                  <p>4. Place chocolate at the wide end and roll up.</p>
                  <p>5. Proof for 2 hours at room temperature.</p>
                  <p>6. Bake at 200°C for 18-20 minutes until golden brown.</p>
                </div>
              </div>

              {/* Tab Content Example */}
              {activeTab === 1 && (
                <div className="bg-white/60 backdrop-blur-xl rounded-2xl border border-gray-200/60 p-8 shadow-sm hover:shadow-md transition-shadow">
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-6">Ingredients List</h3>
                  <div className="space-y-3">
                    {['Butter', 'Flour', 'Dark Chocolate', 'Sugar', 'Yeast'].map((ing, i) => (
                      <div key={i} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
                        <span className="text-gray-700 font-medium">{ing}</span>
                        <span className="text-gray-500 text-sm">250g</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

