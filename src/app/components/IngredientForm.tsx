"use client";

import React, { useState, useEffect } from "react";
import { UnitConversionHelp } from "./UnitConversionHelp";
import { SupplierSelector } from "./SupplierSelector";
import { selectAllOnFocus } from "@/lib/utils";
import { toBase, fromBase, type Unit } from "@/lib/units";

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
    batchPricing?: Array<{ packQuantity: number; packPrice: number; purchaseUnit?: string; unitSize?: number }> | null;
    servings?: number | null;
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
  // Initialize packSize - from batchPricing if bulk purchase, otherwise from packQuantity
  // Determine if this is bulk purchase mode by checking batchPricing
  const packagingUnits = ['case', 'box', 'pack', 'carton', 'bundle'];
  
  // Check batchPricing to determine if this is a bulk purchase
  const hasBulkPurchaseInfo = initialData?.batchPricing && 
    Array.isArray(initialData.batchPricing) && 
    initialData.batchPricing.length > 0 &&
    initialData.batchPricing[0]?.purchaseUnit &&
    packagingUnits.includes(initialData.batchPricing[0].purchaseUnit);
  
  // Extract bulk purchase values for initialization
  const bulkPurchaseData = hasBulkPurchaseInfo ? initialData.batchPricing[0] : null;
  
  // Initialize purchase mode based on batchPricing (for saved bulk purchases) or packUnit (for new/legacy)
  const [isBulkPurchaseMode, setIsBulkPurchaseMode] = useState<boolean>(() => {
    if (hasBulkPurchaseInfo) {
      return true;
    }
    if (initialData?.packUnit) {
      return packagingUnits.includes(initialData.packUnit);
    }
    return false;
  });
  
  // Initialize purchaseUnit - from batchPricing if bulk, otherwise from packUnit
  const [purchaseUnit, setPurchaseUnit] = useState<string>(() => {
    if (bulkPurchaseData?.purchaseUnit) {
      return bulkPurchaseData.purchaseUnit;
    }
    return initialData?.packUnit || '';
  });
  
  // Initialize packUnit - this is the individual unit (kg, L, etc.) stored in packUnit
  const [packUnit, setPackUnit] = useState<string>(() => {
    return initialData?.packUnit || 'l';
  });
  
  // Initialize packSize - from batchPricing if bulk purchase, otherwise from packQuantity
  const [packSize, setPackSize] = useState<number>(() => {
    if (bulkPurchaseData?.packQuantity) {
      return bulkPurchaseData.packQuantity;
    }
    return initialData?.packQuantity || 1;
  });
  
  // Initialize packUnitSize - from batchPricing if available
  const [packUnitSize, setPackUnitSize] = useState<number>(() => {
    if (bulkPurchaseData?.unitSize) {
      return bulkPurchaseData.unitSize;
    }
    // Fallback: try to calculate from packQuantity and packSize
    if (isBulkPurchaseMode && initialData?.packQuantity && packSize > 0) {
      return initialData.packQuantity / packSize;
    }
    return 1;
  });
  
  const [packPrice, setPackPrice] = useState<number>(initialData?.packPrice || 0);
  const [showTooltip, setShowTooltip] = useState<{ [key: string]: boolean }>({});
  const [hasUserModifiedPackSize, setHasUserModifiedPackSize] = useState<boolean>(false);
  const [hasUserModifiedPurchaseSize, setHasUserModifiedPurchaseSize] = useState<boolean>(false);
  const [isInitializing, setIsInitializing] = useState<boolean>(true);
  
  // Servings state - optional field for how many servings this ingredient purchase yields
  const [servings, setServings] = useState<number | null>(() => {
    // Try to extract from notes if stored as JSON metadata
    if (initialData?.notes) {
      try {
        const parsed = JSON.parse(initialData.notes);
        if (parsed && typeof parsed.servings === 'number') {
          return parsed.servings;
        }
      } catch {
        // Notes is not JSON, that's fine
      }
    }
    return null;
  });
  
  // Servings unit state
  const [servingsUnit, setServingsUnit] = useState<string>(() => {
    // Try to extract from notes if stored as JSON metadata
    if (initialData?.notes) {
      try {
        const parsed = JSON.parse(initialData.notes);
        if (parsed && typeof parsed.servingsUnit === 'string') {
          return parsed.servingsUnit;
        }
      } catch {
        // Notes is not JSON, that's fine
      }
    }
    return 'servings'; // Default to 'servings'
  });
  
  // Calculate price per serving if both servings and packPrice are available
  const pricePerServing = servings && packPrice > 0 ? packPrice / servings : null;
  
  const [purchaseSize, setPurchaseSize] = useState<number>(() => {
    // For count units, initialize from packQuantity
    if (initialData?.packUnit) {
      const countUnits = ['slices', 'each', 'large', 'medium', 'small', 'pinch', 'dash'];
      if (countUnits.includes(initialData.packUnit)) {
        return initialData.packQuantity || 1;
      }
    }
    // For bulk purchases, calculate purchase size from total quantity
    // e.g., if packQuantity = 12kg, packSize = 6, packUnitSize = 2kg, then purchaseSize = 12 / (6 * 2) = 1
    if (bulkPurchaseData && initialData?.packQuantity) {
      const calculatedPackSize = bulkPurchaseData.packQuantity || 1;
      const calculatedUnitSize = bulkPurchaseData.unitSize || 1;
      if (calculatedPackSize > 0 && calculatedUnitSize > 0) {
        return Math.round(initialData.packQuantity / (calculatedPackSize * calculatedUnitSize)) || 1;
      }
    }
    // For bulk purchases without full data, default to 1
    if (isBulkPurchaseMode) {
      return 1;
    }
    // For single purchases, use packQuantity directly
    return initialData?.packQuantity || 1;
  });
  
  // Calculate price per unit
  // For count units, use purchaseSize, otherwise use packSize
  const countUnits = ['slices', 'each', 'large', 'medium', 'small', 'pinch', 'dash'];
  const isCountUnit = countUnits.includes(purchaseUnit || initialData?.packUnit || '');
  const unitsForPriceCalc = isCountUnit ? purchaseSize : packSize;
  const pricePerUnit = unitsForPriceCalc > 1 && packPrice > 0 ? packPrice / unitsForPriceCalc : null;
  
  // Calculate serving size automatically based on packQuantity/packUnit and servings
  const [calculatedServingSize, setCalculatedServingSize] = useState<{ amount: number; unit: string } | null>(null);
  
  useEffect(() => {
    // Get the actual pack quantity value from the form state
    let packQuantity: number | null = null;
    let packUnitForCalc: string | null = null;
    
    if (!purchaseUnit) {
      setCalculatedServingSize(null);
      return;
    }
    
    const countAndStandardUnits = ['slices', 'each', 'large', 'medium', 'small', 'pinch', 'dash', 'g', 'kg', 'mg', 'lb', 'oz', 'ml', 'l', 'tsp', 'tbsp', 'cup', 'floz', 'pint', 'quart', 'gallon'];
    const packagingUnits = ['case', 'box', 'pack', 'carton', 'bundle'];
    
    if (countAndStandardUnits.includes(purchaseUnit)) {
      // For count/standard units, use purchaseSize
      packQuantity = purchaseSize;
      packUnitForCalc = purchaseUnit;
    } else if (packagingUnits.includes(purchaseUnit)) {
      // For packaging units, we need packSize and packUnit
      // The total quantity is purchaseSize (number of packages) * packSize (size per package)
      if (purchaseSize > 0 && packSize > 0 && packUnit) {
        packQuantity = purchaseSize * packSize;
        packUnitForCalc = packUnit;
      }
    }
    
    // Only calculate if we have both pack quantity/unit and servings
    if (servings && servings > 0 && packQuantity && packQuantity > 0 && packUnitForCalc) {
      try {
        // Convert pack quantity to base unit
        const packInBase = toBase(packQuantity, packUnitForCalc as Unit, initialData?.densityGPerMl ?? undefined);
        
        // Calculate serving size in base unit
        const servingSizeInBase = packInBase.amount / servings;
        
        // If servingsUnit is a standard unit (not "servings" or "portions"), try to convert to that unit
        if (servingsUnit !== 'servings' && servingsUnit !== 'portions') {
          try {
            const servingSizeInTargetUnit = fromBase(servingSizeInBase, packInBase.base, servingsUnit as Unit);
            setCalculatedServingSize({ amount: servingSizeInTargetUnit, unit: servingsUnit });
          } catch {
            // If conversion fails, show in base unit
            const baseUnitDisplay = packInBase.base === 'g' ? 'g' : packInBase.base === 'ml' ? 'ml' : 'each';
            setCalculatedServingSize({ amount: servingSizeInBase, unit: baseUnitDisplay });
          }
        } else {
          // If servingsUnit is "servings" or "portions", show in base unit
          const baseUnitDisplay = packInBase.base === 'g' ? 'g' : packInBase.base === 'ml' ? 'ml' : 'each';
          setCalculatedServingSize({ amount: servingSizeInBase, unit: baseUnitDisplay });
        }
      } catch (error) {
        console.error('Error calculating serving size:', error);
        setCalculatedServingSize(null);
      }
    } else {
      setCalculatedServingSize(null);
    }
  }, [servings, purchaseSize, purchaseUnit, packSize, packUnit, servingsUnit, initialData?.densityGPerMl]);
  
  // Sync bulk mode state when initialData changes (for edit mode)
  useEffect(() => {
    setIsInitializing(true);
    const packagingUnits = ['case', 'box', 'pack', 'carton', 'bundle'];
    
    // Deep check for bulk purchase info
    const batchPricing = initialData?.batchPricing;
    const hasBulkInfo = batchPricing && 
      Array.isArray(batchPricing) && 
      batchPricing.length > 0 &&
      batchPricing[0] &&
      typeof batchPricing[0] === 'object' &&
      'purchaseUnit' in batchPricing[0] &&
      batchPricing[0].purchaseUnit &&
      packagingUnits.includes(String(batchPricing[0].purchaseUnit));
    
    console.log('IngredientForm: Syncing bulk mode state', { 
      hasBulkInfo, 
      batchPricing: initialData?.batchPricing,
      batchPricingType: typeof initialData?.batchPricing,
      batchPricingIsArray: Array.isArray(initialData?.batchPricing),
      batchPricingLength: Array.isArray(initialData?.batchPricing) ? initialData.batchPricing.length : 'N/A',
      firstItem: Array.isArray(initialData?.batchPricing) && initialData.batchPricing.length > 0 ? initialData.batchPricing[0] : 'N/A',
      purchaseUnit: Array.isArray(initialData?.batchPricing) && initialData.batchPricing.length > 0 && initialData.batchPricing[0] ? (initialData.batchPricing[0] as any).purchaseUnit : 'N/A',
      packUnit: initialData?.packUnit
    });
    
    if (hasBulkInfo) {
      // Set bulk mode if batchPricing indicates bulk purchase
      console.log('IngredientForm: Setting bulk mode to TRUE from batchPricing');
      setIsBulkPurchaseMode(true);
      const bulkData = batchPricing[0] as any;
      
      console.log('IngredientForm: Loading bulk purchase', {
        purchaseUnit: bulkData.purchaseUnit,
        packQuantity: bulkData.packQuantity,
        unitSize: bulkData.unitSize,
        totalPackQuantity: initialData?.packQuantity
      });
      
      // Sync purchase unit from batchPricing
      if (bulkData.purchaseUnit) {
        setPurchaseUnit(String(bulkData.purchaseUnit));
      }
      
      // Sync pack size and unit size from batchPricing
      if (bulkData.packQuantity) {
        setPackSize(Number(bulkData.packQuantity));
      }
      if (bulkData.unitSize) {
        setPackUnitSize(Number(bulkData.unitSize));
      }
      
      // Calculate purchase size from total quantity
      if (initialData?.packQuantity && bulkData.packQuantity && bulkData.unitSize) {
        const calculatedPurchaseSize = Math.round(initialData.packQuantity / (bulkData.packQuantity * bulkData.unitSize)) || 1;
        console.log('IngredientForm: Calculated purchase size', {
          total: initialData.packQuantity,
          packSize: bulkData.packQuantity,
          unitSize: bulkData.unitSize,
          calculated: calculatedPurchaseSize
        });
        setPurchaseSize(calculatedPurchaseSize);
      }
    } else {
      // Only check packUnit if we DON'T have bulk info from batchPricing
      // This prevents overriding bulk mode when batchPricing exists but packUnit is not a packaging unit
      if (initialData?.packUnit) {
        if (packagingUnits.includes(initialData.packUnit)) {
          console.log('IngredientForm: Setting bulk mode to TRUE from packUnit (legacy)');
          setIsBulkPurchaseMode(true);
          setPurchaseUnit(initialData.packUnit);
        } else {
          console.log('IngredientForm: Setting bulk mode to FALSE - no bulk info found');
          setIsBulkPurchaseMode(false);
        }
      } else {
        console.log('IngredientForm: Setting bulk mode to FALSE - no packUnit');
        setIsBulkPurchaseMode(false);
      }
    }
    
    // Mark initialization as complete after a brief delay to allow state to settle
    setTimeout(() => setIsInitializing(false), 100);
  }, [initialData?.batchPricing, initialData?.packUnit, initialData?.packQuantity]);
  
  // Sync packSize and purchaseSize with initialData when it changes (for edit mode)
  // BUT only if user hasn't manually modified the values
  // Also sync packPrice to ensure both update correctly
  // IMPORTANT: Skip this if we have bulk purchase info (handled by the bulk mode useEffect above)
  useEffect(() => {
    // Check if we have bulk purchase info - if so, skip this sync (it's handled above)
    const packagingUnits = ['case', 'box', 'pack', 'carton', 'bundle'];
    const hasBulkInfo = initialData?.batchPricing && 
      Array.isArray(initialData.batchPricing) && 
      initialData.batchPricing.length > 0 &&
      initialData.batchPricing[0]?.purchaseUnit &&
      packagingUnits.includes(initialData.batchPricing[0].purchaseUnit);
    
    // Don't sync if we have bulk purchase info - it's handled by the bulk mode useEffect
    if (hasBulkInfo) {
      return;
    }
    
    // Sync purchaseSize for count units - only if user hasn't modified it
    if (initialData?.packUnit && !hasUserModifiedPurchaseSize && !isBulkPurchaseMode) {
      const countUnits = ['slices', 'each', 'large', 'medium', 'small', 'pinch', 'dash'];
      if (countUnits.includes(initialData.packUnit) && initialData.packQuantity !== undefined && initialData.packQuantity > 0) {
        setPurchaseSize(initialData.packQuantity);
      }
    }
    
    // Only sync packSize if user hasn't manually changed it and not in bulk mode
    if (!hasUserModifiedPackSize && !isBulkPurchaseMode && initialData?.packQuantity !== undefined && initialData.packQuantity > 0) {
      console.log('IngredientForm: Setting packSize from initialData:', initialData.packQuantity);
      setPackSize(initialData.packQuantity);
    }
    if (initialData?.packPrice !== undefined) {
      setPackPrice(initialData.packPrice);
    }
    // Only sync purchaseUnit if not in bulk mode (bulk mode is handled above)
    if (initialData?.packUnit !== undefined && !isBulkPurchaseMode) {
      setPurchaseUnit(initialData.packUnit);
    }
  }, [initialData?.packQuantity, initialData?.packPrice, initialData?.packUnit, initialData?.batchPricing, hasUserModifiedPackSize, hasUserModifiedPurchaseSize, isBulkPurchaseMode]);
  
  // Reset the "user modified" flags when initialData changes significantly (new ingredient or different ingredient)
  useEffect(() => {
    setHasUserModifiedPackSize(false);
    setHasUserModifiedPurchaseSize(false);
  }, [initialData?.name]); // Reset when ingredient name changes (new/different ingredient)
  
  // Debug: Log initialData when it changes
  useEffect(() => {
    console.log('IngredientForm initialData changed:', initialData);
    console.log('IngredientForm batchPricing from props:', initialData?.batchPricing, 'type:', typeof initialData?.batchPricing, 'isArray:', Array.isArray(initialData?.batchPricing));
    console.log('IngredientForm has batchPricing property:', 'batchPricing' in (initialData || {}));
  }, [initialData]);
  
  // Debug: Track when bulk mode changes
  useEffect(() => {
    console.log('IngredientForm: isBulkPurchaseMode changed to:', isBulkPurchaseMode, {
      purchaseUnit,
      batchPricing: initialData?.batchPricing,
      stackTrace: new Error().stack
    });
  }, [isBulkPurchaseMode, purchaseUnit]);
  
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
    
    // Handle servings - store in notes as JSON metadata if provided, otherwise keep notes as-is
    const notesInput = ev.currentTarget.querySelector('#notes') as HTMLTextAreaElement;
    const notesText = notesInput?.value || "";
    const servingsInput = ev.currentTarget.querySelector('#servings') as HTMLInputElement;
    const servingsValue = servingsInput ? parseFloat(servingsInput.value) : null;
    const servingsUnitInput = ev.currentTarget.querySelector('#servingsUnit') as HTMLSelectElement;
    const servingsUnitValue = servingsUnitInput?.value || 'servings';
    
    // If servings is provided, store text, servings quantity, and servings unit in JSON format
    // Otherwise, just store the notes text as-is
    if (servingsValue !== null && !isNaN(servingsValue) && servingsValue > 0) {
      // Store text, servings quantity, and servings unit in JSON format
      const notesData = {
        text: notesText,
        servings: servingsValue,
        servingsUnit: servingsUnitValue
      };
      formData.set("notes", JSON.stringify(notesData));
    } else {
      // No servings, check if notes was previously JSON and extract text, otherwise use as-is
      let finalNotes = notesText;
      if (initialData?.notes) {
        try {
          const parsed = JSON.parse(initialData.notes);
          if (parsed && typeof parsed === 'object' && parsed.text) {
            // Was JSON before, but no servings now - just store the text part
            finalNotes = parsed.text;
          }
        } catch {
          // Wasn't JSON before, use new text as-is
        }
      }
      formData.set("notes", finalNotes);
    }
    
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
    const purchaseUnitSelect = ev.currentTarget.querySelector('#purchaseUnit') as HTMLSelectElement;
    const purchaseUnit = purchaseUnitSelect?.value || '';
    
    // Determine if this is bulk purchase mode
    const packagingUnits = ['case', 'box', 'pack', 'carton', 'bundle'];
    const isBulkMode = packagingUnits.includes(purchaseUnit);
    
    let finalPackQuantity: number;
    let finalPackUnit: string;
    
    if (isBulkMode) {
      // Bulk purchase: e.g., "1 case" containing "6 bottles" of "2L each"
      // Total quantity = purchaseSize × packSize × packUnitSize
      // Example: 1 case × 6 bottles × 2L = 12L total
    const packSizeInput = ev.currentTarget.querySelector('#packSize') as HTMLInputElement;
      const packUnitSizeInput = ev.currentTarget.querySelector('#packUnitSize') as HTMLInputElement;
      const packUnitSelect = ev.currentTarget.querySelector('#packUnit') as HTMLSelectElement;
    const packSizeFromDOM = packSizeInput ? parseFloat(packSizeInput.value) : NaN;
      const packUnitSizeFromDOM = packUnitSizeInput ? parseFloat(packUnitSizeInput.value) : NaN;
    const packSizeValue = (!isNaN(packSizeFromDOM) && packSizeFromDOM > 0) ? packSizeFromDOM : (packSize || 1);
      const packUnitSizeValue = (!isNaN(packUnitSizeFromDOM) && packUnitSizeFromDOM > 0) ? packUnitSizeFromDOM : (packUnitSize || 1);
      const packUnitValue = packUnitSelect?.value || 'l';
      
      // Calculate total quantity: purchaseSize × packSize × packUnitSize
      // e.g., 1 case × 6 bottles × 2L = 12L
      finalPackQuantity = purchaseSize * packSizeValue * packUnitSizeValue;
      finalPackUnit = packUnitValue; // Use the individual unit (e.g., "l" for liters)
      
      // Store the purchase unit in batchPricing for reference
      formData.set("batchPricing", JSON.stringify([{ 
        packQuantity: packSizeValue, 
        packPrice: 0,
        purchaseUnit: purchaseUnit, // Store that it's a "case"
        unitSize: packUnitSizeValue // Store the size per unit (2L)
      }]));
    } else {
      // Single purchase: e.g., "2kg" directly
      finalPackQuantity = purchaseSize;
      finalPackUnit = purchaseUnit;
      formData.set("batchPricing", "");
    }
    
    // Debug logging
    console.log('Form submission values:', {
      isBulkMode,
      purchaseSize,
      purchaseUnit,
      packSize: isBulkMode ? (ev.currentTarget.querySelector('#packSize') as HTMLInputElement)?.value : 'N/A',
      packUnit: isBulkMode ? (ev.currentTarget.querySelector('#packUnit') as HTMLSelectElement)?.value : 'N/A',
      finalPackQuantity,
      finalPackUnit
    });
    
    // Store packQuantity and packUnit
    formData.set("packQuantity", finalPackQuantity.toString());
    formData.set("packUnit", finalPackUnit);
    
    if (selectedSupplierId) {
      formData.set("supplierId", selectedSupplierId.toString());
    }
    onSubmit(formData);
  };

  return (
    <div>
      <form id="ingredient-form" onSubmit={handleSubmit} className="space-y-6">
        {/* Top Row: Basic Info (left) and Allergens (right) */}
        <div className="grid grid-cols-3 gap-6">
          {/* Basic Information Section */}
          <div className="space-y-4 p-5 border border-gray-200 rounded-lg bg-gray-50/50">
            <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4 pb-3 border-b border-gray-300">Basic Information</h3>
            
            {/* Name */}
            <div>
              <label htmlFor="ingredient-name" className="block text-sm font-medium text-gray-700 mb-2">
                Ingredient Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="ingredient-name"
                name="name"
                defaultValue={initialData?.name || ""}
                onFocus={selectAllOnFocus}
                required
                className="w-full px-4 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors bg-white"
                placeholder="e.g., All-Purpose Flour"
              />
            </div>

            {/* Description */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                Description <span className="text-gray-400 text-xs">(Optional)</span>
              </label>
              <textarea
                id="description"
                name="description"
                rows={3}
                defaultValue={initialData?.description || ""}
                onFocus={selectAllOnFocus}
                className="w-full px-4 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors bg-white resize-none"
                placeholder="e.g., Bleached, enriched, pre-sifted"
              ></textarea>
            </div>
          </div>

          {/* Pack Details Section - Spans 2 columns, wider */}
          <div className="col-span-2 p-6 border border-gray-200 rounded-lg bg-gray-50/50">
            {/* Header spanning full width */}
            <div className="flex items-center justify-between mb-8 pb-4 border-b border-gray-300">
              <h3 className="text-base font-semibold text-gray-700 uppercase tracking-wide">Pack Details</h3>
              {/* Purchase Mode Toggle */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-600">Single</span>
                <button
                  type="button"
                  onClick={() => {
                    const newBulkMode = !isBulkPurchaseMode;
                    console.log('IngredientForm: Toggle clicked', { 
                      currentMode: isBulkPurchaseMode, 
                      newMode: newBulkMode,
                      purchaseUnit,
                      packUnit,
                      batchPricing: initialData?.batchPricing
                    });
                    setIsBulkPurchaseMode(newBulkMode);
                    if (newBulkMode) {
                      // Switching to bulk mode - set purchase unit to case if empty
                      if (!purchaseUnit || !packagingUnits.includes(purchaseUnit)) {
                        console.log('IngredientForm: Setting purchaseUnit to "case" for bulk mode');
                        setPurchaseUnit('case');
                      }
                    } else {
                      // Switching to single mode - clear packaging unit, use pack unit
                      if (packagingUnits.includes(purchaseUnit)) {
                        console.log('IngredientForm: Setting purchaseUnit to packUnit for single mode', packUnit);
                        setPurchaseUnit(packUnit || 'kg');
                      }
                    }
                  }}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    isBulkPurchaseMode ? 'bg-emerald-600' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      isBulkPurchaseMode ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
                <span className="text-xs text-gray-600">Bulk</span>
              </div>
            </div>
            
            {/* Single-column vertical layout with better spacing */}
            <div className="space-y-8">
              {/* Purchase Information Section */}
              <div>
                <h4 className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-4">Purchase Information</h4>
                <div className="grid grid-cols-2 gap-5">
                  <div>
                    <label htmlFor="purchaseSize" className="flex items-center gap-1.5 text-sm font-medium text-gray-700 mb-2">
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
                            {isBulkPurchaseMode 
                              ? `How many ${purchaseUnit || 'cases'} you buy (e.g., 1 case)`
                              : 'Quantity you buy (e.g., 2 for 2kg)'}
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
                      onFocus={selectAllOnFocus}
                      onChange={(e) => {
                        const value = parseFloat(e.target.value) || 0;
                        setHasUserModifiedPurchaseSize(true);
                        setPurchaseSize(value);
                      }}
                      required
                      className="w-full px-4 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors bg-white"
                      placeholder="1"
                    />
                  </div>
                  <div>
                    <label htmlFor="purchaseUnit" className="flex items-center gap-1.5 text-sm font-medium text-gray-700 mb-2">
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
                            {isBulkPurchaseMode 
                              ? 'Packaging type (case, box, pack, etc.)'
                              : 'Unit of measurement (kg, L, slices, etc.)'}
                          </div>
                        )}
                      </div>
                    </label>
                    <select
                      id="purchaseUnit"
                      name="purchaseUnit"
                      value={purchaseUnit}
                      onChange={(e) => {
                        // Don't auto-switch modes during initialization
                        if (isInitializing) {
                          console.log('IngredientForm: Skipping purchaseUnit onChange during initialization');
                          return;
                        }
                        
                        const newUnit = e.target.value;
                        console.log('IngredientForm: purchaseUnit changed', { 
                          oldUnit: purchaseUnit, 
                          newUnit, 
                          currentBulkMode: isBulkPurchaseMode 
                        });
                        
                        setPurchaseUnit(newUnit);
                        
                        // If switching to packaging unit, ensure bulk mode is on
                        if (packagingUnits.includes(newUnit)) {
                          console.log('IngredientForm: Switching to bulk mode (packaging unit selected)');
                          setIsBulkPurchaseMode(true);
                        }
                        // Only switch away from bulk mode if user explicitly selects a non-packaging unit
                        // AND we're not loading from batchPricing (which would have already set bulk mode)
                        else if (packagingUnits.includes(purchaseUnit) && !initialData?.batchPricing) {
                          console.log('IngredientForm: Switching to single mode (non-packaging unit selected)');
                          setIsBulkPurchaseMode(false);
                        }
                      }}
                      required
                      className="w-full px-4 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors bg-white"
                    >
                      <option value="">Select...</option>
                      {isBulkPurchaseMode ? (
                        <>
                      <optgroup label="Packaging">
                        <option value="case">case</option>
                        <option value="box">box</option>
                        <option value="pack">pack</option>
                        <option value="carton">carton</option>
                        <option value="bundle">bundle</option>
                      </optgroup>
                        </>
                      ) : (
                        <>
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
                        </>
                      )}
                    </select>
                  </div>
                </div>
              </div>

              {/* Packaging Details Section - Only shown in bulk mode */}
              {isBulkPurchaseMode && (
                <div className="pt-6 border-t border-gray-200">
                  <h4 className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-4">Packaging Details</h4>
                  <div className="bg-white/60 border border-gray-200 rounded-lg p-5 space-y-4">
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <label htmlFor="packSize" className="flex items-center gap-1.5 text-sm font-medium text-gray-700 mb-2">
                          Quantity <span className="text-red-500">*</span>
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
                                How many individual units per {purchaseUnit || 'case'}? (e.g., 6 bottles)
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
                          onFocus={selectAllOnFocus}
                          onChange={(e) => {
                            const value = e.target.value;
                            setHasUserModifiedPackSize(true);
                            if (value === '') {
                              setPackSize(1);
                              return;
                            }
                            const numValue = parseFloat(value);
                            if (!isNaN(numValue) && numValue >= 1) {
                                setPackSize(Math.floor(numValue));
                            }
                          }}
                          onBlur={(e) => {
                            const value = parseFloat(e.target.value);
                            if (isNaN(value) || value < 1) {
                              setPackSize(1);
                            } else {
                              setPackSize(Math.floor(value));
                            }
                          }}
                          required
                          className="w-full px-4 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors bg-white"
                          placeholder="6"
                        />
                      </div>
                      <div>
                        <label htmlFor="packUnitSize" className="flex items-center gap-1.5 text-sm font-medium text-gray-700 mb-2">
                          Size <span className="text-red-500">*</span>
                          <div className="relative">
                            <button
                              type="button"
                              className="focus:outline-none"
                              onMouseEnter={() => setShowTooltip({ ...showTooltip, packUnitSize: true })}
                              onMouseLeave={() => setShowTooltip({ ...showTooltip, packUnitSize: false })}
                            >
                              <svg className="w-4 h-4 text-gray-400 hover:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                            </button>
                            {showTooltip.packUnitSize && (
                              <div className="absolute left-0 top-6 z-50 w-56 p-2 bg-gray-900 text-white text-xs rounded shadow-lg">
                                Size per unit (e.g., 2 for 2L bottles)
                              </div>
                            )}
                          </div>
                        </label>
                        <input
                          type="number"
                          id="packUnitSize"
                          name="packUnitSize"
                          step="0.01"
                          min="0.01"
                          value={packUnitSize}
                          onFocus={selectAllOnFocus}
                          onChange={(e) => {
                            const value = parseFloat(e.target.value) || 0;
                            setPackUnitSize(value);
                          }}
                          required
                          className="w-full px-4 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors bg-white"
                          placeholder="2"
                        />
                      </div>
                      <div>
                        <label htmlFor="packUnit" className="flex items-center gap-1.5 text-sm font-medium text-gray-700 mb-2">
                          Unit <span className="text-red-500">*</span>
                          <div className="relative">
                            <button
                              type="button"
                              className="focus:outline-none"
                              onMouseEnter={() => setShowTooltip({ ...showTooltip, packUnit: true })}
                              onMouseLeave={() => setShowTooltip({ ...showTooltip, packUnit: false })}
                            >
                              <svg className="w-4 h-4 text-gray-400 hover:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                            </button>
                            {showTooltip.packUnit && (
                              <div className="absolute left-0 top-6 z-50 w-56 p-2 bg-gray-900 text-white text-xs rounded shadow-lg">
                                Unit of measurement (L, ml, kg, etc.)
                              </div>
                            )}
                          </div>
                        </label>
                        <select
                          id="packUnit"
                          name="packUnit"
                          value={packUnit}
                          onChange={(e) => setPackUnit(e.target.value)}
                          required
                          className="w-full px-4 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors bg-white"
                        >
                          <option value="">Select...</option>
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
                        </select>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 italic">
                      Example: 1 {purchaseUnit || 'case'} × {packSize || 6} × {packUnitSize || 2}{packUnit || 'L'} = {(purchaseSize || 1) * (packSize || 6) * (packUnitSize || 2)}{packUnit || 'L'} total
                    </p>
                  </div>
                </div>
              )}

              {/* Pricing Section */}
              <div className="pt-6 border-t border-gray-200">
                <h4 className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-4">Pricing</h4>
                <div>
                  <label htmlFor="packPrice" className="flex items-center gap-1.5 text-sm font-medium text-gray-700 mb-2">
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
                      onFocus={selectAllOnFocus}
                      onChange={(e) => setPackPrice(parseFloat(e.target.value) || 0)}
                      required
                      className="w-full pl-8 pr-4 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors bg-white"
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

              {/* Servings Section - Moved below Price */}
              <div className="pt-6 border-t border-gray-200">
                <h4 className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-4">Servings <span className="text-gray-400 text-xs font-normal normal-case">(Optional)</span></h4>
                <div>
                  <label htmlFor="servings" className="flex items-center gap-1.5 text-sm font-medium text-gray-700 mb-2">
                    Number of Servings
                    <div className="relative">
                      <button
                        type="button"
                        className="focus:outline-none"
                        onMouseEnter={() => setShowTooltip({ ...showTooltip, servings: true })}
                        onMouseLeave={() => setShowTooltip({ ...showTooltip, servings: false })}
                      >
                        <svg className="w-4 h-4 text-gray-400 hover:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </button>
                      {showTooltip.servings && (
                        <div className="absolute left-0 top-6 z-50 w-64 p-2 bg-gray-900 text-white text-xs rounded shadow-lg">
                          How many servings can you get from this purchase? The app will automatically calculate the serving size for you.
                        </div>
                      )}
                    </div>
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      id="servings"
                      name="servings"
                      step="1"
                      min="1"
                      value={servings || ""}
                      onFocus={selectAllOnFocus}
                      onChange={(e) => {
                        const value = e.target.value;
                        setServings(value === '' ? null : parseFloat(value) || null);
                      }}
                      className="flex-1 px-4 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors bg-white"
                      placeholder="e.g., 200"
                    />
                    <select
                      id="servingsUnit"
                      name="servingsUnit"
                      value={servingsUnit}
                      onChange={(e) => setServingsUnit(e.target.value)}
                      className="px-4 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors bg-white"
                    >
                      <option value="servings">servings</option>
                      <option value="portions">portions</option>
                      <option value="g">g</option>
                      <option value="kg">kg</option>
                      <option value="ml">ml</option>
                      <option value="l">l</option>
                      <option value="each">each</option>
                      <option value="slices">slices</option>
                      <option value="oz">oz</option>
                      <option value="lb">lb</option>
                      <option value="cup">cup</option>
                      <option value="tbsp">tbsp</option>
                      <option value="tsp">tsp</option>
                    </select>
                  </div>
                  {calculatedServingSize && (
                    <p className="text-xs text-emerald-700 font-medium mt-1.5">
                      Each serving: {calculatedServingSize.amount.toFixed(2)} {calculatedServingSize.unit}
                    </p>
                  )}
                  {servings && packPrice > 0 && (
                    <p className="text-xs text-emerald-700 font-medium mt-1">
                      Price per serving: £{(packPrice / servings).toFixed(4)} per {servingsUnit}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Custom Unit Conversions - Moved to its own row, wider */}
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
                    onFocus={selectAllOnFocus}
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

        {/* Second Row: Supplier and Notes - Narrower */}
        <div className="grid grid-cols-2 gap-4">
          {/* Supplier Section - Narrower */}
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
              defaultValue={(() => {
                // Extract text from JSON if notes contains JSON with servings
                if (initialData?.notes) {
                  try {
                    const parsed = JSON.parse(initialData.notes);
                    if (parsed && typeof parsed === 'object') {
                      // If it's JSON with a text field, return the text
                      if (parsed.text) {
                        return parsed.text;
                      }
                      // If it's JSON but no text field, return empty (servings-only data)
                      return "";
                    }
                  } catch {
                    // Not JSON, return as-is (plain text notes)
                    return initialData.notes;
                  }
                }
                return "";
              })()}
              onFocus={selectAllOnFocus}
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
                    onFocus={selectAllOnFocus}
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
                    onFocus={selectAllOnFocus}
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
                  onFocus={selectAllOnFocus}
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
                  onFocus={selectAllOnFocus}
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