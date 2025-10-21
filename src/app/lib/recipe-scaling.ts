export function scaleQuantity(baseQty: number, baseServings: number, currentServings: number): number {
  if (!baseServings || baseServings <= 0) return baseQty;
  return (baseQty * currentServings) / baseServings;
}

export function roundForDisplay(value: number): number {
  const abs = Math.abs(value);
  if (abs >= 100) return Math.round(value);
  if (abs >= 10) return Math.round(value * 10) / 10;
  return Math.round(value * 100) / 100;
}

export function formatQty(qty: number, unit: string): string {
  const rounded = roundForDisplay(qty);
  return `${rounded} ${unit}`.trim();
}

export function calcTotalCost(
  items: { quantity: number; unit: string; costPerUnit?: number }[],
  baseServings: number,
  currentServings: number
): number {
  return items.reduce((sum, item) => {
    const scaledQty = scaleQuantity(item.quantity, baseServings, currentServings);
    const unitCost = item.costPerUnit ?? 0;
    return sum + scaledQty * unitCost;
  }, 0);
}


