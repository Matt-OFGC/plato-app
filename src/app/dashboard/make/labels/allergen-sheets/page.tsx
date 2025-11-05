"use client";

import { useState } from "react";

export default function AllergenSheetsPage() {
  const [currentView, setCurrentView] = useState("recent-updates");

  return (
    <div className="h-full">
      {/* Floating Top Navigation */}
      <div className="fixed top-6 left-1/2 -translate-x-1/2 z-30">
        <div className="flex items-center gap-1 bg-white/80 backdrop-blur-xl shadow-lg border border-gray-200/50 rounded-full px-2 py-2">
          {["Recent Updates", "Select Recipes", "Sheet Style", "Preview", "History"].map(
            (tab) => {
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
            }
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="pt-24 px-8 pb-8">
        <div className="max-w-7xl mx-auto">
          {/* Page Header */}
          <div className="mb-8">
            <h1 className="text-5xl font-bold tracking-tight text-gray-900 mb-2">
              Allergen Sheets
            </h1>
            <p className="text-lg text-gray-500">
              Generate comprehensive allergen information sheets for legal compliance
            </p>
          </div>

          {/* Content Area */}
          <div className="bg-white/70 backdrop-blur-2xl rounded-3xl border border-gray-200/60 shadow-lg p-8">
            {currentView === "recent-updates" && (
              <div>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                  Recent Updates
                </h2>
                <p className="text-gray-600 mb-6">
                  Track ingredient changes that affect allergen information.
                  Stay compliant with food safety regulations.
                </p>
                <div className="space-y-3">
                  <div className="p-4 rounded-xl bg-red-50 border border-red-200">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                        <svg
                          className="w-5 h-5 text-red-600"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                          />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <h3 className="font-semibold text-gray-900">
                            Allergen Change Detected
                          </h3>
                          <span className="text-xs text-gray-500">2 days ago</span>
                        </div>
                        <p className="text-sm text-gray-700 mb-2">
                          Recipe: <strong>Sourdough Loaf</strong> - Supplier changed for
                          "Plain Flour" now contains <strong>Celery</strong>
                        </p>
                        <button className="text-sm text-red-600 hover:text-red-700 font-medium">
                          Update allergen sheets →
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-gray-50 border border-gray-200">
                    <div className="text-center text-sm text-gray-500">
                      No other recent changes detected
                    </div>
                  </div>
                </div>
              </div>
            )}

            {currentView === "select-recipes" && (
              <div>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                  Select Recipes
                </h2>
                <p className="text-gray-600">
                  Choose which recipes to include in your allergen information sheets.
                </p>
              </div>
            )}

            {currentView === "sheet-style" && (
              <div>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                  Sheet Style
                </h2>
                <p className="text-gray-600 mb-6">
                  Choose from 3 different allergen sheet formats:
                </p>
                <div className="grid grid-cols-3 gap-4">
                  {[
                    {
                      name: "Full Detail",
                      desc: "Legal compliance - complete information",
                    },
                    {
                      name: "Simple Reference",
                      desc: "Quick lookup format",
                    },
                    {
                      name: "Visual Matrix",
                      desc: "At-a-glance checkboxes",
                    },
                  ].map((style) => (
                    <div
                      key={style.name}
                      className="p-6 rounded-2xl border-2 border-gray-200 hover:border-blue-500 transition-all cursor-pointer bg-white"
                    >
                      <div className="h-32 bg-gray-100 rounded-xl mb-3"></div>
                      <p className="text-sm font-semibold text-gray-900 mb-1">
                        {style.name}
                      </p>
                      <p className="text-xs text-gray-500">{style.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {currentView === "preview" && (
              <div>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                  Preview
                </h2>
                <p className="text-gray-600">
                  Preview your allergen sheets before printing.
                </p>
              </div>
            )}

            {currentView === "history" && (
              <div>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                  History
                </h2>
                <p className="text-gray-600">
                  View previously generated allergen information sheets.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
