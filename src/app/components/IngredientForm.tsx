"use client";

import React, { useState, useEffect } from "react";
import { UnitConversionHelp } from "./UnitConversionHelp";
import { SupplierSelector } from "./SupplierSelector";

const ALLERGEN_OPTIONS = [
  "Celery",
  "Gluten",
  "Eggs",
  "Fish",
  "Milk",
  "Molluscs",
  "Mustard",
  "Nuts",
  "Peanuts",
  "Sesame",
  "Soya",
  "Sulphites",
  "Other"
];

const NUT_TYPES = [
  "Almonds",
  "Brazil nuts",
  "Cashews",
  "Hazelnuts",
  "Macadamia nuts",
  "Peanuts",
  "Pecans",
  "Pine nuts",
  "Pistachios",
  "Walnuts",
  "Mixed nuts"
];

interface Supplier {
  id: number;
  name: string;
  deliveryDays: string[];
  [key: string]: any; // Allow additional properties
}

interface CustomConversion {
  unit: string;
  value: number;
  targetUnit: string;
}

interface IngredientFormProps {
  companyId: number;
  suppliers?: Supplier[];
  initialData?: {
    name?: string;
    description?: string;
    packQuantity?: number;
    packUnit?: string;
    packPrice?: number;
    yieldQuantity?: number;
    yieldUnit?: string;
    densityGPerMl?: number;
    allergens?: string[];
    notes?: string;
    supplierId?: number;
    customConversions?: string;
    batchPricing?: Array<{ packQuantity: number; packPrice: number }> | null;
  };
  onSubmit: (formData: FormData) => void;
  allergens?: string[];
  onAllergenChange?: (allergens: string[]) => void;
  otherAllergen?: string;
  onOtherAllergenChange?: (value: string) => void;
  showOtherInput?: boolean;
  onShowOtherInputChange?: (show: boolean) => void;
}

