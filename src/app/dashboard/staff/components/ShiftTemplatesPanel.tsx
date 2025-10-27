"use client";

import { useState } from "react";

interface ShiftTemplate {
  id: number;
  name: string;
  shiftType: string;
  startTime: string;
  endTime: string;
  breakDuration: number;
  color: string;
}

interface ShiftTemplatesPanelProps {
  onClose: () => void;
  onApplyTemplate: (template: ShiftTemplate) => void;
}

export default function ShiftTemplatesPanel({
  onClose,
  onApplyTemplate,
}: ShiftTemplatesPanelProps) {
  // Predefined templates
  const templates: ShiftTemplate[] = [
    {
      id: 1,
      name: "Morning Shift",
      shiftType: "opening",
      startTime: "06:00",
      endTime: "14:00",
      breakDuration: 30,
      color: "amber",
    },
    {
      id: 2,
      name: "Day Shift",
      shiftType: "general",
      startTime: "09:00",
      endTime: "17:00",
      breakDuration: 60,
      color: "blue",
    },
    {
      id: 3,
      name: "Evening Shift",
      shiftType: "closing",
      startTime: "14:00",
      endTime: "22:00",
      breakDuration: 30,
      color: "indigo",
    },
    {
      id: 4,
      name: "Night Shift",
      shiftType: "general",
      startTime: "22:00",
      endTime: "06:00",
      breakDuration: 45,
      color: "purple",
    },
    {
      id: 5,
      name: "Split Shift",
      shiftType: "service",
      startTime: "11:00",
      endTime: "15:00",
      breakDuration: 0,
      color: "green",
    },
  ];

  const getColorClasses = (color: string) => {
    const colors: Record<string, { bg: string; text: string; border: string }> = {
      blue: { bg: "bg-blue-500", text: "text-blue-700", border: "border-blue-300" },
      amber: { bg: "bg-amber-500", text: "text-amber-700", border: "border-amber-300" },
      indigo: { bg: "bg-indigo-500", text: "text-indigo-700", border: "border-indigo-300" },
      purple: { bg: "bg-purple-500", text: "text-purple-700", border: "border-purple-300" },
      green: { bg: "bg-green-500", text: "text-green-700", border: "border-green-300" },
    };
    return colors[color] || colors.blue;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-purple-700 p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">Shift Templates</h2>
              <p className="text-purple-100 mt-1">Quick schedule with pre-made templates</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {templates.map((template) => {
              const colors = getColorClasses(template.color);
              return (
                <div
                  key={template.id}
                  className="bg-white border-2 border-gray-200 rounded-xl p-5 hover:border-purple-300 hover:shadow-lg transition-all cursor-pointer group"
                  onClick={() => onApplyTemplate(template)}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className={`w-3 h-3 rounded-full ${colors.bg}`}></div>
                      <h3 className="font-bold text-lg text-gray-900">{template.name}</h3>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${colors.text} bg-${template.color}-100`}>
                      {template.shiftType}
                    </span>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="font-semibold">
                        {template.startTime} - {template.endTime}
                      </span>
                    </div>

                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                      </svg>
                      <span>Break: {template.breakDuration} minutes</span>
                    </div>

                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                      </svg>
                      <span>
                        Duration:{" "}
                        {(() => {
                          const [startHour, startMin] = template.startTime.split(":").map(Number);
                          const [endHour, endMin] = template.endTime.split(":").map(Number);
                          let hours = endHour - startHour;
                          if (hours < 0) hours += 24; // Handle overnight shifts
                          return `${hours}h ${endMin - startMin}min`;
                        })()}
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <button className="w-full py-2 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-lg font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
                      Apply Template
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Custom Template Creation */}
          <div className="mt-8 p-6 bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl border-2 border-dashed border-purple-300">
            <div className="text-center">
              <svg className="w-12 h-12 mx-auto text-purple-500 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Create Custom Template</h3>
              <p className="text-sm text-gray-600 mb-4">
                Save your frequently used shifts as templates for quick scheduling
              </p>
              <button className="px-6 py-2 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition-colors">
                Create New Template
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
