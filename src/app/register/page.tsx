"use client";

import { useState } from "react";

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [company, setCompany] = useState("");
  const [name, setName] = useState("");
  const [status, setStatus] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("Creating account...");
    
    try {
      const formData = new URLSearchParams({ email, password, company, name });
      console.log("Sending registration data:", { email, company, name, password: "***" });
      
      const res = await fetch("/api/register", { 
        method: "POST", 
        body: formData,
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        }
      });
      
      const result = await res.json();
      console.log("Registration response:", result);
      
      if (res.ok) {
        setStatus("Account created successfully! You can now sign in.");
      } else {
        const errorMessage = result.error || 'Unknown error';
        if (errorMessage === "Email in use") {
          setStatus("This email is already registered. Please use a different email or try signing in.");
        } else if (errorMessage === "Missing fields") {
          setStatus("Please fill in all required fields.");
        } else {
          setStatus(`Failed to register: ${errorMessage}`);
        }
      }
    } catch (error) {
      console.error("Registration error:", error);
      setStatus("Failed to register: Network error");
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-white flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="flex justify-center mb-6">
            <img 
              src="/images/plato-logo.svg" 
              alt="Plato" 
              className="h-12 w-auto"
            />
          </div>
          <h2 className="text-3xl font-bold text-gray-900">Create your account</h2>
          <p className="mt-2 text-sm text-gray-600">
            Join Plato and start managing your recipes and ingredients
          </p>
        </div>
        
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Company Name</label>
              <input 
                type="text"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors" 
                value={company} 
                onChange={(e) => setCompany(e.target.value)}
                placeholder="Enter your company name"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
              <input 
                type="text"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors" 
                value={name} 
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your full name"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email address</label>
              <input 
                type="email"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
              <input 
                type="password"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Create a password"
                required
              />
            </div>
            <button 
              type="submit"
              className="w-full bg-gradient-to-r from-emerald-500 to-emerald-600 text-white py-3 px-4 rounded-lg hover:shadow-md transition-all font-semibold"
            >
              Create account
            </button>
          </form>
          
          {status && (
            <div className={`mt-4 p-3 rounded-lg text-sm text-center ${
              status.includes("created") 
                ? "bg-green-50 text-green-700 border border-green-200" 
                : "bg-red-50 text-red-700 border border-red-200"
            }`}>
              {status}
            </div>
          )}
          
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Already have an account?{" "}
              <a href="/login" className="text-emerald-600 hover:text-emerald-700 font-semibold">
                Sign in here
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}


