"use client";

import Link from "next/link";
import { RelatedEntity } from "@/lib/services/relationService";

interface RelatedItemsPanelProps {
  relations: RelatedEntity[];
  title?: string;
  loading?: boolean;
}

export function RelatedItemsPanel({
  relations,
  title = "Related Items",
  loading = false,
}: RelatedItemsPanelProps) {
  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <h3 className="font-semibold text-gray-900 mb-3">{title}</h3>
        <p className="text-sm text-gray-500">Loading...</p>
      </div>
    );
  }

  if (relations.length === 0) {
    return null;
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "staff":
        return "👤";
      case "training":
        return "📚";
      case "recipe":
        return "📝";
      case "production":
        return "🏭";
      case "cleaning":
        return "🧹";
      default:
        return "🔗";
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "staff":
        return "bg-blue-100 text-blue-700";
      case "training":
        return "bg-purple-100 text-purple-700";
      case "recipe":
        return "bg-green-100 text-green-700";
      case "production":
        return "bg-orange-100 text-orange-700";
      case "cleaning":
        return "bg-yellow-100 text-yellow-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <h3 className="font-semibold text-gray-900 mb-3">{title}</h3>
      <div className="space-y-2">
        {relations.map((relation) => (
          <Link
            key={`${relation.type}-${relation.id}`}
            href={relation.link}
            className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <span className="text-lg">{getTypeIcon(relation.type)}</span>
            <span className="flex-1 text-sm text-gray-700">{relation.name}</span>
            <span
              className={`px-2 py-0.5 text-xs rounded ${getTypeColor(
                relation.type
              )}`}
            >
              {relation.type}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}

