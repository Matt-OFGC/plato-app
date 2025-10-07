"use client";

import { useState } from "react";

export function UnitConversionHelp() {
  const [isOpen, setIsOpen] = useState(false);

  const unitExamples = [
    {
      category: "Weight/Mass",
      units: ["g", "kg", "mg", "lb", "oz"],
      examples: [
        "1 kg = 1000 g",
        "1 lb = 453.59 g", 
        "1 oz = 28.35 g",
        "1 mg = 0.001 g"
      ]
    },
    {
      category: "Volume (Liquid)",
      units: ["ml", "l", "tsp", "tbsp", "cup", "floz", "pint", "quart", "gallon"],
      examples: [
        "1 l = 1000 ml",
        "1 cup = 250 ml",
        "1 tbsp = 15 ml",
        "1 tsp = 5 ml",
        "1 floz = 28.41 ml (UK)",
        "1 pint = 568.26 ml (UK)",
        "1 gallon = 4546.09 ml (UK)"
      ]
    },
    {
      category: "Count",
      units: ["each"],
      examples: [
        "Used for discrete items like eggs, apples, etc."
      ]
    }
  ];

  const conversionExamples = [
    {
      from: "5 kg block of cheddar cheese",
      to: "249 g needed for recipe",
      calculation: "£31.45 ÷ 5000g = £0.00629 per gram",
      result: "249g × £0.00629 = £1.57"
    },
    {
      from: "1 cup olive oil (250ml)",
      to: "2 tbsp needed for recipe",
      calculation: "£8.50 ÷ 250ml = £0.034 per ml",
      result: "30ml × £0.034 = £1.02"
    },
    {
      from: "1 lb butter (453.59g)",
      to: "100g needed for recipe", 
      calculation: "£3.20 ÷ 453.59g = £0.00705 per gram",
      result: "100g × £0.00705 = £0.71"
    }
  ];

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 text-blue-800 font-medium hover:text-blue-900 transition-colors"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        Unit Conversion Help
        <svg 
          className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="mt-4 space-y-6">
          <div>
            <h3 className="text-lg font-semibold text-blue-900 mb-3">Supported Units</h3>
            <div className="grid gap-4 md:grid-cols-3">
              {unitExamples.map((category) => (
                <div key={category.category} className="bg-white rounded-lg p-4 border border-blue-100">
                  <h4 className="font-medium text-blue-900 mb-2">{category.category}</h4>
                  <div className="flex flex-wrap gap-1 mb-2">
                    {category.units.map((unit) => (
                      <span key={unit} className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm">
                        {unit}
                      </span>
                    ))}
                  </div>
                  <div className="text-sm text-gray-600">
                    {category.examples.map((example, idx) => (
                      <div key={idx}>{example}</div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-blue-900 mb-3">Real Examples</h3>
            <div className="space-y-3">
              {conversionExamples.map((example, idx) => (
                <div key={idx} className="bg-white rounded-lg p-4 border border-blue-100">
                  <div className="grid gap-2 md:grid-cols-2">
                    <div>
                      <div className="text-sm text-gray-600">From:</div>
                      <div className="font-medium">{example.from}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600">To:</div>
                      <div className="font-medium">{example.to}</div>
                    </div>
                  </div>
                  <div className="mt-2 pt-2 border-t border-gray-100">
                    <div className="text-sm text-gray-600">Calculation:</div>
                    <div className="font-mono text-sm">{example.calculation}</div>
                    <div className="text-sm text-gray-600 mt-1">Result:</div>
                    <div className="font-mono text-sm font-semibold text-green-600">{example.result}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h4 className="font-medium text-green-900 mb-2">💡 Pro Tips</h4>
            <ul className="text-sm text-green-800 space-y-1">
              <li>• Set ingredient density for accurate volume ↔ weight conversions</li>
              <li>• Use UK imperial measurements (pints, gallons) for British recipes</li>
              <li>• Plato automatically handles all conversions in the background</li>
              <li>• Cost calculations update in real-time as you build recipes</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