export function IngredientForm({ 
  companyId, 
  suppliers = [], 
  initialData, 
  onSubmit,
  allergens: externalAllergens,
  onAllergenChange,
  otherAllergen: externalOtherAllergen,
  onOtherAllergenChange,
  showOtherInput: externalShowOtherInput,
  onShowOtherInputChange
}: IngredientFormProps) {
  const [allergens, setAllergens] = useState<string[]>(externalAllergens || initialData?.allergens || []);
  const [selectedNutTypes, setSelectedNutTypes] = useState<string[]>([]);
  const [selectedSupplierId, setSelectedSupplierId] = useState<number | null>(initialData?.supplierId || null);
  const [otherAllergen, setOtherAllergen] = useState<string>(externalOtherAllergen || "");
  const [showOtherInput, setShowOtherInput] = useState<boolean>(externalShowOtherInput || false);
  const [otherNutType, setOtherNutType] = useState<string>("");
  const [showOtherNutInput, setShowOtherNutInput] = useState<boolean>(false);
  const [showAdditionalDetails, setShowAdditionalDetails] = useState<boolean>(false);
  const [packSize, setPackSize] = useState<number>(initialData?.packQuantity || 1);
  const [packPrice, setPackPrice] = useState<number>(initialData?.packPrice || 0);
  const [showTooltip, setShowTooltip] = useState<{ [key: string]: boolean }>({});
  const [hasUserModifiedPackSize, setHasUserModifiedPackSize] = useState<boolean>(false);
  const [purchaseUnit, setPurchaseUnit] = useState<string>(initialData?.packUnit || '');
  const [purchaseSize, setPurchaseSize] = useState<number>(() => {
    // For count units, initialize from packQuantity
    if (initialData?.packUnit) {
      const countUnits = ['slices', 'each', 'large', 'medium', 'small', 'pinch', 'dash'];
      if (countUnits.includes(initialData.packUnit)) {
        return initialData.packQuantity || 1;
      }
    }
    return 1;
  });
  
  // Calculate price per unit
  // For count units, use purchaseSize, otherwise use packSize
  const countUnits = ['slices', 'each', 'large', 'medium', 'small', 'pinch', 'dash'];
  const isCountUnit = countUnits.includes(purchaseUnit || initialData?.packUnit || '');
  const unitsForPriceCalc = isCountUnit ? purchaseSize : packSize;
  const pricePerUnit = unitsForPriceCalc > 1 && packPrice > 0 ? packPrice / unitsForPriceCalc : null;
  
  // Sync packSize and purchaseSize with initialData when it changes (for edit mode)
  // BUT only if user hasn't manually modified packSize
  // Also sync packPrice to ensure both update correctly
  useEffect(() => {
    // Sync purchaseSize for count units
    if (initialData?.packUnit) {
      const countUnits = ['slices', 'each', 'large', 'medium', 'small', 'pinch', 'dash'];
      if (countUnits.includes(initialData.packUnit) && initialData.packQuantity !== undefined && initialData.packQuantity > 0) {
        setPurchaseSize(initialData.packQuantity);
      }
    }
    
    // Only sync packSize if user hasn't manually changed it
    if (!hasUserModifiedPackSize && initialData?.packQuantity !== undefined && initialData.packQuantity > 0) {
      console.log('IngredientForm: Setting packSize from initialData:', initialData.packQuantity);
      setPackSize(initialData.packQuantity);
    }
    if (initialData?.packPrice !== undefined) {
      setPackPrice(initialData.packPrice);
    }
    if (initialData?.packUnit !== undefined) {
      setPurchaseUnit(initialData.packUnit);
    }
  }, [initialData?.packQuantity, initialData?.packPrice, initialData?.packUnit, hasUserModifiedPackSize]);
  
  // Reset the "user modified" flag when initialData changes significantly (new ingredient or different ingredient)
  useEffect(() => {
    setHasUserModifiedPackSize(false);
  }, [initialData?.name]); // Reset when ingredient name changes (new/different ingredient)
  
  // Debug: Log initialData when it changes
  useEffect(() => {
    console.log('IngredientForm initialData changed:', initialData);
  }, [initialData]);
  
  // Sync with external state if provided
  useEffect(() => {
    if (externalAllergens !== undefined) {
      setAllergens(externalAllergens);
    }
  }, [externalAllergens]);
  
  useEffect(() => {
    if (externalOtherAllergen !== undefined) {
      setOtherAllergen(externalOtherAllergen);
    }
  }, [externalOtherAllergen]);
  
  useEffect(() => {
    if (externalShowOtherInput !== undefined) {
      setShowOtherInput(externalShowOtherInput);
    }
  }, [externalShowOtherInput]);
  
  // Use external allergens if provided, otherwise use internal state
  const currentAllergens = externalAllergens !== undefined ? externalAllergens : allergens;
  
  // Parse initial custom conversions
  const initialConversions: CustomConversion[] = initialData?.customConversions 
    ? (() => {
        try {
          const parsed = JSON.parse(initialData.customConversions);
          return Object.entries(parsed).map(([unit, data]: [string, any]) => ({
            unit,
            value: data.value,
            targetUnit: data.unit
          }));
        } catch {
          return [];
        }
      })()
    : [];
  
  const [customConversions, setCustomConversions] = useState<CustomConversion[]>(initialConversions);

  const handleAllergenChange = (allergen: string, checked: boolean) => {
    if (allergen === "Other") {
      const newShowOther = checked;
      setShowOtherInput(newShowOther);
      if (onShowOtherInputChange) onShowOtherInputChange(newShowOther);
      if (!checked) {
        setOtherAllergen("");
        if (onOtherAllergenChange) onOtherAllergenChange("");
        const newAllergens = currentAllergens.filter(a => a !== "Other" && !ALLERGEN_OPTIONS.includes(a));
        setAllergens(newAllergens);
        if (onAllergenChange) onAllergenChange(newAllergens);
      }
    } else {
      let newAllergens: string[];
      if (checked) {
        newAllergens = [...currentAllergens, allergen];
      } else {
        newAllergens = currentAllergens.filter(a => a !== allergen);
        // If "Nuts" is unchecked, also clear nut types
        if (allergen === "Nuts") {
          setSelectedNutTypes([]);
        }
      }
      setAllergens(newAllergens);
      if (onAllergenChange) onAllergenChange(newAllergens);
    }
  };

  const handleNutTypeChange = (nutType: string, checked: boolean) => {
    if (checked) {
      setSelectedNutTypes(prev => [...prev, nutType]);
    } else {
      setSelectedNutTypes(prev => prev.filter(n => n !== nutType));
    }
  };

  const handleOtherAllergenChange = (value: string) => {
    setOtherAllergen(value);
    if (onOtherAllergenChange) onOtherAllergenChange(value);
    // Remove the previous "other" allergen if it exists
    const previousOther = currentAllergens.find(a => !ALLERGEN_OPTIONS.includes(a) && a !== "Other");
    let newAllergens = currentAllergens;
    if (previousOther) {
      newAllergens = currentAllergens.filter(a => a !== previousOther);
    }
    // Add the new "other" allergen if it has a value
    if (value && !newAllergens.includes(value)) {
      newAllergens = [...newAllergens, value];
    }
    setAllergens(newAllergens);
    if (onAllergenChange) onAllergenChange(newAllergens);
  };

  const addCustomConversion = () => {
    setCustomConversions(prev => [...prev, { unit: "tsp", value: 1, targetUnit: "ml" }]);
  };

  const removeCustomConversion = (index: number) => {
    setCustomConversions(prev => prev.filter((_, i) => i !== index));
  };

  const updateCustomConversion = (index: number, field: keyof CustomConversion, value: string | number) => {
    setCustomConversions(prev => prev.map((conv, i) => 
      i === index ? { ...conv, [field]: value } : conv
    ));
  };

  const handleSubmit = (ev: React.FormEvent<HTMLFormElement>) => {
    ev.preventDefault();
    
    // Combine allergens and nut types
    let allAllergens = [...currentAllergens];
    
    // Add "Other" allergen if otherAllergen has a value
    if (showOtherInput && otherAllergen.trim()) {
      // Remove previous custom allergen if exists
      allAllergens = allAllergens.filter(a => ALLERGEN_OPTIONS.includes(a) || a === "Other");
      if (!allAllergens.includes("Other")) {
        allAllergens.push("Other");
      }
      // Add the custom allergen value
      if (!allAllergens.includes(otherAllergen.trim())) {
        allAllergens.push(otherAllergen.trim());
      }
    }
    
    const nutTypesToAdd = [...selectedNutTypes];
    
    // Add custom "Other" nut type if provided
    if (showOtherNutInput && otherNutType.trim()) {
      nutTypesToAdd.push(otherNutType.trim());
    }
    
    if (nutTypesToAdd.length > 0) {
      // Replace "Nuts" with specific nut types
      const allergensWithoutNuts = allAllergens.filter(a => a !== "Nuts");
      allAllergens = [...allergensWithoutNuts, ...nutTypesToAdd];
    }
    
    const formData = new FormData(ev.currentTarget);
    formData.set("allergens", JSON.stringify(allAllergens));
    
    // Serialize custom conversions to JSON
    if (customConversions.length > 0) {
      const conversionsObj = customConversions.reduce((acc, conv) => {
        acc[conv.unit] = { value: conv.value, unit: conv.targetUnit };
        return acc;
      }, {} as Record<string, { value: number; unit: string }>);
      formData.set("customConversions", JSON.stringify(conversionsObj));
    }
    
    // Get purchase size, purchase unit, and pack size from form
    const purchaseSize = parseFloat((ev.currentTarget.querySelector('#purchaseSize') as HTMLInputElement)?.value || '1');
    const purchaseUnit = (ev.currentTarget.querySelector('#purchaseUnit') as HTMLSelectElement)?.value || '';
    // Read packSize from both state and DOM to ensure we get the correct value
    // Prefer DOM value as it's the source of truth at submission time
    const packSizeInput = ev.currentTarget.querySelector('#packSize') as HTMLInputElement;
    const packSizeFromDOM = packSizeInput ? parseFloat(packSizeInput.value) : NaN;
    const packSizeValue = (!isNaN(packSizeFromDOM) && packSizeFromDOM > 0) ? packSizeFromDOM : (packSize || 1);
    
    // Count units (slices, each, etc.) - for these, Purchase Size IS the pack quantity
    // For example: "100 slices" means packQuantity=100, packUnit=slices
    const countUnits = ['slices', 'each', 'large', 'medium', 'small', 'pinch', 'dash'];
    const isCountUnit = countUnits.includes(purchaseUnit);
    
    // If it's a count unit, use purchaseSize as packQuantity (user is buying X slices/each)
    // Otherwise, use packSize (user is buying 1 case containing X bottles)
    const finalPackQuantity = isCountUnit ? purchaseSize : packSizeValue;
    
    // Debug logging
    console.log('Form submission packSize values:', {
      packSizeState: packSize,
      packSizeFromDOM: packSizeFromDOM,
      packSizeInputValue: packSizeInput?.value,
      purchaseSize,
      purchaseUnit,
      isCountUnit,
      finalPackQuantity
    });
    
    // Store packQuantity - for count units this is purchaseSize, otherwise it's packSize
    formData.set("packQuantity", finalPackQuantity.toString());
    
    // Store packUnit as purchaseUnit (e.g., "slices", "each", "case", "box")
    formData.set("packUnit", purchaseUnit);
    
    // Store purchase info in batchPricing for reference if pack size differs from purchase size
    // This helps the system understand the relationship between purchase and pack
    // For count units, purchaseSize IS packQuantity, so no batch pricing needed
    if (!isCountUnit && packSizeValue !== purchaseSize) {
      formData.set("batchPricing", JSON.stringify([{ packQuantity: packSizeValue, packPrice: 0 }]));
    } else {
      formData.set("batchPricing", "");
    }
    
    if (selectedSupplierId) {
      formData.set("supplierId", selectedSupplierId.toString());
    }
    onSubmit(formData);
  };

  return (
    <div>
      <form id="ingredient-form" onSubmit={handleSubmit} className="space-y-4">
        {/* Top Row: 3-Column Layout */}
        <div className="grid grid-cols-3 gap-4">
          {/* Basic Information Section */}
          <div className="space-y-4 p-4 border border-gray-200 rounded-lg bg-gray-50/50">
            <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3 pb-2 border-b border-gray-300">Basic Information</h3>
            
            {/* Name */}
            <div>
              <label htmlFor="ingredient-name" className="block text-sm font-medium text-gray-700 mb-1.5">
                Ingredient Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="ingredient-name"
                name="name"
                defaultValue={initialData?.name || ""}
                required
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors bg-white"
                placeholder="e.g., All-Purpose Flour"
              />
            </div>

            {/* Description */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1.5">
                Description <span className="text-gray-400 text-xs">(Optional)</span>
              </label>
              <textarea
                id="description"
                name="description"
                rows={3}
                defaultValue={initialData?.description || ""}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors bg-white resize-none"
                placeholder="e.g., Bleached, enriched, pre-sifted"
              ></textarea>
            </div>
          </div>

          {/* Pack Details Section */}
          <div className="space-y-4 p-4 border border-gray-200 rounded-lg bg-gray-50/50">
            <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3 pb-2 border-b border-gray-300">Pack Details</h3>
            
            {/* Purchase Size & Unit */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label htmlFor="purchaseSize" className="flex items-center gap-1.5 text-sm font-medium text-gray-700 mb-1.5">
                  Purchase Size <span className="text-red-500">*</span>
                  <div className="relative">
                    <button
                      type="button"
                      className="focus:outline-none"
                      onMouseEnter={() => setShowTooltip({ ...showTooltip, purchaseSize: true })}
                      onMouseLeave={() => setShowTooltip({ ...showTooltip, purchaseSize: false })}
                    >
                      <svg className="w-4 h-4 text-gray-400 hover:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </button>
                    {showTooltip.purchaseSize && (
                      <div className="absolute left-0 top-6 z-50 w-48 p-2 bg-gray-900 text-white text-xs rounded shadow-lg">
                        How many you buy (e.g., 1 for single, 6 for case)
                      </div>
                    )}
                  </div>
                </label>
                <input
                  type="number"
                  id="purchaseSize"
                  name="purchaseSize"
                  step="0.01"
                  min="0"
                  value={purchaseSize}
                  onChange={(e) => {
                    const value = parseFloat(e.target.value) || 0;
                    setPurchaseSize(value);
                  }}
                  required
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors bg-white"
                  placeholder="1"
                />
              </div>
              <div>
                <label htmlFor="purchaseUnit" className="flex items-center gap-1.5 text-sm font-medium text-gray-700 mb-1.5">
                  Purchase Unit <span className="text-red-500">*</span>
                  <div className="relative">
                    <button
                      type="button"
                      className="focus:outline-none"
                      onMouseEnter={() => setShowTooltip({ ...showTooltip, purchaseUnit: true })}
                      onMouseLeave={() => setShowTooltip({ ...showTooltip, purchaseUnit: false })}
                    >
                      <svg className="w-4 h-4 text-gray-400 hover:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </button>
                    {showTooltip.purchaseUnit && (
                      <div className="absolute left-0 top-6 z-50 w-48 p-2 bg-gray-900 text-white text-xs rounded shadow-lg">
                        What you're buying (case, box, pack, or standard units)
                      </div>
                    )}
                  </div>
                </label>
                <select
                  id="purchaseUnit"
                  name="purchaseUnit"
                  defaultValue={initialData?.packUnit || ""}
                  onChange={(e) => setPurchaseUnit(e.target.value)}
                  required
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors bg-white"
                >
                <option value="">Select...</option>
                <optgroup label="Packaging">
                  <option value="case">case</option>
                  <option value="box">box</option>
                  <option value="pack">pack</option>
                  <option value="carton">carton</option>
                  <option value="bundle">bundle</option>
                </optgroup>
                <optgroup label="Weight/Mass">
                  <option value="g">g (grams)</option>
                  <option value="kg">kg (kilograms)</option>
                  <option value="mg">mg (milligrams)</option>
                  <option value="lb">lb (pounds)</option>
                  <option value="oz">oz (ounces)</option>
                </optgroup>
                <optgroup label="Volume (Liquid)">
                  <option value="ml">ml (milliliters)</option>
                  <option value="l">l (liters)</option>
                  <option value="tsp">tsp (teaspoons)</option>
                  <option value="tbsp">tbsp (tablespoons)</option>
                  <option value="cup">cup</option>
                  <option value="floz">fl oz (fluid ounces)</option>
                  <option value="pint">pint</option>
                  <option value="quart">quart</option>
                  <option value="gallon">gallon</option>
                </optgroup>
                <optgroup label="Count/Discrete">
                  <option value="each">each</option>
                  <option value="slices">slices</option>
                </optgroup>
                <optgroup label="Size-based">
                  <option value="large">large</option>
                  <option value="medium">medium</option>
                  <option value="small">small</option>
                </optgroup>
              </select>
              </div>
            </div>

            {/* Pack Size (how many individual units in the purchase) */}
            {/* Hide Pack Size for count units (slices, each, etc.) since Purchase Size IS the pack size */}
            {(() => {
              const countUnits = ['slices', 'each', 'large', 'medium', 'small', 'pinch', 'dash'];
              const isCountUnit = countUnits.includes(purchaseUnit || initialData?.packUnit || '');
              
              if (isCountUnit) {
                return null; // Don't show Pack Size for count units
              }
              
              return (
                <div>
                  <label htmlFor="packSize" className="flex items-center gap-1.5 text-sm font-medium text-gray-700 mb-1.5">
                    Pack Size <span className="text-red-500">*</span>
                    <div className="relative">
                      <button
                        type="button"
                        className="focus:outline-none"
                        onMouseEnter={() => setShowTooltip({ ...showTooltip, packSize: true })}
                        onMouseLeave={() => setShowTooltip({ ...showTooltip, packSize: false })}
                      >
                        <svg className="w-4 h-4 text-gray-400 hover:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </button>
                      {showTooltip.packSize && (
                        <div className="absolute left-0 top-6 z-50 w-56 p-2 bg-gray-900 text-white text-xs rounded shadow-lg">
                          How many individual units are in this purchase? (e.g., 6 if a case contains 6 bottles)
                        </div>
                      )}
                    </div>
                  </label>
                  <input
                    type="number"
                    id="packSize"
                    name="packSize"
                    step="1"
                    min="1"
                    value={packSize}
                    onChange={(e) => {
                      const value = e.target.value;
                      // Mark that user has manually modified this field
                      setHasUserModifiedPackSize(true);
                      // Allow empty string while typing
                      if (value === '') {
                        setPackSize(1);
                        return;
                      }
                      // Parse the value
                      const numValue = parseFloat(value);
                      // Only update if it's a valid positive number
                      if (!isNaN(numValue) && numValue >= 1) {
                        setPackSize(Math.floor(numValue)); // Use floor to ensure integer
                      }
                    }}
                    onBlur={(e) => {
                      // Ensure minimum value of 1 on blur
                      const value = parseFloat(e.target.value);
                      if (isNaN(value) || value < 1) {
                        setPackSize(1);
                      } else {
                        setPackSize(Math.floor(value));
                      }
                    }}
                    required
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors bg-white"
                    placeholder="1"
                  />
                </div>
              );
            })()}

            {/* Price */}
            <div>
              <label htmlFor="packPrice" className="flex items-center gap-1.5 text-sm font-medium text-gray-700 mb-1.5">
                Price <span className="text-red-500">*</span>
                <div className="relative">
                  <button
                    type="button"
                    className="focus:outline-none"
                    onMouseEnter={() => setShowTooltip({ ...showTooltip, packPrice: true })}
                    onMouseLeave={() => setShowTooltip({ ...showTooltip, packPrice: false })}
                  >
                    <svg className="w-4 h-4 text-gray-400 hover:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </button>
                  {showTooltip.packPrice && (
                    <div className="absolute left-0 top-6 z-50 w-56 p-2 bg-gray-900 text-white text-xs rounded shadow-lg">
                      Price for the purchase size above. Use 0 for free ingredients like water.
                    </div>
                  )}
                </div>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">£</span>
                <input
                  type="number"
                  id="packPrice"
                  name="packPrice"
                  step="0.01"
                  min="0"
                  value={packPrice || ""}
                  onChange={(e) => setPackPrice(parseFloat(e.target.value) || 0)}
                  required
                  className="w-full pl-7 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors bg-white"
                  placeholder="25.00"
                />
              </div>
              {pricePerUnit && (
                <p className="text-xs text-emerald-700 font-medium mt-1.5">
                  £{pricePerUnit.toFixed(2)} per unit
                </p>
              )}
            </div>
          </div>

          {/* Custom Unit Conversions */}
          <div className="bg-emerald-50 border-2 border-emerald-200 rounded-lg p-3">
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wide mb-1.5">
              Custom Unit Conversions <span className="text-gray-400 text-xs font-normal normal-case">(Optional)</span>
            </label>
            <p className="text-xs text-gray-600 mb-2 leading-tight">
              Define how recipe units (tsp, tbsp, cup, etc.) convert to your purchase unit. 
              Example: If you buy vanilla extract in 100ml bottles but recipes use teaspoons, 
              you can specify "1 tsp = 5 ml" here.
            </p>

            {customConversions.length > 0 && (
              <div className="space-y-1.5 mb-2">
                {customConversions.map((conversion, index) => (
                  <div key={index} className="flex gap-1.5 items-center bg-white p-1.5 rounded border border-emerald-200">
                    <span className="text-xs font-medium text-gray-600">1</span>
                    <select
                      value={conversion.unit}
                      onChange={(e) => updateCustomConversion(index, 'unit', e.target.value)}
                      className="px-2 py-1 border border-gray-300 rounded focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 text-xs bg-white"
                    >
                      <option value="tsp">tsp</option>
                      <option value="tbsp">tbsp</option>
                      <option value="cup">cup</option>
                      <option value="floz">fl oz</option>
                      <option value="pint">pint</option>
                      <option value="oz">oz</option>
                      <option value="lb">lb</option>
                    </select>
                    <span className="text-xs font-medium text-gray-600">=</span>
                    <input
                      type="number"
                      value={conversion.value}
                      onChange={(e) => updateCustomConversion(index, 'value', parseFloat(e.target.value) || 0)}
                      step="0.01"
                      min="0"
                      className="w-16 px-2 py-1 border border-gray-300 rounded focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 text-xs bg-white"
                      placeholder="5"
                    />
                    <select
                      value={conversion.targetUnit}
                      onChange={(e) => updateCustomConversion(index, 'targetUnit', e.target.value)}
                      className="px-2 py-1 border border-gray-300 rounded focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 text-xs bg-white"
                    >
                      <option value="ml">ml</option>
                      <option value="l">l</option>
                      <option value="g">g</option>
                      <option value="kg">kg</option>
                      <option value="oz">oz</option>
                      <option value="lb">lb</option>
                    </select>
                    <button
                      type="button"
                      onClick={() => removeCustomConversion(index)}
                      className="ml-auto p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                      title="Remove"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}

            <button
              type="button"
              onClick={addCustomConversion}
              className="flex items-center gap-1.5 px-2 py-1.5 text-xs text-emerald-700 hover:bg-emerald-100 rounded transition-colors border border-dashed border-emerald-300 w-full justify-center"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Add Rule
            </button>
          </div>
        </div>

        {/* Second Row: Supplier and Notes */}
        <div className="grid grid-cols-2 gap-4">
          {/* Supplier Section */}
          <div className="p-3 border border-gray-200 rounded-lg bg-gray-50/50">
            <label htmlFor="supplierId" className="block text-xs font-semibold text-gray-700 uppercase tracking-wide mb-2">
              Supplier <span className="text-gray-400 text-xs font-normal normal-case">(Optional)</span>
            </label>
            <SupplierSelector
              suppliers={suppliers}
              value={selectedSupplierId}
              onChange={setSelectedSupplierId}
            />
          </div>

          {/* Notes Section */}
          <div className="p-3 border border-gray-200 rounded-lg bg-gray-50/50">
            <label htmlFor="notes" className="block text-xs font-semibold text-gray-700 uppercase tracking-wide mb-2">
              Notes <span className="text-gray-400 text-xs font-normal normal-case">(Optional)</span>
            </label>
            <textarea
              id="notes"
              name="notes"
              rows={3}
              defaultValue={initialData?.notes || ""}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors bg-white resize-none"
              placeholder="Any additional notes about this ingredient..."
            ></textarea>
          </div>
        </div>

        {/* Third Row: Additional Details - Collapsible */}
        <div className="border border-gray-200 rounded-lg bg-gray-50/50 overflow-hidden">
          <button
            type="button"
            onClick={() => setShowAdditionalDetails(!showAdditionalDetails)}
            className="w-full flex items-center justify-between p-4 hover:bg-gray-100/50 transition-colors"
          >
            <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Additional Details</h3>
            <svg
              className={`w-5 h-5 text-gray-500 transition-transform ${showAdditionalDetails ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          
          {showAdditionalDetails && (
            <div className="px-4 pb-4 space-y-4 border-t border-gray-200 pt-4">
              {/* Yield Quantity & Unit */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label htmlFor="yieldQuantity" className="block text-sm font-medium text-gray-700 mb-1.5">
                    Yield Quantity <span className="text-gray-400 text-xs">(Optional)</span>
                  </label>
                  <input
                    type="number"
                    id="yieldQuantity"
                    name="yieldQuantity"
                    step="0.01"
                    min="0"
                    defaultValue={initialData?.yieldQuantity || ""}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors bg-white"
                    placeholder="1"
                  />
                </div>
                <div>
                  <label htmlFor="yieldUnit" className="block text-sm font-medium text-gray-700 mb-1.5">
                    Yield Unit <span className="text-gray-400 text-xs">(Optional)</span>
                  </label>
                  <input
                    type="text"
                    id="yieldUnit"
                    name="yieldUnit"
                    defaultValue={initialData?.yieldUnit || ""}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors bg-white"
                    placeholder="kg, liter, each"
                  />
                </div>
              </div>

              {/* Density */}
              <div>
                <label htmlFor="densityGPerMl" className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1.5">
                  Density (g/ml) <span className="text-gray-400 text-xs font-normal">(Optional)</span>
                  <UnitConversionHelp />
                </label>
                <input
                  type="number"
                  id="densityGPerMl"
                  name="densityGPerMl"
                  step="0.001"
                  min="0"
                  defaultValue={initialData?.densityGPerMl || ""}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors bg-white"
                  placeholder="1.0 (for water)"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Used for converting between weight and volume (e.g., ml to grams).
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Specific Nut Types - Full Width if shown */}
        {currentAllergens.includes("Nuts") && (
          <div className="border border-gray-200 rounded-lg p-3 bg-gray-50">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Specific Nut Types
              <span className="text-xs text-gray-500 font-normal ml-2">
                (Select to replace generic "Nuts" allergen)
              </span>
            </label>
            <div className="grid grid-cols-4 lg:grid-cols-6 gap-1.5 mb-3">
              {NUT_TYPES.map((nutType) => (
                <label key={nutType} className="flex items-center space-x-1.5 cursor-pointer hover:bg-white p-1 rounded transition-colors">
                  <input
                    type="checkbox"
                    id={`nut-type-${nutType.toLowerCase().replace(/\s+/g, '-')}`}
                    name={`nutType-${nutType}`}
                    checked={selectedNutTypes.includes(nutType)}
                    onChange={(e) => handleNutTypeChange(nutType, e.target.checked)}
                    className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 w-4 h-4 flex-shrink-0"
                  />
                  <span className="text-xs text-gray-700">{nutType}</span>
                </label>
              ))}
            </div>
            
            {/* Other Nut Type Option */}
            <div className="pt-2 border-t border-gray-200">
              <label className="flex items-center space-x-2 cursor-pointer mb-2">
                <input
                  type="checkbox"
                  checked={showOtherNutInput}
                  onChange={(e) => {
                    setShowOtherNutInput(e.target.checked);
                    if (!e.target.checked) {
                      setOtherNutType("");
                    }
                  }}
                  className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                />
                <span className="text-sm text-gray-700 font-medium">Other (specify)</span>
              </label>
              {showOtherNutInput && (
                <input
                  type="text"
                  value={otherNutType}
                  onChange={(e) => setOtherNutType(e.target.value)}
                  placeholder="e.g., Tiger nuts, Candlenuts..."
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white"
                />
              )}
            </div>
          </div>
        )}
      </form>
    </div>
  );
}