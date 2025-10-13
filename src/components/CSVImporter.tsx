"use client";

import { useState } from "react";
import Papa from "papaparse";

interface CSVImporterProps {
  companyId: number;
  onComplete: () => void;
}

export function CSVImporter({ companyId, onComplete }: CSVImporterProps) {
  const [show, setShow] = useState(false);
  const [importing, setImporting] = useState(false);
  const [preview, setPreview] = useState<any[]>([]);

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        setPreview(results.data.slice(0, 5)); // Show first 5 rows
      },
    });
  }

  async function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setImporting(true);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        try {
          const ingredients = results.data.map((row: any) => ({
            name: row.name || row.Name,
            supplier: row.supplier || row.Supplier || null,
            packQuantity: parseFloat(row.packQuantity || row["Pack Quantity"] || row.quantity),
            packUnit: row.packUnit || row["Pack Unit"] || row.unit || "g",
            packPrice: parseFloat(row.packPrice || row["Pack Price"] || row.price),
            currency: row.currency || row.Currency || "GBP",
            densityGPerMl: row.densityGPerMl ? parseFloat(row.densityGPerMl) : null,
            allergens: row.allergens ? row.allergens.split(",").map((a: string) => a.trim()) : [],
            notes: row.notes || row.Notes || null,
          }));

          const res = await fetch("/api/ingredients/bulk", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              ingredients,
              companyId,
            }),
          });

          if (res.ok) {
            const data = await res.json();
            alert(`Successfully imported ${data.imported} ingredients!`);
            setShow(false);
            onComplete();
          } else {
            alert("Failed to import ingredients");
          }
        } catch (error) {
          alert("Import failed");
        } finally {
          setImporting(false);
        }
      },
    });
  }

  return (
    <>
      <button
        onClick={() => setShow(true)}
        className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
        </svg>
        Import CSV
      </button>

      <AnimatePresence>
        {show && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={() => setShow(false)}
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="bg-white rounded-xl shadow-2xl max-w-2xl w-full p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Import Ingredients from CSV</h2>

              <div className="mb-6">
                <p className="text-sm text-gray-600 mb-4">
                  Upload a CSV file with the following columns:
                </p>
                <div className="bg-gray-50 p-4 rounded-lg text-sm font-mono">
                  <code>name, supplier, packQuantity, packUnit, packPrice, currency</code>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Optional columns: densityGPerMl, allergens (comma-separated), notes
                </p>
              </div>

              <div className="mb-6">
                <label className="block w-full">
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-purple-400 transition-colors cursor-pointer">
                    <svg className="w-12 h-12 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    <p className="text-sm text-gray-600">
                      {importing ? "Importing..." : "Click to select CSV file"}
                    </p>
                  </div>
                  <input
                    type="file"
                    accept=".csv"
                    onChange={handleImport}
                    disabled={importing}
                    className="hidden"
                  />
                </label>
              </div>

              {preview.length > 0 && (
                <div className="mb-4">
                  <h3 className="text-sm font-medium text-gray-900 mb-2">Preview (first 5 rows):</h3>
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-xs">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-2 py-1 text-left">Name</th>
                          <th className="px-2 py-1 text-left">Qty</th>
                          <th className="px-2 py-1 text-left">Price</th>
                        </tr>
                      </thead>
                      <tbody>
                        {preview.map((row, i) => (
                          <tr key={i} className="border-t">
                            <td className="px-2 py-1">{row.name}</td>
                            <td className="px-2 py-1">{row.packQuantity} {row.packUnit}</td>
                            <td className="px-2 py-1">{row.packPrice}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => setShow(false)}
                  className="flex-1 px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

