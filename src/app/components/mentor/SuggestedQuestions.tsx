"use client";

interface SuggestedQuestionsProps {
  onSelect: (question: string) => void;
}

const SUGGESTED_QUESTIONS = [
  "What should I price my best-selling product at?",
  "How can I reduce my food costs?",
  "What's a good food cost target for my business?",
  "Which ingredients have increased in price recently?",
  "What are my top-selling products this month?",
  "How can I improve my profit margins?",
];

export function SuggestedQuestions({ onSelect }: SuggestedQuestionsProps) {
  return (
    <div>
      <h3 className="text-sm font-semibold text-gray-700 mb-3">Suggested Questions</h3>
      <div className="grid grid-cols-1 gap-2">
        {SUGGESTED_QUESTIONS.map((question, index) => (
          <button
            key={index}
            onClick={() => onSelect(question)}
            className="text-left px-4 py-3 bg-white border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors"
          >
            <p className="text-sm text-gray-700">{question}</p>
          </button>
        ))}
      </div>
    </div>
  );
}





