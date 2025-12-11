"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Company {
  id: number;
  name: string;
  logoUrl: string | null;
}

interface Props {
  company: Company;
}

export function BrandingCustomization({ company }: Props) {
  const router = useRouter();
  const [logoUrl, setLogoUrl] = useState(company.logoUrl || "");
  const [primaryColor, setPrimaryColor] = useState("#10B981"); // emerald-600
  const [secondaryColor, setSecondaryColor] = useState("#059669"); // emerald-700
  const [saving, setSaving] = useState(false);
  const [preview, setPreview] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/companies/branding/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyId: company.id,
          branding: {
            logoUrl: logoUrl || null,
            primaryColor,
            secondaryColor,
          },
        }),
      });

      if (res.ok) {
        router.refresh();
        alert("Branding updated successfully!");
      } else {
        const data = await res.json();
        alert(data.error || "Failed to update branding");
      }
    } catch (error) {
      console.error("Failed to update branding:", error);
      alert("Failed to update branding");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="app-container">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Branding & Customization</h1>
            <p className="text-gray-600 mt-2">{company.name}</p>
          </div>
          <a
            href={`/dashboard/companies/${company.id}`}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Back to Company
          </a>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Settings */}
        <div className="space-y-6">
          {/* Logo */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Company Logo</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Logo URL
                </label>
                <input
                  type="url"
                  value={logoUrl}
                  onChange={(e) => setLogoUrl(e.target.value)}
                  placeholder="https://example.com/logo.png"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Enter a direct link to your logo image (PNG, JPG, or SVG)
                </p>
              </div>
              {logoUrl && (
                <div className="mt-4">
                  <p className="text-sm font-medium text-gray-700 mb-2">Preview</p>
                  <div className="border border-gray-200 rounded-lg p-4 bg-gray-50 flex items-center justify-center">
                    <img
                      src={logoUrl}
                      alt="Logo preview"
                      className="max-h-32 max-w-full object-contain"
                      onError={() => alert("Failed to load image. Please check the URL.")}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Colors */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Brand Colors</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Primary Color
                </label>
                <div className="flex gap-3">
                  <input
                    type="color"
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    className="w-16 h-10 border border-gray-300 rounded cursor-pointer"
                  />
                  <input
                    type="text"
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    placeholder="#10B981"
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Secondary Color
                </label>
                <div className="flex gap-3">
                  <input
                    type="color"
                    value={secondaryColor}
                    onChange={(e) => setSecondaryColor(e.target.value)}
                    className="w-16 h-10 border border-gray-300 rounded cursor-pointer"
                  />
                  <input
                    type="text"
                    value={secondaryColor}
                    onChange={(e) => setSecondaryColor(e.target.value)}
                    placeholder="#059669"
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Save Button */}
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-medium disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>

        {/* Preview */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Preview</h2>
          <div className="space-y-4">
            <div
              className="rounded-lg p-6 text-white"
              style={{ backgroundColor: primaryColor }}
            >
              <div className="flex items-center gap-3 mb-4">
                {logoUrl && (
                  <img
                    src={logoUrl}
                    alt="Logo"
                    className="h-10 w-auto"
                    onError={() => {}}
                  />
                )}
                <h3 className="text-xl font-bold">{company.name}</h3>
              </div>
              <p className="text-sm opacity-90">
                This is how your brand colors will appear in the application.
              </p>
            </div>
            <div className="space-y-2">
              <button
                className="w-full px-4 py-2 rounded-lg text-white font-medium"
                style={{ backgroundColor: primaryColor }}
              >
                Primary Button
              </button>
              <button
                className="w-full px-4 py-2 rounded-lg text-white font-medium"
                style={{ backgroundColor: secondaryColor }}
              >
                Secondary Button
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
