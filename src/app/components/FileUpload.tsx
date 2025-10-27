"use client";

import { useState, useEffect } from "react";

export function FileUpload() {
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error" | "">("");
  const [logoPath, setLogoPath] = useState("/images/plato-logo.png");

  useEffect(() => {
    // Check which logo file exists
    const checkLogo = async () => {
      const extensions = ['.svg', '.png', '.jpg', '.jpeg'];
      for (const ext of extensions) {
        try {
          const response = await fetch(`/images/plato-logo.png`, { method: 'HEAD' });
          if (response.ok) {
            setLogoPath(`/images/plato-logo.png`);
            break;
          }
        } catch (e) {
          // Continue checking
        }
      }
    };
    checkLogo();
  }, [message]); // Re-check when message changes (after upload)

  const handleFileUpload = async (file: File, type: string) => {
    setUploading(true);
    setMessage("");
    setMessageType("");

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("type", type);

      const response = await fetch("/api/admin/upload", {
        method: "POST",
        body: formData,
        credentials: "include", // Include cookies for admin auth
      });

      const data = await response.json();

      if (response.ok) {
        setMessage(data.message || "File uploaded successfully!");
        setMessageType("success");
      } else {
        setMessage(data.error || "Upload failed");
        setMessageType("error");
      }
    } catch (error) {
      setMessage("Network error. Please try again.");
      setMessageType("error");
    } finally {
      setUploading(false);
    }
  };

  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleFileUpload(file, "logo");
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">File Management</h2>
        <p className="text-gray-600">Upload and manage files for your website</p>
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

      {/* Logo Upload */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
            <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Logo Upload</h3>
            <p className="text-sm text-gray-600">Upload your new logo (SVG, PNG, or JPG)</p>
          </div>
        </div>

        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-green-400 transition-colors">
          <input
            type="file"
            id="logo-upload"
            accept=".svg,.png,.jpg,.jpeg"
            onChange={handleLogoUpload}
            disabled={uploading}
            className="hidden"
          />
          <label
            htmlFor="logo-upload"
            className={`cursor-pointer ${uploading ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            <div className="flex flex-col items-center">
              <svg className="w-12 h-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <p className="text-lg font-medium text-gray-900 mb-2">
                {uploading ? "Uploading..." : "Click to upload logo"}
              </p>
              <p className="text-sm text-gray-500">
                SVG, PNG, JPG up to 10MB
              </p>
            </div>
          </label>
        </div>

        <div className="mt-4 p-4 bg-blue-50 rounded-lg">
          <h4 className="font-semibold text-blue-900 mb-2">Current Logo</h4>
          <div className="flex items-center gap-4">
            <img 
              src={logoPath} 
              alt="Current Logo" 
              className="h-12 w-auto border border-gray-200 rounded"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
            <div className="text-sm text-blue-800">
              <p>Path: {logoPath}</p>
              <p>Upload a new file to replace this logo</p>
            </div>
          </div>
        </div>
      </div>

      {/* Other File Types */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Other Files</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 border border-gray-200 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-2">Favicon</h4>
            <p className="text-sm text-gray-600 mb-3">Upload a new favicon (16x16 or 32x32 PNG)</p>
            <input
              type="file"
              accept=".png,.ico"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFileUpload(file, "favicon");
              }}
              disabled={uploading}
              className="text-sm"
            />
          </div>
          <div className="p-4 border border-gray-200 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-2">Images</h4>
            <p className="text-sm text-gray-600 mb-3">Upload images for your website</p>
            <input
              type="file"
              accept=".png,.jpg,.jpeg,.svg"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFileUpload(file, "image");
              }}
              disabled={uploading}
              className="text-sm"
            />
          </div>
        </div>
      </div>

      {/* Deployment Info */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <svg className="w-5 h-5 text-yellow-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <h4 className="font-semibold text-yellow-800">Deployment Notice</h4>
            <p className="text-sm text-yellow-700 mt-1">
              After uploading files, they will be automatically deployed to your live site within 1-2 minutes. 
              You may need to refresh your browser to see changes due to caching.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
