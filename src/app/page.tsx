"use client";

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      {/* Modern Navigation Bar */}
      <nav className="border-b border-gray-200/50 bg-white/95 backdrop-blur-2xl sticky top-0 z-50 transition-all duration-300 shadow-sm shadow-gray-100/50">
        <div className="app-container">
          {/* Mobile Nav */}
          <div className="flex md:hidden justify-between items-center h-16 px-4">
            <a 
              href="/login" 
              className="group relative px-4 py-2 text-gray-700 hover:text-emerald-600 font-semibold text-sm transition-all duration-300 rounded-lg hover:bg-emerald-50"
            >
              <span className="relative z-10">Login</span>
              <span className="absolute inset-0 bg-emerald-50 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
            </a>
            <a href="/" className="flex items-center">
              <img 
                src="/images/plato-logo.png" 
                alt="Plato" 
                className="h-10 w-auto transition-transform duration-300 hover:scale-105"
              />
            </a>
            <a
              href="/register"
              className="group relative overflow-hidden bg-gradient-to-r from-emerald-500 to-emerald-600 text-white px-5 py-2 rounded-xl font-bold text-sm shadow-lg shadow-emerald-500/30 hover:shadow-xl hover:shadow-emerald-500/40 transition-all duration-300 transform hover:-translate-y-0.5"
            >
              <span className="relative z-10">Get Started</span>
              <span className="absolute inset-0 bg-gradient-to-r from-emerald-600 to-emerald-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
            </a>
          </div>

          {/* Desktop Nav */}
          <div className="hidden md:flex justify-between items-center h-20">
            <div className="flex-1 flex justify-start">
              <div className="flex items-center gap-10">
                <a 
                  href="#features" 
                  className="group relative text-gray-700 hover:text-emerald-600 font-semibold text-sm transition-all duration-300 py-2"
                >
                  Features
                  <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-emerald-600 group-hover:w-full transition-all duration-300"></span>
                </a>
                <a 
                  href="/pricing" 
                  className="group relative text-gray-700 hover:text-emerald-600 font-semibold text-sm transition-all duration-300 py-2"
                >
                  Pricing
                  <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-emerald-600 group-hover:w-full transition-all duration-300"></span>
                </a>
              </div>
            </div>
            
            {/* Centered Logo */}
            <div className="flex items-center justify-center absolute left-1/2 transform -translate-x-1/2">
              <a href="/" className="block transition-transform duration-300 hover:scale-105">
                <img 
                  src="/images/plato-logo.png" 
                  alt="Plato" 
                  className="h-14 w-auto drop-shadow-sm"
                />
              </a>
            </div>
            
            {/* Right nav items */}
            <div className="flex-1 flex justify-end">
              <div className="flex items-center gap-4">
                <a 
                  href="/login" 
                  className="group relative px-6 py-2.5 text-gray-700 hover:text-emerald-600 font-bold text-sm transition-all duration-300 rounded-xl hover:bg-emerald-50/80 border border-transparent hover:border-emerald-200"
                >
                  <span className="relative z-10 flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    Login
                  </span>
                  <span className="absolute inset-0 bg-emerald-50 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-0"></span>
                </a>
                <a
                  href="/register"
                  className="group relative overflow-hidden bg-gradient-to-r from-emerald-500 to-emerald-600 text-white px-8 py-2.5 rounded-xl font-bold text-sm shadow-lg shadow-emerald-500/30 hover:shadow-xl hover:shadow-emerald-500/40 transition-all duration-300 transform hover:-translate-y-0.5"
                >
                  <span className="relative z-10 flex items-center gap-2">
                    Start Free Trial
                    <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </span>
                  <span className="absolute inset-0 bg-gradient-to-r from-emerald-600 to-emerald-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section - "Operating System for Hospitality" */}
      <section className="relative overflow-hidden bg-gradient-to-br from-white via-emerald-50/30 to-white">
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-20 left-10 w-96 h-96 bg-emerald-200/20 rounded-full mix-blend-multiply filter blur-3xl animate-blob"></div>
          <div className="absolute top-40 right-10 w-96 h-96 bg-emerald-300/20 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000"></div>
          <div className="absolute -bottom-20 left-1/2 w-96 h-96 bg-emerald-100/20 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-4000"></div>
        </div>

        <div className="app-container relative py-20 sm:py-28 lg:py-40">
          <div className="max-w-4xl mx-auto text-center">
            {/* Trust Badge */}
            <div className="inline-flex items-center gap-2 bg-emerald-50 border border-emerald-100 text-emerald-700 px-4 py-2 rounded-full text-sm font-semibold mb-8 shadow-sm">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              Trusted by 1,000+ professional kitchens
            </div>
              
            {/* Main Headline - OS for Hospitality */}
            <h1 className="text-4xl sm:text-5xl lg:text-7xl xl:text-8xl font-bold text-gray-900 mb-6 leading-[1.1] tracking-tight">
              The Operating System
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 via-emerald-500 to-emerald-600 animate-gradient">
                for Hospitality
              </span>
            </h1>

            {/* Tagline - "Let us do the thinking for you" */}
            <p className="text-xl sm:text-2xl lg:text-3xl text-gray-600 mb-4 font-medium">
              Let us do the thinking for you
            </p>
              
            <p className="text-lg sm:text-xl lg:text-2xl text-gray-500 mb-12 max-w-2xl mx-auto leading-relaxed">
              Everything your kitchen needs in one platform. Recipes, costs, inventory, team management—all connected, all automated, all protected.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <a
                href="/register"
                className="group bg-gradient-to-r from-emerald-500 to-emerald-600 text-white text-lg px-8 py-4 rounded-2xl font-bold shadow-xl shadow-emerald-500/30 hover:shadow-2xl hover:shadow-emerald-500/40 transition-all duration-300 transform hover:-translate-y-1 flex items-center justify-center gap-3"
              >
                Start Free Trial
                <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </a>
              <a
                href="#demo"
                className="group border-2 border-gray-300 text-gray-700 text-lg px-8 py-4 rounded-2xl font-bold hover:border-emerald-500 hover:bg-emerald-50 transition-all duration-300 flex items-center justify-center gap-3 backdrop-blur-sm bg-white/50"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Watch Demo
              </a>
            </div>

            {/* Trust Indicators */}
            <div className="flex flex-wrap justify-center gap-6 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-emerald-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                No credit card required
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-emerald-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Setup in 5 minutes
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-emerald-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                14-day free trial
              </div>
            </div>
          </div>

          {/* Hero Visual - Modern Dashboard Preview */}
          <div className="mt-20 lg:mt-32 relative">
            <div className="relative max-w-6xl mx-auto">
              <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-gray-200/50 p-8 lg:p-12 transform hover:scale-[1.01] transition-transform duration-500">
                <div className="grid md:grid-cols-3 gap-6">
                  {/* Recipe Card */}
                  <div className="bg-gradient-to-br from-emerald-50 to-emerald-100/50 rounded-2xl p-6 border border-emerald-200/50">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-xl font-bold text-gray-900">Sourdough Loaf</h3>
                      <span className="bg-emerald-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg shadow-emerald-500/30">
                        Protected
                      </span>
                    </div>
                    <div className="space-y-2 mb-4">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Strong White Flour</span>
                        <span className="font-semibold text-gray-900">500g</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Water</span>
                        <span className="font-semibold text-gray-900">350ml</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Starter</span>
                        <span className="font-semibold text-gray-900">100g</span>
                      </div>
                    </div>
                    <div className="pt-4 border-t border-emerald-200">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Cost</span>
                        <span className="text-xl font-bold text-emerald-700">£1.85</span>
                      </div>
                    </div>
                  </div>

                  {/* Cost Tracking Card */}
                  <div className="bg-gradient-to-br from-amber-50 to-amber-100/50 rounded-2xl p-6 border border-amber-200/50">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">Cost Tracker</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Chocolate Cake</span>
                        <span className="text-sm font-bold text-gray-900">£8.45</span>
                      </div>
                      <div className="bg-white rounded-lg p-3">
                        <div className="text-xs text-gray-500 mb-1">Food Cost %</div>
                        <div className="text-2xl font-bold text-amber-700">23.7%</div>
                      </div>
                    </div>
                  </div>

                  {/* Team Management Card */}
                  <div className="bg-gradient-to-br from-indigo-50 to-indigo-100/50 rounded-2xl p-6 border border-indigo-200/50">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">Team</h3>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center text-white text-xs font-bold">S</div>
                        <span className="text-sm text-gray-700">Sarah (Owner)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-amber-500 rounded-full flex items-center justify-center text-white text-xs font-bold">M</div>
                        <span className="text-sm text-gray-700">Mike (Chef)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-indigo-500 rounded-full flex items-center justify-center text-white text-xs font-bold">J</div>
                        <span className="text-sm text-gray-700">Julia (Baker)</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Glow effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-400/20 via-transparent to-emerald-400/20 rounded-3xl blur-2xl -z-10"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Value Proposition - "Everything Connected" */}
      <section className="py-20 lg:py-32 bg-white">
        <div className="app-container">
          <div className="text-center mb-16 lg:mb-24">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
              Everything Your Kitchen Needs
              <br />
              <span className="text-emerald-600">All in One Place</span>
            </h2>
            <p className="text-xl lg:text-2xl text-gray-600 max-w-3xl mx-auto">
              Recipes, costs, inventory, staff, suppliers—every piece of your operation connected and automated.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
            {/* Feature 1 */}
            <div className="group bg-gradient-to-br from-white to-gray-50 rounded-2xl p-8 border border-gray-200 hover:border-emerald-300 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
              <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center mb-6 shadow-lg shadow-emerald-500/25">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Recipe Management</h3>
              <p className="text-gray-600 leading-relaxed">
                Build, protect, and scale your recipes with automatic cost calculations and secure access controls.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="group bg-gradient-to-br from-white to-gray-50 rounded-2xl p-8 border border-gray-200 hover:border-emerald-300 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
              <div className="w-14 h-14 bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl flex items-center justify-center mb-6 shadow-lg shadow-amber-500/25">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Smart Costing</h3>
              <p className="text-gray-600 leading-relaxed">
                Real-time cost tracking with automatic updates. Know your margins instantly, optimize pricing effortlessly.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="group bg-gradient-to-br from-white to-gray-50 rounded-2xl p-8 border border-gray-200 hover:border-emerald-300 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
              <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl flex items-center justify-center mb-6 shadow-lg shadow-indigo-500/25">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Team Management</h3>
              <p className="text-gray-600 leading-relaxed">
                PIN-based access, role permissions, instant onboarding. Your team connected in seconds, not days.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="group bg-gradient-to-br from-white to-gray-50 rounded-2xl p-8 border border-gray-200 hover:border-emerald-300 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
              <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center mb-6 shadow-lg shadow-purple-500/25">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Secure by Design</h3>
              <p className="text-gray-600 leading-relaxed">
                Device-based access means recipes stay in your kitchen. No cloud leaks, no home access, no theft.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Deep Dive Features */}
      <section id="features" className="py-20 lg:py-32 bg-gradient-to-b from-gray-50 to-white">
        <div className="app-container">
          {/* Feature 1 - Security */}
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center mb-24 lg:mb-32">
            <div>
              <div className="inline-flex items-center gap-2 bg-emerald-100 text-emerald-700 px-4 py-2 rounded-full text-sm font-semibold mb-6">
                🔒 Security First
              </div>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-6 leading-tight">
                Your Recipes Protected
                <br />
                <span className="text-emerald-600">Like They Should Be</span>
              </h2>
              <p className="text-lg lg:text-xl text-gray-600 mb-8 leading-relaxed">
                Device-based PINs mean staff can only access recipes on your authorized kitchen devices. No home access. No cloud leaks. No recipe theft.
              </p>
              <ul className="space-y-5">
                <li className="flex items-start gap-4">
                  <div className="w-6 h-6 bg-emerald-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                    <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900 mb-1">Device-Only Access</h4>
                    <p className="text-gray-600">PINs work only on your authorized kitchen devices. No home access possible.</p>
                  </div>
                </li>
                <li className="flex items-start gap-4">
                  <div className="w-6 h-6 bg-emerald-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                    <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900 mb-1">Instant Revocation</h4>
                    <p className="text-gray-600">Remove access instantly when someone leaves. No more worrying about ex-staff.</p>
                  </div>
                </li>
                <li className="flex items-start gap-4">
                  <div className="w-6 h-6 bg-emerald-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                    <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900 mb-1">Role-Based Permissions</h4>
                    <p className="text-gray-600">Control exactly who can view, edit, or manage recipes and costs.</p>
                  </div>
                </li>
              </ul>
            </div>
            <div className="relative">
              <div className="bg-gradient-to-br from-emerald-50 to-emerald-100/50 rounded-3xl p-8 border border-emerald-200/50 shadow-2xl">
                <div className="bg-white rounded-2xl p-8 shadow-lg">
                  <div className="flex items-center gap-4 mb-8">
                    <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/30">
                      <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900 text-lg">Work iPad Access</h4>
                      <p className="text-sm text-gray-600">Kitchen Device Only</p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    {["Alice (Baker)", "Bob (Chef)", "Carol (Manager)"].map((name, i) => (
                      <div key={i} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                        <span className="text-gray-700 font-medium">{name}</span>
                        <span className="font-mono text-lg text-emerald-600 font-bold">PIN: ••••</span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-6 p-4 bg-emerald-50 rounded-xl border border-emerald-200">
                    <p className="text-sm text-emerald-800 font-bold flex items-center gap-2">
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      Access granted on work devices only
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        
          {/* Feature 2 - Smart Costing */}
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center mb-24 lg:mb-32">
            <div className="order-2 lg:order-1">
              <div className="bg-gradient-to-br from-amber-50 to-amber-100/50 rounded-3xl p-8 border border-amber-200/50 shadow-2xl">
                <div className="bg-white rounded-2xl p-8 shadow-lg">
                  <h4 className="font-bold text-gray-900 mb-6 text-xl">Real-Time Cost Calculation</h4>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                      <div>
                        <p className="font-bold text-gray-900">Chocolate Cake</p>
                        <p className="text-sm text-gray-600">Makes 12 slices</p>
                      </div>
                      <div className="text-right">
                        <p className="text-3xl font-bold text-gray-900">£8.45</p>
                        <p className="text-sm text-gray-600">total cost</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200">
                        <p className="text-sm text-gray-600 mb-1">Per slice</p>
                        <p className="text-2xl font-bold text-emerald-700">£0.70</p>
                      </div>
                      <div className="p-4 bg-amber-50 rounded-xl border border-amber-200">
                        <p className="text-sm text-gray-600 mb-1">Food Cost</p>
                        <p className="text-2xl font-bold text-amber-700">23.7%</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-emerald-700 font-bold p-3 bg-emerald-50 rounded-xl">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                      </svg>
                      Optimal food cost percentage
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="order-1 lg:order-2">
              <div className="inline-flex items-center gap-2 bg-amber-100 text-amber-700 px-4 py-2 rounded-full text-sm font-semibold mb-6">
                💰 Smart Pricing
              </div>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-6 leading-tight">
                Costs That Update
                <br />
                <span className="text-amber-600">Themselves</span>
              </h2>
              <p className="text-lg lg:text-xl text-gray-600 mb-8 leading-relaxed">
                Change an ingredient price once. Every recipe updates automatically. Set target food costs and get instant pricing recommendations.
              </p>
              <ul className="space-y-5">
                <li className="flex items-start gap-4">
                  <div className="w-6 h-6 bg-amber-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                    <svg className="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900 mb-1">Live Cost Updates</h4>
                    <p className="text-gray-600">Change an ingredient price once, see every affected recipe update automatically.</p>
                  </div>
                </li>
                <li className="flex items-start gap-4">
                  <div className="w-6 h-6 bg-amber-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                    <svg className="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900 mb-1">Smart Unit Conversion</h4>
                    <p className="text-gray-600">Buy in kilos, use in cups. We handle all conversions with density-based accuracy.</p>
                  </div>
                </li>
                <li className="flex items-start gap-4">
                  <div className="w-6 h-6 bg-amber-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                    <svg className="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900 mb-1">Pricing Recommendations</h4>
                    <p className="text-gray-600">Set your target food cost %. Get suggested selling prices instantly.</p>
                  </div>
                </li>
              </ul>
            </div>
          </div>

          {/* Feature 3 - Team */}
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            <div>
              <div className="inline-flex items-center gap-2 bg-indigo-100 text-indigo-700 px-4 py-2 rounded-full text-sm font-semibold mb-6">
                👥 Team Power
              </div>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-6 leading-tight">
                Your Whole Team
                <br />
                <span className="text-indigo-600">One Platform</span>
              </h2>
              <p className="text-lg lg:text-xl text-gray-600 mb-8 leading-relaxed">
                No email hassles. Add team members in seconds with PINs. Control permissions by role. Keep everyone synchronized.
              </p>
              <ul className="space-y-5">
                <li className="flex items-start gap-4">
                  <div className="w-6 h-6 bg-indigo-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                    <svg className="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900 mb-1">Zero Email Setup</h4>
                    <p className="text-gray-600">Add staff in 30 seconds. Just name, role, and PIN. No email required.</p>
                  </div>
                </li>
                <li className="flex items-start gap-4">
                  <div className="w-6 h-6 bg-indigo-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                    <svg className="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900 mb-1">Granular Permissions</h4>
                    <p className="text-gray-600">Owners, Admins, Editors, Viewers—each role sees exactly what they need.</p>
                  </div>
                </li>
                <li className="flex items-start gap-4">
                  <div className="w-6 h-6 bg-indigo-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                    <svg className="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900 mb-1">Centralized Updates</h4>
                    <p className="text-gray-600">Update a recipe once. Everyone sees the latest version instantly.</p>
                  </div>
                </li>
              </ul>
            </div>
            <div className="relative">
              <div className="bg-gradient-to-br from-indigo-50 to-indigo-100/50 rounded-3xl p-8 border border-indigo-200/50 shadow-2xl">
                <div className="bg-white rounded-2xl p-8 shadow-lg">
                  <h4 className="font-bold text-gray-900 mb-6 text-xl">Team Members (5)</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center">
                          <span className="text-indigo-700 font-bold">S</span>
                        </div>
                        <div>
                          <p className="font-bold text-gray-900">Sarah Chen</p>
                          <p className="text-sm text-gray-600">Owner</p>
                        </div>
                      </div>
                      <span className="text-xs bg-indigo-100 text-indigo-700 px-3 py-1 rounded-lg font-bold">
                        Full Access
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
                          <span className="text-emerald-700 font-bold">M</span>
                        </div>
                        <div>
                          <p className="font-bold text-gray-900">Mike Smith</p>
                          <p className="text-sm text-gray-600">Head Chef</p>
                        </div>
                      </div>
                      <span className="text-xs bg-emerald-100 text-emerald-700 px-3 py-1 rounded-lg font-bold">
                        Editor
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
                          <span className="text-amber-700 font-bold">J</span>
                        </div>
                        <div>
                          <p className="font-bold text-gray-900">Julia Park</p>
                          <p className="text-sm text-gray-600">Sous Chef</p>
                        </div>
                      </div>
                      <span className="text-xs bg-amber-100 text-amber-700 px-3 py-1 rounded-lg font-bold">
                        Viewer
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof / Stats */}
      <section className="py-20 lg:py-32 bg-gradient-to-r from-emerald-600 via-emerald-700 to-emerald-600 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48cGF0aCBkPSJNMzYgMTBjMy4zMSAwIDYgMi42OSA2IDZzLTIuNjkgNi02IDYtNi0yLjY5LTYtNiAyLjY5LTYgNi02TTEyIDQwYzMuMzEgMCA2IDIuNjkgNiA2cy0yLjY5IDYtNiA2LTYtMi42OS02LTYgMi42OS02IDYtNiIvPjwvZz48L2c+PC9zdmc+')] opacity-30"></div>
        <div className="app-container relative">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 lg:gap-12 text-center text-white">
            {[
              { number: "1,000+", label: "Kitchens Protected" },
              { number: "50K+", label: "Recipes Managed" },
              { number: "£2M+", label: "Costs Tracked" },
              { number: "4.9★", label: "Average Rating" }
            ].map((stat, i) => (
              <div key={i} className="transform hover:scale-105 transition-transform duration-300">
                <div className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-3">{stat.number}</div>
                <div className="text-emerald-100 text-sm sm:text-base lg:text-lg">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 lg:py-32 bg-white">
        <div className="app-container">
          <div className="text-center mb-16 lg:mb-24">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
              Loved by Food Professionals
            </h2>
            <p className="text-xl lg:text-2xl text-gray-600">See why kitchens are switching to Plato</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 lg:gap-12">
            <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl p-8 border border-gray-200 hover:border-emerald-300 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
              <div className="flex gap-1 mb-6">
                {[1,2,3,4,5].map(j => (
                  <svg key={j} className="w-5 h-5 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <p className="text-gray-700 mb-6 text-lg leading-relaxed">"Finally stopped worrying about staff stealing our signature recipes. The PIN system is genius—they can only access on our kitchen iPad."</p>
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-emerald-100 rounded-xl flex items-center justify-center">
                  <span className="text-emerald-700 font-bold text-lg">JB</span>
                </div>
                <div>
                  <p className="font-bold text-gray-900">James Butler</p>
                  <p className="text-sm text-gray-600">Owner, Butler's Bakery</p>
                </div>
              </div>
            </div>
            <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl p-8 border border-gray-200 hover:border-emerald-300 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
              <div className="flex gap-1 mb-6">
                {[1,2,3,4,5].map(j => (
                  <svg key={j} className="w-5 h-5 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <p className="text-gray-700 mb-6 text-lg leading-relaxed">"Cut my food costing time from 3 hours to 15 minutes. The automatic calculations when ingredient prices change are a game-changer."</p>
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-amber-100 rounded-xl flex items-center justify-center">
                  <span className="text-amber-700 font-bold text-lg">MR</span>
                </div>
                <div>
                  <p className="font-bold text-gray-900">Maria Rodriguez</p>
                  <p className="text-sm text-gray-600">Head Chef, The Green Olive</p>
                </div>
              </div>
            </div>
            <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl p-8 border border-gray-200 hover:border-emerald-300 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
              <div className="flex gap-1 mb-6">
                {[1,2,3,4,5].map(j => (
                  <svg key={j} className="w-5 h-5 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <p className="text-gray-700 mb-6 text-lg leading-relaxed">"Our food costs dropped 8% in the first month just by having accurate data. Paid for itself immediately."</p>
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-indigo-100 rounded-xl flex items-center justify-center">
                  <span className="text-indigo-700 font-bold text-lg">TC</span>
                </div>
                <div>
                  <p className="font-bold text-gray-900">Tom Chen</p>
                  <p className="text-sm text-gray-600">Owner, Chen's Dim Sum</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 lg:py-32 bg-gradient-to-b from-gray-50 to-white">
        <div className="app-container">
          <div className="text-center mb-16 lg:mb-24">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
              Get Started in 3 Simple Steps
            </h2>
            <p className="text-xl lg:text-2xl text-gray-600">Be up and running in under 5 minutes</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 lg:gap-12">
            <div className="text-center group">
              <div className="relative inline-flex items-center justify-center w-20 h-20 lg:w-24 lg:h-24 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-3xl shadow-xl shadow-emerald-500/30 mb-6 transform group-hover:scale-110 transition-transform duration-300">
                <span className="text-3xl lg:text-4xl font-bold text-white">1</span>
              </div>
              <h3 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-4">Add Your Ingredients</h3>
              <p className="text-lg text-gray-600 leading-relaxed">Import or enter your ingredients with purchase prices. We calculate per-unit costs automatically.</p>
            </div>
            <div className="text-center group">
              <div className="relative inline-flex items-center justify-center w-20 h-20 lg:w-24 lg:h-24 bg-gradient-to-br from-amber-500 to-amber-600 rounded-3xl shadow-xl shadow-amber-500/30 mb-6 transform group-hover:scale-110 transition-transform duration-300">
                <span className="text-3xl lg:text-4xl font-bold text-white">2</span>
              </div>
              <h3 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-4">Build Your Recipes</h3>
              <p className="text-lg text-gray-600 leading-relaxed">Create recipes using any units you want. See costs update in real-time as you work.</p>
            </div>
            <div className="text-center group">
              <div className="relative inline-flex items-center justify-center w-20 h-20 lg:w-24 lg:h-24 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-3xl shadow-xl shadow-indigo-500/30 mb-6 transform group-hover:scale-110 transition-transform duration-300">
                <span className="text-3xl lg:text-4xl font-bold text-white">3</span>
              </div>
              <h3 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-4">Add Your Team</h3>
              <p className="text-lg text-gray-600 leading-relaxed">Give team members PINs for secure device-based access. Start collaborating instantly.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 lg:py-32 bg-gradient-to-br from-emerald-600 via-emerald-700 to-emerald-800 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48cGF0aCBkPSJNMzYgMTBjMy4zMSAwIDYgMi42OSA2IDZzLTIuNjkgNi02IDYtNi0yLjY5LTYtNiAyLjY5LTYgNi02TTEyIDQwYzMuMzEgMCA2IDIuNjkgNiA2cy0yLjY5IDYtNiA2LTYtMi42OS02LTYgMi42OS02IDYtNiIvPjwvZz48L2c+PC9zdmc+')] opacity-40"></div>
        <div className="app-container text-center relative z-10">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold text-white mb-6 leading-tight">
            Ready to Transform Your Kitchen?
          </h2>
          <p className="text-xl lg:text-2xl xl:text-3xl text-emerald-100 mb-12 max-w-3xl mx-auto leading-relaxed">
            Join over 1,000 professional kitchens using Plato as their operating system for hospitality.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <a
              href="/register"
              className="group bg-white text-emerald-600 px-10 py-5 rounded-2xl font-bold text-lg lg:text-xl shadow-2xl hover:bg-gray-50 transition-all duration-300 transform hover:-translate-y-1 flex items-center justify-center gap-3"
            >
              Start Your Free Trial
              <svg className="w-6 h-6 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </a>
            <a
              href="/pricing"
              className="border-2 border-white text-white px-10 py-5 rounded-2xl font-bold text-lg lg:text-xl hover:bg-white/10 transition-all duration-300 backdrop-blur-sm"
            >
              View Pricing
            </a>
          </div>

          <div className="flex flex-wrap justify-center gap-8 text-emerald-100 text-base lg:text-lg">
            {["Free 14-day trial", "No credit card required", "Cancel anytime"].map((item, i) => (
              <div key={i} className="flex items-center gap-2">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                {item}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white py-16">
        <div className="app-container">
          <div className="grid md:grid-cols-4 gap-12 mb-12">
            <div>
              <div className="flex items-center gap-3 mb-6">
                <img src="/images/plato-logo.png" alt="Plato" className="h-10 w-auto" />
              </div>
              <p className="text-gray-600 leading-relaxed">
                The operating system for hospitality. Everything your kitchen needs, all in one place.
              </p>
            </div>
            <div>
              <h4 className="font-bold text-gray-900 mb-4">Product</h4>
              <ul className="space-y-3 text-gray-600">
                <li><a href="#features" className="hover:text-gray-900 transition-colors">Features</a></li>
                <li><a href="/pricing" className="hover:text-gray-900 transition-colors">Pricing</a></li>
                <li><a href="/security" className="hover:text-gray-900 transition-colors">Security</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-gray-900 mb-4">Company</h4>
              <ul className="space-y-3 text-gray-600">
                <li><a href="/about" className="hover:text-gray-900 transition-colors">About</a></li>
                <li><a href="/blog" className="hover:text-gray-900 transition-colors">Blog</a></li>
                <li><a href="/contact" className="hover:text-gray-900 transition-colors">Contact</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-gray-900 mb-4">Legal</h4>
              <ul className="space-y-3 text-gray-600">
                <li><a href="/privacy" className="hover:text-gray-900 transition-colors">Privacy</a></li>
                <li><a href="/terms" className="hover:text-gray-900 transition-colors">Terms</a></li>
                <li><a href="/security" className="hover:text-gray-900 transition-colors">Security</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-200 pt-8 text-center text-gray-600">
            <p>© 2025 Plato. All rights reserved. Built for food businesses who value their recipes.</p>
          </div>
        </div>
      </footer>

      <style jsx>{`
        @keyframes blob {
          0%, 100% { transform: translate(0, 0) scale(1); }
          25% { transform: translate(20px, -50px) scale(1.1); }
          50% { transform: translate(-20px, 20px) scale(0.9); }
          75% { transform: translate(20px, 50px) scale(1.05); }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
        @keyframes gradient {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        .animate-gradient {
          background-size: 200% 200%;
          animation: gradient 3s ease infinite;
        }
      `}</style>
    </div>
  );
}
