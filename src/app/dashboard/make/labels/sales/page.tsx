"use client";

import { useState } from "react";

export default function SalesLabelsPage() {
  const [currentView, setCurrentView] = useState("design-studio");

  return (
    <div className="h-full">
      {/* Floating Top Navigation */}
      <div className="fixed top-6 left-1/2 -translate-x-1/2 z-30">
        <div className="flex items-center gap-1 bg-white/80 backdrop-blur-xl shadow-lg border border-gray-200/50 rounded-full px-2 py-2">
          {["Design Studio", "Templates", "Select Products", "Preview", "History"].map((tab) => {
            const tabId = tab.toLowerCase().replace(/ /g, "-");
            const isActive = currentView === tabId;

            return (
              <button
                key={tab}
                onClick={() => setCurrentView(tabId)}
                className={`px-5 py-1.5 rounded-full text-sm font-medium transition-all ${
                  isActive
                    ? "bg-white shadow-md text-gray-900"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                {tab}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Content */}
      <div className="pt-24 px-8 pb-8">
        <div className="max-w-7xl mx-auto">
          {/* Page Header */}
          <div className="mb-8">
            <h1 className="text-5xl font-bold tracking-tight text-gray-900 mb-2">
              Sales Labels
            </h1>
            <p className="text-lg text-gray-500">
              Design and print beautiful product labels for your bakery
            </p>
          </div>

          {/* Content Area */}
          <div className="bg-white/70 backdrop-blur-2xl rounded-3xl border border-gray-200/60 shadow-lg p-8">
            {currentView === "design-studio" && (
              <div>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                  Design Studio
                </h2>
                <p className="text-gray-600">
                  Customize every aspect of your product labels. Choose colors,
                  fonts, layout, and what information to display.
                </p>
                <div className="mt-6 p-8 bg-gray-100/50 rounded-2xl text-center">
                  <p className="text-gray-500">
                    Label preview and customization coming soon...
                  </p>
                </div>
              </div>
            )}

            {currentView === "templates" && (
              <div>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                  Templates
                </h2>
                <p className="text-gray-600 mb-6">
                  Choose from 5 professionally designed templates or start from
                  scratch.
                </p>
                <div className="grid grid-cols-3 gap-4">
                  {[
                    "Butler's Classic",
                    "Modern Minimal",
                    "Traditional Bakery",
                    "Bold & Bright",
                    "Elegant Script",
                  ].map((name) => (
                    <div
                      key={name}
                      className="p-6 rounded-2xl border-2 border-gray-200 hover:border-blue-500 transition-all cursor-pointer bg-white"
                    >
                      <div className="h-32 bg-gray-100 rounded-xl mb-3"></div>
                      <p className="text-sm font-medium text-center text-gray-900">
                        {name}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {currentView === "select-products" && (
              <div>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                  Select Products
                </h2>
                <p className="text-gray-600">
                  Choose which recipes to print labels for and set quantities.
                </p>
              </div>
            )}

            {currentView === "preview" && (
              <div>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                  Preview
                </h2>
                <p className="text-gray-600">
                  Preview your labels before printing.
                </p>
              </div>
            )}

            {currentView === "history" && (
              <div>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                  History
                </h2>
                <p className="text-gray-600">
                  View previously generated label sheets.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
