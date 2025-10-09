"use client";

import { useState } from "react";
import Image from "next/image";

interface Company {
  id: number;
  name: string;
  slug: string | null;
  businessType: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  address: string | null;
  city: string | null;
  postcode: string | null;
  country: string;
  logoUrl: string | null;
  isProfilePublic: boolean;
  profileBio: string | null;
  showTeam: boolean;
  showContact: boolean;
}

interface Props {
  company: Company;
}

export function BusinessSettingsForm({ company }: Props) {
  const [formData, setFormData] = useState({
    name: company.name,
    businessType: company.businessType || "",
    phone: company.phone || "",
    email: company.email || "",
    website: company.website || "",
    address: company.address || "",
    city: company.city || "",
    postcode: company.postcode || "",
    country: company.country,
    profileBio: company.profileBio || "",
    isProfilePublic: company.isProfilePublic,
    showTeam: company.showTeam,
    showContact: company.showContact,
  });

  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(company.logoUrl);
  const [status, setStatus] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveLogo = async () => {
    try {
      const res = await fetch(`/api/company/logo?companyId=${company.id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setLogoPreview(null);
        setLogoFile(null);
        setStatus("Logo removed successfully!");
      } else {
        setStatus("Failed to remove logo");
      }
    } catch (error) {
      setStatus("Error removing logo");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setStatus("Saving...");

    try {
      // Upload logo if changed
      if (logoFile) {
        const logoFormData = new FormData();
        logoFormData.append("logo", logoFile);
        logoFormData.append("companyId", company.id.toString());

        const logoRes = await fetch("/api/company/logo", {
          method: "POST",
          body: logoFormData,
        });

        if (!logoRes.ok) {
          const error = await logoRes.json();
          setStatus(`Failed to upload logo: ${error.error}`);
          setSaving(false);
          return;
        }
      }

      // Update company details
      const res = await fetch("/api/company/update", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          companyId: company.id,
          ...formData,
        }),
      });

      if (res.ok) {
        setStatus("Settings saved successfully!");
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      } else {
        const error = await res.json();
        setStatus(`Failed to save: ${error.error}`);
      }
    } catch (error) {
      setStatus("Error saving settings");
    } finally {
      setSaving(false);
    }
  };

  const profileUrl = company.slug 
    ? `${window.location.origin}/business/${company.slug}` 
    : "Not available (slug not set)";

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Logo Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Business Logo</h2>
        <div className="flex items-start gap-6">
          <div className="flex-shrink-0">
            {logoPreview ? (
              <div className="relative w-24 h-24 rounded-lg overflow-hidden border border-gray-200">
                <Image
                  src={logoPreview}
                  alt="Company logo"
                  fill
                  className="object-cover"
                />
              </div>
            ) : (
              <div className="w-24 h-24 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center text-white text-3xl font-bold">
                {company.name[0]}
              </div>
            )}
          </div>
          <div className="flex-1">
            <label className="block">
              <span className="sr-only">Choose logo</span>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100"
              />
            </label>
            <p className="mt-2 text-xs text-gray-500">
              Recommended: Square image, at least 200x200px. Max 5MB.
            </p>
            {logoPreview && (
              <button
                type="button"
                onClick={handleRemoveLogo}
                className="mt-3 text-sm text-red-600 hover:text-red-700 font-medium"
              >
                Remove logo
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Basic Information */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Business Name
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Business Type
            </label>
            <select
              value={formData.businessType}
              onChange={(e) => setFormData({ ...formData, businessType: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            >
              <option value="">Select type</option>
              <option value="Restaurant">Restaurant</option>
              <option value="Café">Café</option>
              <option value="Bakery">Bakery</option>
              <option value="Catering">Catering</option>
              <option value="Food Truck">Food Truck</option>
              <option value="Hotel">Hotel</option>
              <option value="Bar & Pub">Bar & Pub</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Phone
            </label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Website
            </label>
            <input
              type="url"
              value={formData.website}
              onChange={(e) => setFormData({ ...formData, website: e.target.value })}
              placeholder="https://www.example.com"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            />
          </div>
        </div>
      </div>

      {/* Location */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Location</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Address
            </label>
            <input
              type="text"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              City
            </label>
            <input
              type="text"
              value={formData.city}
              onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Postcode
            </label>
            <input
              type="text"
              value={formData.postcode}
              onChange={(e) => setFormData({ ...formData, postcode: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Country
            </label>
            <select
              value={formData.country}
              onChange={(e) => setFormData({ ...formData, country: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            >
              <option value="United Kingdom">United Kingdom</option>
              <option value="United States">United States</option>
              <option value="Canada">Canada</option>
              <option value="Australia">Australia</option>
              <option value="Ireland">Ireland</option>
              <option value="France">France</option>
              <option value="Germany">Germany</option>
              <option value="Spain">Spain</option>
              <option value="Italy">Italy</option>
              <option value="Other">Other</option>
            </select>
          </div>
        </div>
      </div>

      {/* Public Profile */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Public Profile</h2>
        
        <div className="space-y-4">
          <div>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.isProfilePublic}
                onChange={(e) => setFormData({ ...formData, isProfilePublic: e.target.checked })}
                className="w-4 h-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
              />
              <span className="ml-2 text-sm font-medium text-gray-700">
                Make profile publicly accessible
              </span>
            </label>
            <p className="ml-6 text-xs text-gray-500">
              Your business profile will be visible at: <span className="font-mono text-emerald-600">{profileUrl}</span>
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Profile Bio
            </label>
            <textarea
              value={formData.profileBio}
              onChange={(e) => setFormData({ ...formData, profileBio: e.target.value })}
              rows={3}
              placeholder="Tell people about your business..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.showContact}
                onChange={(e) => setFormData({ ...formData, showContact: e.target.checked })}
                className="w-4 h-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
              />
              <span className="ml-2 text-sm font-medium text-gray-700">
                Show contact information on public profile
              </span>
            </label>
          </div>

          <div>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.showTeam}
                onChange={(e) => setFormData({ ...formData, showTeam: e.target.checked })}
                className="w-4 h-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
              />
              <span className="ml-2 text-sm font-medium text-gray-700">
                Show team members on public profile
              </span>
            </label>
          </div>
        </div>
      </div>

      {/* Status Message */}
      {status && (
        <div className={`p-4 rounded-lg ${
          status.includes("success") 
            ? "bg-green-50 text-green-700 border border-green-200" 
            : status.includes("Saving")
            ? "bg-blue-50 text-blue-700 border border-blue-200"
            : "bg-red-50 text-red-700 border border-red-200"
        }`}>
          {status}
        </div>
      )}

      {/* Submit Button */}
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={saving}
          className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-lg hover:shadow-md transition-all font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </div>
    </form>
  );
}

