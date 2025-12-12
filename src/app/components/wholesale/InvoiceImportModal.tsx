"use client";

import { useState, useRef } from "react";

interface InvoiceImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  companyId: number;
}

interface ExtractedData {
  customerName: string;
  invoiceNumber: string;
  invoiceDate: string;
  dueDate: string;
  items: {
    description: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }[];
  subtotal: number;
  tax?: number;
  total: number;
  notes?: string;
}

export function InvoiceImportModal({
  isOpen,
  onClose,
  onSuccess,
  companyId,
}: InvoiceImportModalProps) {
  const [step, setStep] = useState<'upload' | 'extracting' | 'review' | 'creating' | 'complete'>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [extractedData, setExtractedData] = useState<ExtractedData | null>(null);
  const [editedData, setEditedData] = useState<ExtractedData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setError(null);

      // Create preview for images
      if (selectedFile.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setFilePreview(reader.result as string);
        };
        reader.readAsDataURL(selectedFile);
      } else if (selectedFile.type === 'application/pdf') {
        setFilePreview('pdf'); // Just a flag
      }
    }
  };

  const handleExtract = async () => {
    if (!file) return;

    setStep('extracting');
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('companyId', companyId.toString());

      const response = await fetch('/api/wholesale/import-invoice', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        setExtractedData(data.extractedData);
        setEditedData(data.extractedData);
        setStep('review');
      } else {
        setError(data.error || 'Failed to extract invoice data');
        setStep('upload');
      }
    } catch (err) {
      setError('Network error. Please try again.');
      setStep('upload');
    }
  };

  const handleCreate = async () => {
    if (!editedData) return;

    setStep('creating');
    setError(null);

    try {
      const response = await fetch('/api/wholesale/invoices/from-import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editedData),
      });

      if (response.ok) {
        setStep('complete');
        setTimeout(() => {
          onSuccess();
          handleClose();
        }, 2000);
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to create invoice');
        setStep('review');
      }
    } catch (err) {
      setError('Network error. Please try again.');
      setStep('review');
    }
  };

  const handleClose = () => {
    setStep('upload');
    setFile(null);
    setFilePreview(null);
    setExtractedData(null);
    setEditedData(null);
    setError(null);
    onClose();
  };

  const updateItem = (index: number, field: string, value: any) => {
    if (!editedData) return;

    const updatedItems = [...editedData.items];
    updatedItems[index] = { ...updatedItems[index], [field]: value };

    // Recalculate total for this item
    if (field === 'quantity' || field === 'unitPrice') {
      updatedItems[index].total = updatedItems[index].quantity * updatedItems[index].unitPrice;
    }

    // Recalculate subtotal and total
    const subtotal = updatedItems.reduce((sum, item) => sum + item.total, 0);
    const total = subtotal + (editedData.tax || 0);

    setEditedData({
      ...editedData,
      items: updatedItems,
      subtotal,
      total,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              {step === 'upload' && 'Import Existing Invoice'}
              {step === 'extracting' && 'Extracting Invoice Data...'}
              {step === 'review' && 'Review & Confirm'}
              {step === 'creating' && 'Creating Order...'}
              {step === 'complete' && 'Import Complete!'}
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              {step === 'upload' && 'Upload a PDF or image of an invoice you\'ve already sent'}
              {step === 'extracting' && 'AI is reading the invoice and extracting data'}
              {step === 'review' && 'Review the extracted data and make any corrections'}
              {step === 'creating' && 'Creating invoice in system'}
              {step === 'complete' && 'Invoice imported successfully'}
            </p>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <p className="text-sm font-medium text-red-800">{error}</p>
              </div>
            </div>
          )}

          {step === 'upload' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Upload Area */}
              <div>
                <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-emerald-400 transition-colors">
                  <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>

                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Upload Invoice
                  </h3>
                  <p className="text-sm text-gray-600 mb-4">
                    PDF or image (JPG, PNG) of your existing invoice
                  </p>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,image/*"
                    onChange={handleFileSelect}
                    className="hidden"
                  />

                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="px-6 py-2 bg-emerald-600 text-white rounded-lg font-semibold hover:bg-emerald-700 transition-colors"
                  >
                    Choose File
                  </button>

                  {file && (
                    <div className="mt-4 text-sm text-gray-700">
                      <p className="font-medium">{file.name}</p>
                      <p className="text-gray-500">{(file.size / 1024).toFixed(1)} KB</p>
                    </div>
                  )}
                </div>

                {file && (
                  <button
                    onClick={handleExtract}
                    className="w-full mt-4 px-6 py-3 bg-emerald-600 text-white rounded-lg font-semibold hover:bg-emerald-700 transition-colors"
                  >
                    Extract Invoice Data
                  </button>
                )}
              </div>

              {/* Preview */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Preview</h3>
                {filePreview && filePreview !== 'pdf' ? (
                  <img src={filePreview} alt="Invoice preview" className="w-full rounded-lg border border-gray-200" />
                ) : filePreview === 'pdf' ? (
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
                    <svg className="w-16 h-16 mx-auto text-red-600 mb-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                    </svg>
                    <p className="text-sm text-gray-600">PDF file selected</p>
                    <p className="text-xs text-gray-500 mt-1">{file?.name}</p>
                  </div>
                ) : (
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center h-64 flex items-center justify-center">
                    <p className="text-gray-500">No file selected</p>
                  </div>
                )}

                <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-semibold text-blue-900 text-sm mb-2">What we'll extract:</h4>
                  <ul className="text-xs text-blue-800 space-y-1">
                    <li>• Customer name</li>
                    <li>• Invoice number & dates</li>
                    <li>• Line items with quantities & prices</li>
                    <li>• Totals and tax</li>
                    <li>• Payment status</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {step === 'extracting' && (
            <div className="text-center py-12">
              <div className="inline-block w-16 h-16 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mb-4"></div>
              <p className="text-lg text-gray-700">Reading your invoice...</p>
              <p className="text-sm text-gray-500 mt-2">This usually takes 5-10 seconds</p>
            </div>
          )}

          {step === 'review' && editedData && (
            <div className="space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Customer Name *
                  </label>
                  <input
                    type="text"
                    value={editedData.customerName}
                    onChange={(e) => setEditedData({ ...editedData, customerName: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Invoice Number *
                  </label>
                  <input
                    type="text"
                    value={editedData.invoiceNumber}
                    onChange={(e) => setEditedData({ ...editedData, invoiceNumber: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Invoice Date *
                  </label>
                  <input
                    type="date"
                    value={editedData.invoiceDate}
                    onChange={(e) => setEditedData({ ...editedData, invoiceDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Due Date *
                  </label>
                  <input
                    type="date"
                    value={editedData.dueDate}
                    onChange={(e) => setEditedData({ ...editedData, dueDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Line Items */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Line Items</h3>
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left font-semibold text-gray-900">Description</th>
                        <th className="px-4 py-3 text-left font-semibold text-gray-900">Qty</th>
                        <th className="px-4 py-3 text-left font-semibold text-gray-900">Unit Price</th>
                        <th className="px-4 py-3 text-left font-semibold text-gray-900">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {editedData.items.map((item, index) => (
                        <tr key={index}>
                          <td className="px-4 py-3">
                            <input
                              type="text"
                              value={item.description}
                              onChange={(e) => updateItem(index, 'description', e.target.value)}
                              className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-emerald-500 focus:border-emerald-500"
                            />
                          </td>
                          <td className="px-4 py-3">
                            <input
                              type="number"
                              value={item.quantity}
                              onChange={(e) => updateItem(index, 'quantity', parseFloat(e.target.value))}
                              className="w-20 px-2 py-1 border border-gray-300 rounded focus:ring-emerald-500 focus:border-emerald-500"
                            />
                          </td>
                          <td className="px-4 py-3">
                            <input
                              type="number"
                              step="0.01"
                              value={item.unitPrice}
                              onChange={(e) => updateItem(index, 'unitPrice', parseFloat(e.target.value))}
                              className="w-24 px-2 py-1 border border-gray-300 rounded focus:ring-emerald-500 focus:border-emerald-500"
                            />
                          </td>
                          <td className="px-4 py-3 font-medium text-gray-900">
                            £{item.total.toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Totals */}
                <div className="mt-4 bg-gray-50 rounded-lg p-4 max-w-xs ml-auto">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-600">Subtotal:</span>
                    <span className="font-medium text-gray-900">£{editedData.subtotal.toFixed(2)}</span>
                  </div>
                  {editedData.tax !== undefined && (
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-gray-600">Tax:</span>
                      <span className="font-medium text-gray-900">£{editedData.tax.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-base pt-2 border-t border-gray-300">
                    <span className="font-semibold text-gray-900">Total:</span>
                    <span className="font-bold text-gray-900">£{editedData.total.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes (Optional)
                </label>
                <textarea
                  value={editedData.notes || ''}
                  onChange={(e) => setEditedData({ ...editedData, notes: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500"
                  placeholder="Any additional notes about this invoice..."
                />
              </div>
            </div>
          )}

          {step === 'creating' && (
            <div className="text-center py-12">
              <div className="inline-block w-16 h-16 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mb-4"></div>
              <p className="text-lg text-gray-700">Creating invoice...</p>
            </div>
          )}

          {step === 'complete' && (
            <div className="text-center py-12">
              <svg className="w-20 h-20 mx-auto text-emerald-600 mb-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Invoice Imported!</h3>
              <p className="text-gray-600">Your invoice has been created and is ready to track.</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-end gap-3">
          {step === 'upload' && (
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
          )}

          {step === 'review' && (
            <>
              <button
                onClick={() => setStep('upload')}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
              >
                Back
              </button>
              <button
                onClick={handleCreate}
                className="px-6 py-2 bg-emerald-600 text-white rounded-lg font-semibold hover:bg-emerald-700 transition-colors"
              >
                Create Invoice
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
