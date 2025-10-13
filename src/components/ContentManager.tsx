"use client";

import { useState } from "react";

export function ContentManager() {
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error" | "">("");

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Content Management</h2>
        <p className="text-gray-600">Manage your website content and settings</p>
      </div>

      {/* Message Display */}
      {message && (
        <div className={`p-4 rounded-lg ${
          messageType === "success" 
            ? "bg-green-50 border border-green-200 text-green-800" 
            : "bg-red-50 border border-red-200 text-red-800"
        }`}>
          {message}
        </div>
      )}

      {/* Landing Page Content */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Landing Page Content</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Main Headline
            </label>
            <input
              type="text"
              defaultValue="Protect Your Recipes. Perfect Your Costs."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Subheadline
            </label>
            <textarea
              rows={3}
              defaultValue="The only recipe management platform built for food businesses that need to protect their secrets while mastering their food costs."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Call-to-Action Button Text
            </label>
            <input
              type="text"
              defaultValue="Start Free Trial"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
            />
          </div>
        </div>
        <div className="mt-4">
          <button className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors">
            Save Changes
          </button>
        </div>
      </div>

      {/* Feature Descriptions */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Feature Descriptions</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Recipe Protection Description
            </label>
            <textarea
              rows={3}
              defaultValue="Your recipes are your competitive advantage. Our device-based PIN system means staff can only access recipes on your work devices—never from home."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Cost Management Description
            </label>
            <textarea
              rows={3}
              defaultValue="Stop guessing. Get automatic cost calculations with every recipe change. Set target food costs and get recommended pricing that protects your margins."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
            />
          </div>
        </div>
        <div className="mt-4">
          <button className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors">
            Save Changes
          </button>
        </div>
      </div>

      {/* Coming Soon Notice */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <svg className="w-5 h-5 text-blue-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <h4 className="font-semibold text-blue-800">Content Management Coming Soon</h4>
            <p className="text-sm text-blue-700 mt-1">
              Full content management features are being developed. For now, you can upload files and manage basic settings.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
