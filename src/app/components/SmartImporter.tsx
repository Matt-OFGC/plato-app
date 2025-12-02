"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import * as XLSX from "xlsx";
import { InvoiceScanner } from "./InvoiceScanner";
import { MenuScanner } from "./MenuScanner";
import { useRouter } from "next/navigation";

type ImportType = 'ingredients' | 'recipes';

interface ParsedData {
  headers: string[];
  rows: any[];
  detectedType: 'ingredients' | 'recipes' | 'unknown';
  suggestedMappings: Record<string, string>;
  sheets?: string[];
  selectedSheet?: string;
}

interface ImportResult {
  success: boolean;
  imported: number;
  failed: number;
  skipped: number;
  errors: Array<{ row: number; error: string; data: any }>;
}

interface SmartImporterProps {
  type?: ImportType;
  onComplete?: () => void;
}

type Step = 'method' | 'upload' | 'scanner' | 'selectSheet' | 'mapping' | 'preview' | 'importing' | 'complete';

const INGREDIENT_FIELDS = [
  { key: 'name', label: 'Name', required: true, description: 'Ingredient name' },
  { key: 'supplier', label: 'Supplier', required: false, description: 'Supplier or vendor name' },
  { key: 'packQuantity', label: 'Pack Quantity', required: true, description: 'Package size (number)' },
  { key: 'packUnit', label: 'Pack Unit', required: true, description: 'Unit of measurement (g, kg, ml, l, etc.)' },
  { key: 'packPrice', label: 'Pack Price', required: true, description: 'Price per package' },
  { key: 'currency', label: 'Currency', required: false, description: 'Currency code (default: GBP)' },
  { key: 'densityGPerMl', label: 'Density (g/ml)', required: false, description: 'For volume to weight conversion' },
  { key: 'allergens', label: 'Allergens', required: false, description: 'Comma-separated list' },
  { key: 'notes', label: 'Notes', required: false, description: 'Additional notes' },
];

const RECIPE_FIELDS = [
  { key: 'name', label: 'Name', required: true, description: 'Recipe name' },
  { key: 'description', label: 'Description', required: false, description: 'Recipe description' },
  { key: 'yieldQuantity', label: 'Yield Quantity', required: true, description: 'Batch yield (number)' },
  { key: 'yieldUnit', label: 'Yield Unit', required: true, description: 'Yield unit (g, ml, each, slices)' },
  { key: 'method', label: 'Method', required: false, description: 'Cooking instructions' },
  { key: 'bakeTime', label: 'Bake Time', required: false, description: 'Bake time in minutes' },
  { key: 'bakeTemp', label: 'Bake Temperature', required: false, description: 'Oven temperature in °C' },
  { key: 'category', label: 'Category', required: false, description: 'Recipe category' },
  { key: 'storage', label: 'Storage', required: false, description: 'Storage instructions' },
  { key: 'shelfLife', label: 'Shelf Life', required: false, description: 'How long it keeps' },
];

