"use client";

interface InventorySyncProps {
  companyId: number;
}

export default function InventorySync({ companyId }: InventorySyncProps) {
  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-12 text-center">
      <div className="text-6xl mb-4">📊</div>
      <h3 className="text-2xl font-bold text-gray-900 mb-2">Inventory Sync</h3>
      <p className="text-gray-600">Sync inventory with recipe costs - Coming soon!</p>
    </div>
  );
}
