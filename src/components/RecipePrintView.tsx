"use client";

import { formatCurrency } from "@/lib/currency";

interface RecipePrintViewProps {
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

export function RecipePrintView({ recipe, costBreakdown, servings }: RecipePrintViewProps) {
  const scaleFactor = servings / recipe.yieldQuantity;
  
  const scaledIngredients = recipe.items.map(item => ({
    ...item,
    scaledQuantity: item.quantity * scaleFactor,
  }));

  const scaledSections = recipe.sections.map(section => ({
    ...section,
    items: section.items.map(item => ({
      ...item,
      scaledQuantity: item.quantity * scaleFactor,
    })),
  }));

  const allIngredients = recipe.sections.length > 0 
    ? scaledSections.flatMap(section => section.items)
    : scaledIngredients;

  return (
    <div className="print-recipe">
      <style jsx>{`
        .print-recipe {
          font-family: 'Georgia', serif;
          line-height: 1.6;
          color: #333;
          max-width: 800px;
          margin: 0 auto;
          padding: 20px;
        }
        
        .print-recipe h1 {
          font-size: 2.5rem;
          font-weight: bold;
          text-align: center;
          margin-bottom: 0.5rem;
          color: #2c3e50;
          border-bottom: 3px solid #e74c3c;
          padding-bottom: 0.5rem;
        }
        
        .print-recipe .recipe-meta {
          text-align: center;
          margin-bottom: 2rem;
          font-size: 1.1rem;
          color: #666;
        }
        
        .print-recipe .description {
          font-style: italic;
          text-align: center;
          margin-bottom: 2rem;
          font-size: 1.2rem;
          color: #555;
        }
        
        .print-recipe .ingredients-section {
          margin-bottom: 2rem;
        }
        
        .print-recipe .ingredients-section h2 {
          font-size: 1.8rem;
          font-weight: bold;
          margin-bottom: 1rem;
          color: #2c3e50;
          border-bottom: 2px solid #3498db;
          padding-bottom: 0.25rem;
        }
        
        .print-recipe .ingredient-item {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 0.5rem;
          padding: 0.25rem 0;
        }
        
        .print-recipe .ingredient-quantity {
          font-weight: bold;
          min-width: 120px;
          color: #e74c3c;
        }
        
        .print-recipe .ingredient-name {
          flex: 1;
          margin-left: 1rem;
        }
        
        .print-recipe .ingredient-note {
          font-style: italic;
          color: #666;
          font-size: 0.9rem;
        }
        
        .print-recipe .section-title {
          font-size: 1.4rem;
          font-weight: bold;
          margin: 1.5rem 0 0.5rem 0;
          color: #2c3e50;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        
        .print-recipe .instructions-section {
          margin-bottom: 2rem;
        }
        
        .print-recipe .instructions-section h2 {
          font-size: 1.8rem;
          font-weight: bold;
          margin-bottom: 1rem;
          color: #2c3e50;
          border-bottom: 2px solid #3498db;
          padding-bottom: 0.25rem;
        }
        
        .print-recipe .instruction-step {
          margin-bottom: 1rem;
          padding-left: 1rem;
          border-left: 3px solid #3498db;
          padding-left: 1.5rem;
        }
        
        .print-recipe .instruction-step h3 {
          font-size: 1.2rem;
          font-weight: bold;
          margin-bottom: 0.5rem;
          color: #2c3e50;
        }
        
        .print-recipe .instruction-text {
          white-space: pre-wrap;
          line-height: 1.7;
        }
        
        .print-recipe .cost-info {
          background: #f8f9fa;
          border: 2px solid #dee2e6;
          border-radius: 8px;
          padding: 1rem;
          margin-top: 2rem;
          text-align: center;
        }
        
        .print-recipe .cost-info h3 {
          font-size: 1.2rem;
          font-weight: bold;
          margin-bottom: 0.5rem;
          color: #2c3e50;
        }
        
        .print-recipe .cost-details {
          display: flex;
          justify-content: space-around;
          font-size: 1.1rem;
        }
        
        .print-recipe .cost-item {
          text-align: center;
        }
        
        .print-recipe .cost-label {
          font-weight: bold;
          color: #666;
          display: block;
        }
        
        .print-recipe .cost-value {
          color: #e74c3c;
          font-weight: bold;
        }
        
        @media print {
          .print-recipe {
            font-size: 12pt;
            line-height: 1.4;
          }
          
          .print-recipe h1 {
            font-size: 24pt;
          }
          
          .print-recipe h2 {
            font-size: 16pt;
          }
          
          .print-recipe h3 {
            font-size: 14pt;
          }
          
          .print-recipe .ingredient-item {
            page-break-inside: avoid;
          }
          
          .print-recipe .instruction-step {
            page-break-inside: avoid;
          }
        }
      `}</style>

      {/* Recipe Header */}
      <h1>{recipe.name}</h1>
      
      <div className="recipe-meta">
        <strong>Yield:</strong> {servings} {recipe.yieldUnit}
      </div>
      
      {recipe.description && (
        <div className="description">
          {recipe.description}
        </div>
      )}

      {/* Ingredients Section */}
      <div className="ingredients-section">
        <h2>Ingredients</h2>
        
        {recipe.sections.length > 0 ? (
          scaledSections.map((section) => (
            <div key={section.id}>
              {section.items.length > 0 && (
                <>
                  <h3 className="section-title">{section.title}</h3>
                  {section.items.map((item) => (
                    <div key={item.id} className="ingredient-item">
                      <span className="ingredient-quantity">
                        {item.scaledQuantity} {item.unit}
                      </span>
                      <div className="ingredient-name">
                        {item.ingredient.name}
                        {item.note && (
                          <div className="ingredient-note">({item.note})</div>
                        )}
                      </div>
                    </div>
                  ))}
                </>
              )}
            </div>
          ))
        ) : (
          scaledIngredients.map((item) => (
            <div key={item.id} className="ingredient-item">
              <span className="ingredient-quantity">
                {item.scaledQuantity} {item.unit}
              </span>
              <div className="ingredient-name">
                {item.ingredient.name}
                {item.note && (
                  <div className="ingredient-note">({item.note})</div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Instructions Section */}
      <div className="instructions-section">
        <h2>Instructions</h2>
        
        {recipe.sections.length > 0 ? (
          scaledSections.map((section) => (
            <div key={section.id} className="instruction-step">
              <h3>{section.title}</h3>
              {section.description && (
                <p style={{ fontStyle: 'italic', marginBottom: '0.5rem' }}>
                  {section.description}
                </p>
              )}
              {section.method && (
                <div className="instruction-text">
                  {section.method}
                </div>
              )}
            </div>
          ))
        ) : (
          recipe.method && (
            <div className="instruction-text">
              {recipe.method}
            </div>
          )
        )}
      </div>

      {/* Cost Information */}
      <div className="cost-info">
        <h3>Cost Breakdown</h3>
        <div className="cost-details">
          <div className="cost-item">
            <span className="cost-label">Total Cost</span>
            <span className="cost-value">
              {formatCurrency(costBreakdown.totalCost * scaleFactor)}
            </span>
          </div>
          <div className="cost-item">
            <span className="cost-label">Cost per Serving</span>
            <span className="cost-value">
              {formatCurrency(costBreakdown.costPerOutputUnit * scaleFactor)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