export function SmartImporter({ type, onComplete }: SmartImporterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState<Step>('method');
  const [importType, setImportType] = useState<ImportType | null>(type || null);
  const [importMethod, setImportMethod] = useState<'file' | 'scanner' | null>(null);
  const [parsedData, setParsedData] = useState<ParsedData | null>(null);
  const [columnMapping, setColumnMapping] = useState<Record<string, string>>({});
  const [importOptions, setImportOptions] = useState({
    skipDuplicates: false,
    updateExisting: true, // Default to true to prevent duplicate errors
  });
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [progress, setProgress] = useState(0);
  const [availableSheets, setAvailableSheets] = useState<string[]>([]);
  const [selectedSheet, setSelectedSheet] = useState<string>('');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);

  const fields = importType === 'ingredients' ? INGREDIENT_FIELDS : RECIPE_FIELDS;

  const handleFileUpload = async (file: File) => {
    try {
      setUploadedFile(file);
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/import/parse', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to parse file');
      }

      const data: any = await response.json();

      // Check if we need sheet selection
      if (data.requiresSheetSelection && data.sheets) {
        setAvailableSheets(data.sheets);
        setStep('selectSheet');
        return;
      }

      // Direct parsing (CSV or single-sheet Excel)
      setParsedData(data);

      // Set import type if not already set
      if (!importType && data.detectedType !== 'unknown') {
        setImportType(data.detectedType);
      }

      // Apply suggested mappings
      setColumnMapping(data.suggestedMappings);
      setStep('mapping');

    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to parse file');
    }
  };

  const handleSheetSelection = async (sheetName: string) => {
    try {
      if (!uploadedFile) return;

      const formData = new FormData();
      formData.append('file', uploadedFile);
      formData.append('sheet', sheetName);

      const response = await fetch('/api/import/parse', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to parse sheet');
      }

      const data: ParsedData = await response.json();
      setParsedData(data);
      setSelectedSheet(sheetName);

      // Set import type if not already set
      if (!importType && data.detectedType !== 'unknown') {
        setImportType(data.detectedType);
      }

      // Apply suggested mappings
      setColumnMapping(data.suggestedMappings);
      setStep('mapping');

    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to parse sheet');
    }
  };

  const handleFileDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFileUpload(file);
  }, []);

  const handleImport = async () => {
    if (!parsedData || !importType) return;

    setStep('importing');
    setImporting(true);
    setProgress(0);

    try {
      const endpoint = importType === 'ingredients' 
        ? '/api/import/ingredients' 
        : '/api/import/recipes';

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rows: parsedData.rows,
          columnMapping,
          options: importOptions,
        }),
      });

      const result: ImportResult = await response.json();
      setImportResult(result);
      setProgress(100);
      setStep('complete');

      if (result.imported > 0 && onComplete) {
        onComplete();
      }

    } catch (error) {
      alert(error instanceof Error ? error.message : 'Import failed');
      setStep('preview');
    } finally {
      setImporting(false);
    }
  };

  const downloadTemplate = () => {
    // Use importType if set, otherwise fall back to type prop
    const currentType = importType || type;
    if (!currentType) {
      alert('Please select what you want to import first (Ingredients or Recipes)');
      return;
    }
    
    const fields = currentType === 'ingredients' ? INGREDIENT_FIELDS : RECIPE_FIELDS;
    const headers = fields.map(f => f.label);
    
    // Create sample data
    const sampleRow = currentType === 'ingredients'
      ? ['Flour', 'Acme Suppliers', '1000', 'g', '2.50', 'GBP', '', 'Gluten', 'Organic']
      : ['Sourdough Bread', 'Artisan bread with natural starter', '800', 'g', 'Mix, proof, bake', '45', '220', 'Bread', 'Room temperature', '3 days'];

    const ws = XLSX.utils.aoa_to_sheet([headers, sampleRow]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, currentType === 'ingredients' ? 'Ingredients' : 'Recipes');
    XLSX.writeFile(wb, `${currentType}_template.xlsx`);
  };

  const reset = () => {
    setStep('method');
    setImportMethod(null);
    setParsedData(null);
    setColumnMapping({});
    setImportResult(null);
    setProgress(0);
    setAvailableSheets([]);
    setSelectedSheet('');
    setUploadedFile(null);
    if (!type) setImportType(null);
  };

  const close = () => {
    setIsOpen(false);
    setTimeout(reset, 300);
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center gap-2 px-5 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors shadow-sm hover:shadow-md font-medium"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
        <span>Smart Import</span>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={close}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-4 flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-white">Smart Data Importer</h2>
                  <p className="text-blue-100 text-sm mt-1">
                    {step === 'method' && 'Choose your import method'}
                    {step === 'upload' && 'Upload your file to get started'}
                    {step === 'scanner' && 'Use AI to scan your documents'}
                    {step === 'selectSheet' && 'Choose which sheet to import'}
                    {step === 'mapping' && 'Map your columns to our fields'}
                    {step === 'preview' && 'Review and confirm your import'}
                    {step === 'importing' && 'Importing your data...'}
                    {step === 'complete' && 'Import complete!'}
                  </p>
                </div>
                <button
                  onClick={close}
                  className="text-white hover:bg-white/20 p-2 rounded-lg transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Progress Bar */}
              <div className="h-1 bg-gray-200">
                <motion.div
                  className="h-full bg-gradient-to-r from-blue-500 to-purple-500"
                  initial={{ width: '0%' }}
                  animate={{
                    width: step === 'method' ? '0%' : step === 'upload' || step === 'scanner' ? '10%' : step === 'selectSheet' ? '30%' : step === 'mapping' ? '50%' : step === 'preview' ? '70%' : '100%'
                  }}
                  transition={{ duration: 0.3 }}
                />
              </div>

              {/* Content */}
              <div className="p-6 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 140px)' }}>
                {/* Step 0: Method Selection */}
                {step === 'method' && (
                  <div className="space-y-6">
                    {!type && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-3">
                          What are you importing?
                        </label>
                        <div className="grid grid-cols-2 gap-4">
                          <button
                            onClick={() => setImportType('ingredients')}
                            className={`p-6 rounded-xl border-2 transition-all ${
                              importType === 'ingredients'
                                ? 'border-blue-500 bg-blue-50'
                                : 'border-gray-200 hover:border-blue-300'
                            }`}
                          >
                            <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center mx-auto mb-3">
                              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                              </svg>
                            </div>
                            <h3 className="font-semibold text-gray-900">Ingredients</h3>
                            <p className="text-sm text-gray-500 mt-1">Import ingredient data</p>
                          </button>

                          <button
                            onClick={() => setImportType('recipes')}
                            className={`p-6 rounded-xl border-2 transition-all ${
                              importType === 'recipes'
                                ? 'border-purple-500 bg-purple-50'
                                : 'border-gray-200 hover:border-purple-300'
                            }`}
                          >
                            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center mx-auto mb-3">
                              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                            </div>
                            <h3 className="font-semibold text-gray-900">Recipes</h3>
                            <p className="text-sm text-gray-500 mt-1">Import recipe information</p>
                          </button>
                        </div>
                      </div>
                    )}

                    {(importType || type) && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-3">
                          How would you like to import?
                        </label>
                        <div className="grid grid-cols-2 gap-4">
                          <button
                            onClick={() => {
                              setImportMethod('file');
                              setStep('upload');
                            }}
                            className="p-6 rounded-xl border-2 border-gray-200 hover:border-blue-500 hover:bg-blue-50 transition-all group"
                          >
                            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                              </svg>
                            </div>
                            <h3 className="font-semibold text-gray-900">Upload File</h3>
                            <p className="text-sm text-gray-500 mt-1">CSV or Excel spreadsheet</p>
                          </button>

                          <button
                            onClick={() => {
                              setImportMethod('scanner');
                              setStep('scanner');
                            }}
                            className="p-6 rounded-xl border-2 border-gray-200 hover:border-purple-500 hover:bg-purple-50 transition-all group"
                          >
                            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                            </div>
                            <h3 className="font-semibold text-gray-900">AI Scanner</h3>
                            <p className="text-sm text-gray-500 mt-1">
                              {importType === 'ingredients' ? 'Scan invoices' : 'Scan menus'}
                            </p>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Step: AI Scanner */}
                {step === 'scanner' && importType && (
                  <div className="relative">
                    {importType === 'ingredients' ? (
                      <InvoiceScanner
                        onIngredientsExtracted={async (ingredients) => {
                          // Handle the scanned ingredients
                          try {
                            const response = await fetch("/api/ingredients/bulk", {
                              method: "POST",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({ ingredients }),
                            });

                            if (!response.ok) throw new Error("Failed to create ingredients");

                            setStep('complete');
                            setImportResult({
                              success: true,
                              imported: ingredients.length,
                              failed: 0,
                              skipped: 0,
                              errors: [],
                            });
                            
                            if (onComplete) onComplete();
                          } catch (error) {
                            alert("Failed to import ingredients");
                          }
                        }}
                        onClose={() => setStep('method')}
                      />
                    ) : (
                      <MenuScanner
                        onRecipesExtracted={async (recipes) => {
                          // Handle the scanned recipes
                          try {
                            const response = await fetch("/api/recipes/bulk", {
                              method: "POST",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({ recipes }),
                            });

                            if (!response.ok) throw new Error("Failed to create recipes");

                            setStep('complete');
                            setImportResult({
                              success: true,
                              imported: recipes.length,
                              failed: 0,
                              skipped: 0,
                              errors: [],
                            });
                            
                            if (onComplete) onComplete();
                          } catch (error) {
                            alert("Failed to import recipes");
                          }
                        }}
                        onClose={() => setStep('method')}
                      />
                    )}
                  </div>
                )}

                {/* Step 1: Upload */}
                {step === 'upload' && (
                  <div className="space-y-6">
                    {(importType || type) && (
                      <>
                        <div
                          onDrop={handleFileDrop}
                          onDragOver={(e) => e.preventDefault()}
                          className="border-2 border-dashed border-gray-300 rounded-xl p-12 text-center hover:border-blue-400 transition-colors cursor-pointer bg-gradient-to-br from-gray-50 to-blue-50"
                        >
                          <input
                            type="file"
                            accept=".csv,.xlsx,.xls"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) handleFileUpload(file);
                            }}
                            className="hidden"
                            id="file-upload"
                          />
                          <label htmlFor="file-upload" className="cursor-pointer">
                            <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
                              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                              </svg>
                            </div>
                            <p className="text-lg font-medium text-gray-900 mb-2">
                              Drop your file here or click to browse
                            </p>
                            <p className="text-sm text-gray-500">
                              Supports .CSV, .XLSX, and .XLS files
                            </p>
                          </label>
                        </div>

                        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                          <div className="flex items-start gap-3">
                            <svg className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <div className="flex-1">
                              <h4 className="font-medium text-blue-900 mb-1">Need a template?</h4>
                              <p className="text-sm text-blue-700 mb-3">
                                Download our template to see the exact format we support. You can fill it out and upload it back.
                              </p>
                              <button
                                onClick={downloadTemplate}
                                className="inline-flex items-center gap-2 px-3 py-1.5 bg-white border border-blue-300 text-blue-700 rounded-lg hover:bg-blue-50 transition-colors text-sm font-medium"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                Download Template
                              </button>
                            </div>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                )}

                {/* Step 2: Sheet Selection */}
                {step === 'selectSheet' && (
                  <SheetSelectionStep
                    sheets={availableSheets}
                    onSelect={handleSheetSelection}
                    onBack={() => setStep('upload')}
                  />
                )}

                {/* Step 3: Column Mapping */}
                {step === 'mapping' && parsedData && (
                  <ColumnMappingStep
                    parsedData={parsedData}
                    fields={fields}
                    columnMapping={columnMapping}
                    onChange={setColumnMapping}
                    onNext={() => setStep('preview')}
                    onBack={() => {
                      if (availableSheets.length > 0) {
                        setStep('selectSheet');
                      } else if (importMethod === 'file') {
                        setStep('upload');
                      } else {
                        setStep('method');
                      }
                    }}
                  />
                )}

                {/* Step 4: Preview */}
                {step === 'preview' && parsedData && (
                  <PreviewStep
                    parsedData={parsedData}
                    columnMapping={columnMapping}
                    fields={fields}
                    importOptions={importOptions}
                    onOptionsChange={setImportOptions}
                    onImport={handleImport}
                    onBack={() => setStep('mapping')}
                  />
                )}

                {/* Step 5: Importing */}
                {step === 'importing' && (
                  <div className="text-center py-12">
                    <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
                      <svg className="w-12 h-12 text-white animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">Importing your data...</h3>
                    <p className="text-gray-600">Please wait while we process your file</p>
                  </div>
                )}

                {/* Step 6: Complete */}
                {step === 'complete' && importResult && (
                  <ResultsStep
                    result={importResult}
                    onClose={close}
                    onImportMore={reset}
                  />
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

// Sheet Selection Step Component
function SheetSelectionStep({
  sheets,
  onSelect,
  onBack,
}: {
  sheets: string[];
  onSelect: (sheet: string) => void;
  onBack: () => void;
}) {
  return (
    <div className="space-y-6">
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <svg className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <div className="flex-1">
            <h4 className="font-medium text-blue-900">Multiple Sheets Detected</h4>
            <p className="text-sm text-blue-700 mt-1">
              Your Excel file contains {sheets.length} sheets. Please select which one you'd like to import.
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-3">
        {sheets.map((sheet, index) => (
          <button
            key={sheet}
            onClick={() => onSelect(sheet)}
            className="group relative p-6 bg-white border-2 border-gray-200 rounded-xl hover:border-blue-500 hover:shadow-lg transition-all text-left"
          >
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                  {sheet}
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  Sheet {index + 1} of {sheets.length}
                </p>
              </div>
              <svg className="w-6 h-6 text-gray-400 group-hover:text-blue-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </button>
        ))}
      </div>

      <div className="flex gap-3 pt-4">
        <button
          onClick={onBack}
          className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
        >
          Choose Different File
        </button>
      </div>
    </div>
  );
}

// Column Mapping Step Component
function ColumnMappingStep({
  parsedData,
  fields,
  columnMapping,
  onChange,
  onNext,
  onBack,
}: {
  parsedData: ParsedData;
  fields: any[];
  columnMapping: Record<string, string>;
  onChange: (mapping: Record<string, string>) => void;
  onNext: () => void;
  onBack: () => void;
}) {
  const requiredFieldsMapped = fields
    .filter(f => f.required)
    .every(f => columnMapping[f.key]);

  return (
    <div className="space-y-6">
      <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <svg className="w-5 h-5 text-yellow-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <h4 className="font-medium text-yellow-900">Map Your Columns</h4>
            <p className="text-sm text-yellow-700 mt-1">
              Match your file's columns to our system fields. We've suggested matches, but you can change them.
              Fields marked with * are required.
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {fields.map(field => (
          <div key={field.key} className="bg-gray-50 rounded-lg p-4">
            <label className="block text-sm font-medium text-gray-900 mb-2">
              {field.label} {field.required && <span className="text-red-500">*</span>}
              <span className="text-gray-500 font-normal ml-2 text-xs">{field.description}</span>
            </label>
            <select
              value={columnMapping[field.key] || ''}
              onChange={(e) => {
                onChange({ ...columnMapping, [field.key]: e.target.value });
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">-- Skip this field --</option>
              {parsedData.headers.map(header => (
                <option key={header} value={header}>
                  {header}
                </option>
              ))}
            </select>
          </div>
        ))}
      </div>

      <div className="flex gap-3 pt-4">
        <button
          onClick={onBack}
          className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
        >
          Back
        </button>
        <button
          onClick={onNext}
          disabled={!requiredFieldsMapped}
          className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Continue to Preview
        </button>
      </div>
    </div>
  );
}

// Preview Step Component
function PreviewStep({
  parsedData,
  columnMapping,
  fields,
  importOptions,
  onOptionsChange,
  onImport,
  onBack,
}: {
  parsedData: ParsedData;
  columnMapping: Record<string, string>;
  fields: any[];
  importOptions: any;
  onOptionsChange: (options: any) => void;
  onImport: () => void;
  onBack: () => void;
}) {
  const mappedFields = Object.entries(columnMapping).filter(([_, v]) => v);
  const previewRows = parsedData.rows.slice(0, 5);

  return (
    <div className="space-y-6">
      <div className="bg-green-50 border border-green-200 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <svg className="w-5 h-5 text-green-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <h4 className="font-medium text-green-900">Ready to Import</h4>
            <p className="text-sm text-green-700 mt-1">
              Found <strong>{parsedData.rows.length}</strong> rows. All will be imported. Preview first 5 below.
            </p>
          </div>
        </div>
      </div>

      {/* Import Options */}
      <div className="space-y-3">
        <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
          <input
            type="checkbox"
            checked={importOptions.skipDuplicates}
            onChange={(e) => onOptionsChange({ ...importOptions, skipDuplicates: e.target.checked })}
            className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
          />
          <div className="flex-1">
            <div className="font-medium text-gray-900">Skip Duplicates</div>
            <div className="text-sm text-gray-600">Don't import items that already exist</div>
          </div>
        </label>

        <label className="flex items-center gap-3 p-3 bg-emerald-50 border border-emerald-200 rounded-lg cursor-pointer hover:bg-emerald-100 transition-colors">
          <input
            type="checkbox"
            checked={importOptions.updateExisting}
            onChange={(e) => onOptionsChange({ ...importOptions, updateExisting: e.target.checked })}
            className="w-4 h-4 text-emerald-600 rounded focus:ring-2 focus:ring-emerald-500"
          />
          <div className="flex-1">
            <div className="font-medium text-emerald-900 flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Update Existing (Recommended)
            </div>
            <div className="text-sm text-emerald-700">Update items if they already exist - prevents duplicate errors</div>
          </div>
        </label>
      </div>

      {/* Preview Table */}
      <div>
        <h4 className="font-medium text-gray-900 mb-3">
          Preview (first 5 of {parsedData.rows.length} rows)
        </h4>
        <div className="overflow-x-auto border border-gray-200 rounded-lg">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {mappedFields.map(([key, header]) => (
                  <th key={key} className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    {fields.find(f => f.key === key)?.label || key}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {previewRows.map((row, i) => (
                <tr key={i} className="hover:bg-gray-50">
                  {mappedFields.map(([key, header]) => (
                    <td key={key} className="px-4 py-3 text-sm text-gray-900 whitespace-nowrap">
                      {String(row[header] || '')}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {parsedData.rows.length > 5 && (
          <p className="text-sm text-gray-500 mt-2 text-center">
            ... and {parsedData.rows.length - 5} more rows will be imported
          </p>
        )}
      </div>

      <div className="flex gap-3 pt-4">
        <button
          onClick={onBack}
          className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
        >
          Back
        </button>
        <button
          onClick={onImport}
          className="flex-1 px-4 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 transition-colors font-medium flex items-center justify-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          Start Import
        </button>
      </div>
    </div>
  );
}

// Results Step Component
function ResultsStep({
  result,
  onClose,
  onImportMore,
}: {
  result: ImportResult;
  onClose: () => void;
  onImportMore: () => void;
}) {
  const hasErrors = result.errors.length > 0;

  return (
    <div className="space-y-6">
      <div className={`rounded-xl p-6 ${hasErrors ? 'bg-yellow-50 border border-yellow-200' : 'bg-green-50 border border-green-200'}`}>
        <div className="flex items-start gap-4">
          <div className={`w-16 h-16 rounded-full flex items-center justify-center flex-shrink-0 ${hasErrors ? 'bg-yellow-100' : 'bg-green-100'}`}>
            {hasErrors ? (
              <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            ) : (
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
          </div>
          <div className="flex-1">
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Import Complete</h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Successfully imported:</span>
                <span className="font-bold text-green-600">{result.imported}</span>
              </div>
              {result.skipped > 0 && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Skipped (duplicates):</span>
                  <span className="font-bold text-yellow-600">{result.skipped}</span>
                </div>
              )}
              {result.failed > 0 && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Failed:</span>
                  <span className="font-bold text-red-600">{result.failed}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Error Details */}
      {hasErrors && (
        <div>
          <h4 className="font-medium text-gray-900 mb-3">Errors ({result.errors.length})</h4>
          <div className="max-h-64 overflow-y-auto space-y-2">
            {result.errors.slice(0, 10).map((error, i) => (
              <div key={i} className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm">
                <div className="font-medium text-red-900">Row {error.row}: {error.error}</div>
                <div className="text-red-700 text-xs mt-1">
                  {Object.entries(error.data).slice(0, 3).map(([k, v]) => `${k}: ${v}`).join(', ')}
                </div>
              </div>
            ))}
            {result.errors.length > 10 && (
              <p className="text-sm text-gray-600 text-center">
                ... and {result.errors.length - 10} more errors
              </p>
            )}
          </div>
        </div>
      )}

      <div className="flex gap-3 pt-4">
        <button
          onClick={onImportMore}
          className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
        >
          Import More
        </button>
        <button
          onClick={onClose}
          className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-colors font-medium"
        >
          Done
        </button>
      </div>
    </div>
  );
}

