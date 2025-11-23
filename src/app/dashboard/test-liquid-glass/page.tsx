"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { InteractiveButton } from "@/components/ui/InteractiveButton";
import { SearchableSelect } from "@/components/SearchableSelect";
import { CategorySelector } from "@/components/CategorySelector";

export default function LiquidGlassShowcasePage() {
  const [selectedOption, setSelectedOption] = useState<number | undefined>();
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  const sampleOptions = [
    { id: 1, name: "Flour" },
    { id: 2, name: "Sugar" },
    { id: 3, name: "Butter" },
    { id: 4, name: "Eggs" },
    { id: 5, name: "Milk" },
  ];

  const sampleCategories = [
    { id: 1, name: "Desserts", description: "Sweet treats", color: "#EF4444" },
    { id: 2, name: "Main Courses", description: "Heartier dishes", color: "#3B82F6" },
    { id: 3, name: "Appetizers", description: "Starters", color: "#10B981" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-emerald-50/30">
      <div className="container-responsive py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Liquid Glass UI Showcase
          </h1>
          <p className="text-lg text-gray-600">
            Apple 2025 Liquid Glass Design Language with Green Theme
          </p>
        </div>

        {/* Buttons Section */}
        <section className="mb-12 liquid-glass rounded-2xl p-8 liquid-glass-reflection">
          <h2 className="text-2xl font-semibold text-gray-800 mb-6">Buttons</h2>
          <div className="flex flex-wrap gap-4">
            <Button variant="primary">Primary Button</Button>
            <Button variant="secondary">Secondary Button</Button>
            <Button variant="outline">Outline Button</Button>
            <Button variant="ghost">Ghost Button</Button>
            <Button variant="destructive">Destructive</Button>
            <Button variant="primary" loading={loading} onClick={() => {
              setLoading(true);
              setTimeout(() => setLoading(false), 2000);
            }}>
              Loading State
            </Button>
          </div>
          
          <div className="mt-6">
            <h3 className="text-lg font-medium text-gray-700 mb-4">Interactive Buttons</h3>
            <div className="flex flex-wrap gap-4">
              <InteractiveButton variant="primary">Interactive Primary</InteractiveButton>
              <InteractiveButton variant="secondary">Interactive Secondary</InteractiveButton>
              <InteractiveButton variant="outline">Interactive Outline</InteractiveButton>
            </div>
          </div>
        </section>

        {/* Selectors Section */}
        <section className="mb-12 liquid-glass rounded-2xl p-8 liquid-glass-reflection">
          <h2 className="text-2xl font-semibold text-gray-800 mb-6">Selectors</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Searchable Select
              </label>
              <SearchableSelect
                options={sampleOptions}
                value={selectedOption}
                onChange={setSelectedOption}
                placeholder="Select an ingredient..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category Selector
              </label>
              <CategorySelector
                categories={sampleCategories}
                value={selectedCategory}
                onChange={setSelectedCategory}
                placeholder="Select a category..."
                allowCreate={true}
                onCreateCategory={(name) => {
                  console.log("Creating category:", name);
                }}
              />
            </div>
          </div>
        </section>

        {/* Glass Variants Section */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold text-gray-800 mb-6">Glass Variants</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="liquid-glass-light rounded-xl p-6">
              <h3 className="font-semibold text-gray-800 mb-2">Light Glass</h3>
              <p className="text-sm text-gray-600">
                Subtle translucency for backgrounds
              </p>
            </div>
            <div className="liquid-glass rounded-xl p-6 liquid-glass-reflection">
              <h3 className="font-semibold text-gray-800 mb-2">Standard Glass</h3>
              <p className="text-sm text-gray-600">
                Standard glass surfaces with reflection
              </p>
            </div>
            <div className="liquid-glass-green rounded-xl p-6 liquid-glass-reflection">
              <h3 className="font-semibold text-gray-800 mb-2">Green Tinted Glass</h3>
              <p className="text-sm text-gray-600">
                Glass with emerald tint overlay
              </p>
            </div>
          </div>
        </section>

        {/* Interactive Elements Section */}
        <section className="mb-12 liquid-glass-heavy rounded-2xl p-8 liquid-glass-reflection">
          <h2 className="text-2xl font-semibold text-gray-800 mb-6">Interactive Elements</h2>
          <div className="space-y-4">
            <div className="liquid-glass-hover liquid-glass-glow rounded-xl p-4 cursor-pointer">
              <p className="text-gray-800">Hover over me for glass glow effect</p>
            </div>
            <div className="liquid-glass-ripple rounded-xl p-4 cursor-pointer active:scale-95 transition-transform">
              <p className="text-gray-800">Click me for ripple effect</p>
            </div>
          </div>
        </section>

        {/* Sidebar States Section */}
        <section className="mb-12 liquid-glass rounded-2xl p-8 liquid-glass-reflection">
          <h2 className="text-2xl font-semibold text-gray-800 mb-6">Sidebar Features</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="font-medium text-gray-700">Desktop Sidebar</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>• Ultra-thin translucent rail (16px)</li>
                <li>• Expands on hover to 256px</li>
                <li>• Green tint overlay</li>
                <li>• Reflection highlights</li>
                <li>• Smooth spring animations</li>
              </ul>
            </div>
            <div className="space-y-4">
              <h3 className="font-medium text-gray-700">Mobile Sidebar</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>• Full-height drawer</li>
                <li>• Rounded corners (iOS-style)</li>
                <li>• Backdrop blur</li>
                <li>• Slide-in animation</li>
                <li>• Green gradient overlay</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Responsive Information */}
        <section className="mb-12 liquid-glass rounded-2xl p-8 liquid-glass-reflection">
          <h2 className="text-2xl font-semibold text-gray-800 mb-6">Responsive Design</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div>
              <h3 className="font-medium text-gray-700 mb-2">Mobile (&lt; 768px)</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Reduced blur (20px)</li>
                <li>• Bottom sheet navigation</li>
                <li>• Full-screen modals</li>
                <li>• Larger touch targets (48px)</li>
              </ul>
            </div>
            <div>
              <h3 className="font-medium text-gray-700 mb-2">Tablet (768-1024px)</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Sidebar with labels</li>
                <li>• Optimized spacing</li>
                <li>• Standard blur (30px)</li>
                <li>• Touch-optimized controls</li>
              </ul>
            </div>
            <div>
              <h3 className="font-medium text-gray-700 mb-2">Desktop (&gt; 1024px)</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Compact sidebar</li>
                <li>• Hover expansions</li>
                <li>• Enhanced blur (30-40px)</li>
                <li>• Full feature set</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Design Principles */}
        <section className="mb-12 liquid-glass-green rounded-2xl p-8 liquid-glass-reflection">
          <h2 className="text-2xl font-semibold text-gray-800 mb-6">Design Principles</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-medium text-emerald-800 mb-3">Liquid Glass Core Features</h3>
              <ul className="space-y-2 text-sm text-gray-700">
                <li>✓ Dynamic Translucency</li>
                <li>✓ Layered Depth</li>
                <li>✓ Fluid Animations</li>
                <li>✓ Reflection Effects</li>
                <li>✓ Minimalist Aesthetics</li>
              </ul>
            </div>
            <div>
              <h3 className="font-medium text-emerald-800 mb-3">Implementation Details</h3>
              <ul className="space-y-2 text-sm text-gray-700">
                <li>✓ Spring animations (cubic-bezier)</li>
                <li>✓ Green tint overlay</li>
                <li>✓ Backdrop blur effects</li>
                <li>✓ Smooth transitions</li>
                <li>✓ Performance optimized</li>
              </ul>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}










