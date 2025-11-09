"use client";

import { useState } from "react";

export default function NewDesignMockPage() {
  const [selectedTab, setSelectedTab] = useState("overview");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Modern Top Navigation */}
      <nav className="bg-white border-b border-neutral-200/60 sticky top-0 z-50 backdrop-blur-xl bg-white/95">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-lg flex items-center justify-center shadow-sm">
                <span className="text-white font-bold text-sm">P</span>
              </div>
              <span className="text-xl font-semibold text-neutral-900">Plato</span>
            </div>

            {/* Navigation Links */}
            <div className="hidden md:flex items-center gap-1">
              {["Dashboard", "Recipes", "Ingredients", "Production"].map((item) => (
                <a
                  key={item}
                  href="#"
                  className="px-4 py-2 text-sm font-medium text-neutral-700 hover:text-emerald-600 hover:bg-neutral-50 rounded-lg transition-colors"
                >
                  {item}
                </a>
              ))}
            </div>

            {/* User Menu */}
            <div className="flex items-center gap-3">
              <button className="p-2 text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 rounded-lg transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
              </button>
              <div className="w-8 h-8 bg-gradient-to-br from-emerald-400 to-emerald-500 rounded-full flex items-center justify-center text-white text-sm font-medium shadow-sm">
                JD
              </div>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-neutral-900 mb-2">Dashboard</h1>
          <p className="text-neutral-600">Welcome back! Here's what's happening today.</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[
            { label: "Today's Production", value: "24", change: "+12%", color: "emerald" },
            { label: "Active Recipes", value: "142", change: "+3", color: "blue" },
            { label: "Pending Tasks", value: "8", change: "-2", color: "amber" },
            { label: "Team Members", value: "12", change: "+1", color: "purple" },
          ].map((stat) => (
            <div
              key={stat.label}
              className="bg-white rounded-xl p-6 border border-neutral-200/60 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-neutral-600">{stat.label}</p>
                <div className={`w-2 h-2 rounded-full bg-${stat.color}-500`} />
              </div>
              <div className="flex items-baseline gap-2">
                <p className="text-3xl font-bold text-neutral-900">{stat.value}</p>
                <span className={`text-sm font-medium ${
                  stat.change.startsWith("+") ? "text-emerald-600" : "text-neutral-500"
                }`}>
                  {stat.change}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Main Content Area */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Primary Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Today's Production Card */}
            <div className="bg-white rounded-xl border border-neutral-200/60 shadow-sm">
              <div className="p-6 border-b border-neutral-200/60">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-neutral-900">Today's Production</h2>
                  <button className="text-sm font-medium text-emerald-600 hover:text-emerald-700">
                    View All
                  </button>
                </div>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {[
                    { name: "Chocolate Chip Cookies", quantity: "120", status: "completed" },
                    { name: "Sourdough Bread", quantity: "45", status: "in-progress" },
                    { name: "Croissants", quantity: "60", status: "pending" },
                  ].map((item) => (
                    <div
                      key={item.name}
                      className="flex items-center justify-between p-4 bg-neutral-50 rounded-lg hover:bg-neutral-100 transition-colors"
                    >
                      <div>
                        <p className="font-medium text-neutral-900">{item.name}</p>
                        <p className="text-sm text-neutral-600">{item.quantity} units</p>
                      </div>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          item.status === "completed"
                            ? "bg-emerald-100 text-emerald-700"
                            : item.status === "in-progress"
                            ? "bg-blue-100 text-blue-700"
                            : "bg-neutral-200 text-neutral-700"
                        }`}
                      >
                        {item.status === "completed" ? "Done" : item.status === "in-progress" ? "In Progress" : "Pending"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-xl border border-neutral-200/60 shadow-sm p-6">
              <h2 className="text-lg font-semibold text-neutral-900 mb-4">Quick Actions</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { label: "New Recipe", icon: "📝", color: "emerald" },
                  { label: "Add Ingredient", icon: "🥘", color: "blue" },
                  { label: "Schedule", icon: "📅", color: "amber" },
                  { label: "Reports", icon: "📊", color: "purple" },
                ].map((action) => (
                  <button
                    key={action.label}
                    className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 border-transparent hover:border-${action.color}-200 hover:bg-${action.color}-50 transition-all group`}
                  >
                    <span className="text-2xl">{action.icon}</span>
                    <span className="text-sm font-medium text-neutral-700 group-hover:text-neutral-900">
                      {action.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Recent Activity */}
            <div className="bg-white rounded-xl border border-neutral-200/60 shadow-sm">
              <div className="p-6 border-b border-neutral-200/60">
                <h2 className="text-lg font-semibold text-neutral-900">Recent Activity</h2>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {[
                    { action: "Recipe updated", item: "Chocolate Cake", time: "2m ago" },
                    { action: "Ingredient added", item: "Vanilla Extract", time: "15m ago" },
                    { action: "Production started", item: "Bread Batch #45", time: "1h ago" },
                  ].map((activity, idx) => (
                    <div key={idx} className="flex gap-3">
                      <div className="w-2 h-2 rounded-full bg-emerald-500 mt-2 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-neutral-900">{activity.action}</p>
                        <p className="text-sm text-neutral-600 truncate">{activity.item}</p>
                        <p className="text-xs text-neutral-500 mt-1">{activity.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Upcoming Tasks */}
            <div className="bg-white rounded-xl border border-neutral-200/60 shadow-sm">
              <div className="p-6 border-b border-neutral-200/60">
                <h2 className="text-lg font-semibold text-neutral-900">Upcoming Tasks</h2>
              </div>
              <div className="p-6">
                <div className="space-y-3">
                  {[
                    { task: "Review recipe costs", time: "Today, 2:00 PM" },
                    { task: "Order ingredients", time: "Tomorrow, 9:00 AM" },
                    { task: "Team meeting", time: "Tomorrow, 3:00 PM" },
                  ].map((item, idx) => (
                    <div
                      key={idx}
                      className="p-3 bg-neutral-50 rounded-lg hover:bg-neutral-100 transition-colors cursor-pointer"
                    >
                      <p className="text-sm font-medium text-neutral-900">{item.task}</p>
                      <p className="text-xs text-neutral-600 mt-1">{item.time}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Design System Showcase */}
        <div className="bg-white rounded-xl border border-neutral-200/60 shadow-sm p-8 mb-8">
          <h2 className="text-2xl font-bold text-neutral-900 mb-6">Design System Showcase</h2>

          {/* Buttons */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-neutral-900 mb-4">Buttons</h3>
            <div className="flex flex-wrap gap-3">
              <button className="px-4 py-2 bg-emerald-600 text-white font-medium rounded-lg hover:bg-emerald-700 active:scale-95 transition-all shadow-sm hover:shadow-md">
                Primary Button
              </button>
              <button className="px-4 py-2 bg-white text-neutral-700 font-medium rounded-lg border border-neutral-300 hover:bg-neutral-50 active:scale-95 transition-all shadow-sm">
                Secondary Button
              </button>
              <button className="px-4 py-2 bg-neutral-100 text-neutral-700 font-medium rounded-lg hover:bg-neutral-200 active:scale-95 transition-all">
                Tertiary Button
              </button>
              <button className="px-4 py-2 text-emerald-600 font-medium rounded-lg hover:bg-emerald-50 active:scale-95 transition-all">
                Text Button
              </button>
            </div>
          </div>

          {/* Cards */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-neutral-900 mb-4">Cards</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-6 bg-neutral-50 rounded-lg border border-neutral-200/60">
                <p className="font-medium text-neutral-900 mb-2">Card Style 1</p>
                <p className="text-sm text-neutral-600">Subtle background with border</p>
              </div>
              <div className="p-6 bg-white rounded-lg border border-neutral-200/60 shadow-sm">
                <p className="font-medium text-neutral-900 mb-2">Card Style 2</p>
                <p className="text-sm text-neutral-600">White background with shadow</p>
              </div>
              <div className="p-6 bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-lg border border-emerald-200/60">
                <p className="font-medium text-neutral-900 mb-2">Card Style 3</p>
                <p className="text-sm text-neutral-600">Gradient background</p>
              </div>
            </div>
          </div>

          {/* Form Elements */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-neutral-900 mb-4">Form Elements</h3>
            <div className="max-w-md space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Input Field
                </label>
                <input
                  type="text"
                  placeholder="Enter text..."
                  className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Select Dropdown
                </label>
                <select className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all bg-white">
                  <option>Option 1</option>
                  <option>Option 2</option>
                  <option>Option 3</option>
                </select>
              </div>
            </div>
          </div>

          {/* Colors */}
          <div>
            <h3 className="text-lg font-semibold text-neutral-900 mb-4">Color Palette</h3>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {[
                { name: "Emerald", class: "bg-emerald-600", text: "text-emerald-600" },
                { name: "Blue", class: "bg-blue-600", text: "text-blue-600" },
                { name: "Amber", class: "bg-amber-600", text: "text-amber-600" },
                { name: "Purple", class: "bg-purple-600", text: "text-purple-600" },
                { name: "Neutral", class: "bg-neutral-600", text: "text-neutral-600" },
              ].map((color) => (
                <div key={color.name} className="text-center">
                  <div className={`w-full h-16 ${color.class} rounded-lg mb-2 shadow-sm`} />
                  <p className="text-sm font-medium text-neutral-900">{color.name}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Typography */}
        <div className="bg-white rounded-xl border border-neutral-200/60 shadow-sm p-8">
          <h2 className="text-2xl font-bold text-neutral-900 mb-6">Typography</h2>
          <div className="space-y-4">
            <div>
              <h1 className="text-4xl font-bold text-neutral-900 mb-2">Heading 1</h1>
              <p className="text-sm text-neutral-600">Bold, 36px, for main page titles</p>
            </div>
            <div>
              <h2 className="text-3xl font-semibold text-neutral-900 mb-2">Heading 2</h2>
              <p className="text-sm text-neutral-600">Semibold, 30px, for section headers</p>
            </div>
            <div>
              <h3 className="text-xl font-semibold text-neutral-900 mb-2">Heading 3</h3>
              <p className="text-sm text-neutral-600">Semibold, 20px, for subsection headers</p>
            </div>
            <div>
              <p className="text-base text-neutral-700 mb-2">
                Body text - Regular, 16px, for main content. Clean and readable with proper line height for optimal reading experience.
              </p>
              <p className="text-sm text-neutral-600">
                Small text - Regular, 14px, for secondary information and captions.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}






