"use client";

import { useState } from "react";
import { RecipePrintView } from "./RecipePrintView";

interface RecipeExportButtonsProps {
  recipe: {
    id: number;
    name: string;
    description?: string;
    yieldQuantity: number;
    yieldUnit: string;
    imageUrl?: string;
    method?: string;
    sections: Array<{
      id: number;
      title: string;
      description?: string;
      method?: string;
      order: number;
      items: Array<{
        id: number;
        quantity: number;
        unit: string;
        note?: string;
        ingredient: {
          id: number;
          name: string;
          packQuantity: number;
          packUnit: string;
          packPrice: number;
          densityGPerMl?: number;
        };
      }>;
    }>;
    items: Array<{
      id: number;
      quantity: number;
      unit: string;
      note?: string;
      ingredient: {
        id: number;
        name: string;
        packQuantity: number;
        packUnit: string;
        packPrice: number;
        densityGPerMl?: number;
      };
    }>;
  };
  costBreakdown: {
    totalCost: number;
    costPerOutputUnit: number;
  };
  servings: number;
}

export function RecipeExportButtons({ recipe, costBreakdown, servings }: RecipeExportButtonsProps) {
  const [isExporting, setIsExporting] = useState(false);

  const handlePrint = () => {
    // Create a new window with the print view
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    // Get the print view HTML
    const printContent = document.createElement('div');
    printContent.innerHTML = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>${recipe.name} - Recipe</title>
          <style>
            body { margin: 0; padding: 20px; font-family: Georgia, serif; }
            @media print {
              body { margin: 0; padding: 0; }
              @page { margin: 0.5in; }
            }
          </style>
        </head>
        <body>
          <div id="print-content"></div>
        </body>
      </html>
    `;

    printWindow.document.write(printContent.innerHTML);
    printWindow.document.close();

    // Render the print view in the new window
    const printContainer = printWindow.document.getElementById('print-content');
    if (printContainer) {
      // We'll use React's createRoot to render the component
      import('react-dom/client').then(({ createRoot }) => {
        const root = createRoot(printContainer);
        root.render(
          <RecipePrintView 
            recipe={recipe} 
            costBreakdown={costBreakdown} 
            servings={servings} 
          />
        );
        
        // Wait for render then print
        setTimeout(() => {
          printWindow.print();
          printWindow.close();
        }, 500);
      });
    }
  };

  const handleExportPDF = async () => {
    setIsExporting(true);
    try {
      // Create a temporary container for the print view
      const tempContainer = document.createElement('div');
      tempContainer.style.position = 'absolute';
      tempContainer.style.left = '-9999px';
      tempContainer.style.top = '-9999px';
      document.body.appendChild(tempContainer);

      // Render the print view
      const { createRoot } = await import('react-dom/client');
      const root = createRoot(tempContainer);
      root.render(
        <RecipePrintView 
          recipe={recipe} 
          costBreakdown={costBreakdown} 
          servings={servings} 
        />
      );

      // Wait for render
      await new Promise(resolve => setTimeout(resolve, 500));

      // Use html2pdf library to generate PDF
      const html2pdf = (await import('html2pdf.js')).default;
      
      const opt = {
        margin: 0.5,
        filename: `${recipe.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_recipe.pdf`,
        image: { type: 'jpeg' as const, quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
      };

      await html2pdf().set(opt).from(tempContainer).save();
      
      // Cleanup
      root.unmount();
      document.body.removeChild(tempContainer);
    } catch (error) {
      console.error('PDF export failed:', error);
      alert('PDF export failed. Please try the print option instead.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportText = () => {
    let text = `${recipe.name}\n`;
    text += `Yield: ${servings} ${recipe.yieldUnit}\n\n`;
    
    if (recipe.description) {
      text += `${recipe.description}\n\n`;
    }

    text += `INGREDIENTS:\n`;
    text += `============\n\n`;

    if (recipe.sections.length > 0) {
      recipe.sections.forEach(section => {
        if (section.items.length > 0) {
          text += `${section.title.toUpperCase()}:\n`;
          section.items.forEach(item => {
            const scaledQuantity = item.quantity * (servings / recipe.yieldQuantity);
            text += `• ${scaledQuantity} ${item.unit} ${item.ingredient.name}`;
            if (item.note) text += ` (${item.note})`;
            text += `\n`;
          });
          text += `\n`;
        }
      });
    } else {
      recipe.items.forEach(item => {
        const scaledQuantity = item.quantity * (servings / recipe.yieldQuantity);
        text += `• ${scaledQuantity} ${item.unit} ${item.ingredient.name}`;
        if (item.note) text += ` (${item.note})`;
        text += `\n`;
      });
    }

    text += `\nINSTRUCTIONS:\n`;
    text += `=============\n\n`;

    if (recipe.sections.length > 0) {
      recipe.sections.forEach(section => {
        text += `${section.title}:\n`;
        if (section.description) {
          text += `${section.description}\n\n`;
        }
        if (section.method) {
          text += `${section.method}\n\n`;
        }
      });
    } else if (recipe.method) {
      text += `${recipe.method}\n\n`;
    }

    text += `COST BREAKDOWN:\n`;
    text += `===============\n`;
    text += `Total Cost: ${(costBreakdown.totalCost * (servings / recipe.yieldQuantity)).toFixed(2)}\n`;
    text += `Cost per Serving: ${(costBreakdown.costPerOutputUnit * (servings / recipe.yieldQuantity)).toFixed(2)}\n`;

    // Create and download the text file
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${recipe.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_recipe.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={handlePrint}
        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
        </svg>
        Print
      </button>

      <button
        onClick={handleExportPDF}
        disabled={isExporting}
        className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        {isExporting ? 'Exporting...' : 'Export PDF'}
      </button>

      <button
        onClick={handleExportText}
        className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        Export Text
      </button>
    </div>
  );
}
