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
  const [packPrice, setPackPrice] = useState<number>(initialData?.packPrice || 0);
  const [purchaseUnit, setPurchaseUnit] = useState<string>(initialData?.packUnit || '');
  const [packCount, setPackCount] = useState<number>(() => {
    const countUnits = ['slices', 'each', 'large', 'medium', 'small', 'pinch', 'dash'];
    if (initialData?.customConversions) {
      try {
        const parsed = JSON.parse(initialData.customConversions);
        if (parsed && typeof parsed._packCount === "number" && parsed._packCount > 0) {
          return parsed._packCount;
        }
      } catch {
        // ignore
      }
    }
    // If count unit and packQuantity is present, infer packCount as packQuantity (for counts)
    if (initialData?.packUnit && countUnits.includes(initialData.packUnit)) {
      return initialData.packQuantity || 1;
    }
    return 1;
  });
  const [purchaseSize, setPurchaseSize] = useState<number>(() => {
    if (initialData?.packUnit) {
      const countUnits = ['slices', 'each', 'large', 'medium', 'small', 'pinch', 'dash'];
      if (countUnits.includes(initialData.packUnit)) {
        return initialData.packQuantity || 1;
      }
    }
    // derive per-unit size if packCount is present
    if (initialData?.packQuantity && initialData.packQuantity > 0 && packCount > 0) {
      return Number(initialData.packQuantity) / packCount;
    }
    return initialData?.packQuantity || 1;
  });
  const [purchaseSizeInput, setPurchaseSizeInput] = useState<string>(() => purchaseSize.toString());
  const [packMode, setPackMode] = useState<"single" | "bulk">(() => (packCount > 1 ? "bulk" : "single"));
  
  // Calculate price per unit using total purchase size (packCount * per-unit size)
  const totalPurchaseSize = packCount > 0 ? purchaseSize * packCount : purchaseSize;
  const pricePerUnit = totalPurchaseSize > 0 && packPrice >= 0 ? packPrice / totalPurchaseSize : null;
  
  // Sync purchaseSize, packCount, price, and unit when editing
  useEffect(() => {
    if (initialData?.packPrice !== undefined) {
      setPackPrice(initialData.packPrice);
    }
    if (initialData?.packUnit !== undefined) {
      setPurchaseUnit(initialData.packUnit);
    }
    let nextPackCount = packCount;
    if (initialData?.customConversions) {
      try {
        const parsed = JSON.parse(initialData.customConversions);
        if (parsed && typeof parsed._packCount === "number" && parsed._packCount > 0) {
          nextPackCount = parsed._packCount;
          setPackCount(parsed._packCount);
        }
      } catch {
        // ignore
      }
    }
    if (initialData?.packQuantity !== undefined && initialData.packQuantity > 0) {
      const inferredPerUnit = nextPackCount > 0 ? Number(initialData.packQuantity) / nextPackCount : Number(initialData.packQuantity);
      setPurchaseSize(inferredPerUnit);
      setPurchaseSizeInput(inferredPerUnit.toString());
    }
  }, [initialData?.packQuantity, initialData?.packPrice, initialData?.packUnit, initialData?.customConversions]);
  
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
    
    // Get purchase size and per-unit unit from form
    const purchaseSize = parseFloat((ev.currentTarget.querySelector('#purchaseSize') as HTMLInputElement)?.value || '1');
    const purchaseUnit = (ev.currentTarget.querySelector('#purchaseUnit') as HTMLSelectElement)?.value || '';
    
    // Derive total pack quantity for pricing: packCount * per-unit size
    const finalPackQuantity = packCount > 0 ? purchaseSize * packCount : purchaseSize;
    
    // Store packQuantity
    formData.set("packQuantity", finalPackQuantity.toString());
    
    // Store packUnit as purchaseUnit (e.g., "slices", "each", "case", "box")
    formData.set("packUnit", purchaseUnit);
    
    // Clear batchPricing since packQuantity is derived
    formData.set("batchPricing", "");

    // Persist packCount in customConversions metadata
    if (customConversions.length > 0 || packCount !== 1) {
      const conversionsObj = customConversions.reduce((acc, conv) => {
        acc[conv.unit] = { value: conv.value, unit: conv.targetUnit };
        return acc;
      }, {} as Record<string, { value: number; unit: string }>);
      conversionsObj._packCount = packCount;
      formData.set("customConversions", JSON.stringify(conversionsObj));
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
        <div className="space-y-3 p-4 border border-gray-200 rounded-2xl bg-white/85 backdrop-blur-sm shadow-sm col-span-2">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">Pack Details (what you buy)</h3>
              <div className="relative inline-flex items-center bg-white/80 backdrop-blur-md border border-gray-200 rounded-full px-2 py-1.5 shadow-md transition-all">
                <div
                  className="absolute inset-y-1 left-1 rounded-full bg-emerald-500/15 transition-transform duration-200 ease-out shadow-inner"
                  style={{
                    width: "calc(50% - 0.5rem)",
                    transform: packMode === "single" ? "translateX(0%)" : "translateX(100%)"
                  }}
                  aria-hidden="true"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (packMode !== "single") {
                      setPackMode("single");
                      setPackCount(1);
                    }
                  }}
                  className={`relative z-10 px-4 py-2 text-sm font-semibold rounded-full transition-colors ${
                    packMode === "single" ? "text-emerald-700" : "text-gray-700 hover:text-emerald-700"
                  }`}
                >
                  Simple
                </button>
                <button
                  type="button"
                  onClick={() => setPackMode("bulk")}
                  className={`relative z-10 px-4 py-2 text-sm font-semibold rounded-full transition-colors ${
                    packMode === "bulk" ? "text-emerald-700" : "text-gray-700 hover:text-emerald-700"
                  }`}
                >
                  Complex
                </button>
              </div>
            </div>
          
          {/* Pack fields */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label htmlFor="purchaseSize" className="block text-xs font-semibold text-gray-700 mb-1">
                  Purchase size <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  id="purchaseSize"
                  name="purchaseSize"
                  step="0.01"
                  min="0.01"
                  value={purchaseSizeInput}
                  onChange={(e) => {
                    const value = e.target.value;
                    setPurchaseSizeInput(value);
                    if (value === "") {
                      return;
                    }
                    const parsed = parseFloat(value);
                    if (!isNaN(parsed) && parsed > 0) {
                      setPurchaseSize(parsed);
                    }
                  }}
                  onBlur={() => {
                    const parsed = parseFloat(purchaseSizeInput);
                    const normalized = !isNaN(parsed) && parsed > 0 ? parsed : 0.01;
                    setPurchaseSize(normalized);
                    setPurchaseSizeInput(normalized.toString());
                  }}
                  required
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors bg-white"
                placeholder="1"
                />
              <p className="text-xs text-gray-500 mt-1">
                {packMode === "single"
                  ? "Example: 1 bag"
                  : "Example: each bag is 3.5 kg (or each bar is 50 g)"}
              </p>
              </div>
              <div>
                <label htmlFor="purchaseUnit" className="block text-xs font-semibold text-gray-700 mb-1">
                  Purchase unit <span className="text-red-500">*</span>
                </label>
                <select
                  id="purchaseUnit"
                  name="purchaseUnit"
                  defaultValue={initialData?.packUnit || ""}
                  onChange={(e) => setPurchaseUnit(e.target.value)}
                  required
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors bg-white"
                >
                <option value="">each, kg, ml…</option>
                <optgroup label="Count">
                  <option value="slices">slices</option>
                  <option value="each">each</option>
                  <option value="large">large</option>
                  <option value="medium">medium</option>
                  <option value="small">small</option>
                  <option value="pinch">pinch</option>
                  <option value="dash">dash</option>
                </optgroup>
                <optgroup label="Weight">
                  <option value="g">g</option>
                  <option value="kg">kg</option>
                  <option value="mg">mg</option>
                  <option value="oz">oz</option>
                  <option value="lb">lb</option>
                </optgroup>
                <optgroup label="Volume">
                  <option value="ml">ml</option>
                  <option value="l">l</option>
                  <option value="floz">fl oz</option>
                  <option value="tsp">tsp</option>
                  <option value="tbsp">tbsp</option>
                  <option value="cup">cup</option>
                  <option value="pint">pint</option>
                  <option value="quart">quart</option>
                  <option value="gallon">gallon</option>
                </optgroup>
              </select>
              <p className="text-xs text-gray-500 mt-1">
                Choose the unit you buy (each, kg, ml)
              </p>
              </div>
            {packMode === "bulk" && (
              <div>
                <label htmlFor="packCount" className="block text-xs font-semibold text-gray-700 mb-1">
                  Units in this pack <span className="text-red-500">*</span>
                </label>
                  <input
                    type="number"
                    id="packCount"
                    name="packCount"
                    min="1"
                    step="1"
                    value={packCount}
                    onChange={(e) => {
                      const val = parseInt(e.target.value, 10);
                      if (!isNaN(val) && val > 0) {
                        setPackCount(val);
                      } else if (e.target.value === "") {
                        setPackCount(1);
                      }
                    }}
                    onBlur={(e) => {
                      const val = parseInt(e.target.value, 10);
                      const normalized = !isNaN(val) && val > 0 ? val : 1;
                      setPackCount(normalized);
                    }}
                    required
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors bg-white"
                  placeholder="12"
                  />
                <p className="text-xs text-gray-500 mt-1">Example: box of 12 bars → 12</p>
                </div>
            )}
            </div>

            {/* Price */}
            <div className="space-y-1">
              <div className="flex items-center gap-3 flex-wrap">
                <label htmlFor="packPrice" className="text-sm font-semibold text-gray-800">
                  Price <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">£</span>
                  <input
                    type="number"
                    id="packPrice"
                    name="packPrice"
                    step="0.01"
                    min="0"
                    value={packPrice === 0 ? 0 : (Number.isFinite(packPrice) ? packPrice : "")}
                    onChange={(e) => {
                      const raw = e.target.value;
                      if (raw === "") {
                        setPackPrice(0);
                        return;
                      }
                      const parsed = parseFloat(raw);
                      setPackPrice(!isNaN(parsed) && parsed >= 0 ? parsed : 0);
                    }}
                    required
                    className="w-28 pl-7 pr-3 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors bg-white"
                    placeholder="6.50"
                  />
                </div>
              </div>
              <p className="text-xs text-gray-500">
                {packMode === "single"
                  ? "Example: bag costs £3.50 → enter 3.50"
                  : "Example: whole box costs £9.60 → enter 9.60"}
              </p>
              {pricePerUnit && (
                <p className="text-xs text-emerald-700 font-medium mt-1">
                  £{pricePerUnit.toFixed(2)} per unit
                </p>
              )}
            </div>
          </div>

          {/* Custom Unit Conversions + Supplier */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 col-span-3">
            <div className="bg-emerald-50 border-2 border-emerald-200 rounded-lg p-3">
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wide mb-1.5">
                Custom Unit Conversions <span className="text-gray-400 text-xs font-normal normal-case">(Optional)</span>
              </label>
              <p className="text-xs text-gray-600 mb-2 leading-tight">
                Define how recipe units (tsp, tbsp, cup, etc.) convert to your purchase unit. 
                Example: If you buy vanilla extract in 100ml bottles but recipes use teaspoons, 
                you can specify \"1 tsp = 5 ml\" here.
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
          </div>
        </div>

        {/* Notes & Additional Details Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

          {/* Additional Details - Collapsible */}
          <div className="border border-gray-200 rounded-2xl bg-white/80 backdrop-blur-sm shadow-sm overflow-hidden">
            <button
              type="button"
              onClick={() => setShowAdditionalDetails(!showAdditionalDetails)}
              className="w-full flex items-center justify-between px-4 py-3 hover:bg-white transition-colors"
            >
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-400/80"></div>
                <h3 className="text-sm font-semibold text-gray-800 uppercase tracking-wide">Additional Details</h3>
              </div>
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
              <div className="px-4 pb-4 space-y-3 border-t border-gray-100 pt-3">
                {/* Yield Quantity & Unit */}
                <div className="grid grid-cols-2 gap-3">
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
                <div className="space-y-1">
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
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus-border-emerald-500 transition-colors bg-white"
                    placeholder="1.0 (for water)"
                  />
                  <p className="text-xs text-gray-500">
                    Used for converting between weight and volume (e.g., ml to grams).
                  </p>
                </div>
              </div>
            )}
          </div>
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