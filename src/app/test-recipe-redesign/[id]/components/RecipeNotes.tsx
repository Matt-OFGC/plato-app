"use client";

interface RecipeNotesProps {
  notes?: string;
}

export default function RecipeNotes({ notes }: RecipeNotesProps) {
  return (
    <div className="bg-blue-50 rounded-2xl border border-blue-100 shadow-sm p-5">
      <div className="mb-3">
        <p className="text-xs text-blue-700 uppercase tracking-wider font-semibold">
          Notes
        </p>
      </div>
      
      {notes ? (
        <p className="text-sm text-blue-900 leading-relaxed">{notes}</p>
      ) : (
        <p className="text-sm text-blue-400 italic">No notes added</p>
      )}
    </div>
  );
}

