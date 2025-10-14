"use client";

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      {/* Navigation Bar */}
      <nav className="border-b border-gray-200 bg-white/95 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Mobile Nav */}
          <div className="flex md:hidden justify-between items-center h-16">
            <a href="/login" className="text-gray-600 hover:text-gray-900 font-medium text-sm">
              Login
            </a>
            <img 
              src="/images/plato-logo.svg" 
              alt="Plato" 
              className="h-10 w-auto"
              onError={(e) => {
                const img = e.currentTarget;
                if (img.src.endsWith('.svg')) {
                  img.src = '/images/plato-logo.png';
                }
              }}
            />
            <a
              href="/register"
              className="bg-gradient-to-r from-green-500 to-green-600 text-white px-4 py-2 rounded-lg font-semibold text-sm"
            >
              Sign Up
            </a>
          </div>

          {/* Desktop Nav */}
          <div className="hidden md:flex justify-between items-center h-16">
            {/* Left spacer for balance */}
            <div className="flex-1 flex justify-start">
              <div className="flex items-center gap-4">
                <a href="#features" className="text-gray-600 hover:text-gray-900 font-medium transition-colors hidden lg:block">
                  Features
                </a>
                <a href="/pricing" className="text-gray-600 hover:text-gray-900 font-medium transition-colors">
                  Pricing
                </a>
              </div>
            </div>
            
            {/* Centered Logo */}
            <div className="flex items-center justify-center absolute left-1/2 transform -translate-x-1/2">
              <img 
                src="/images/plato-logo.svg" 
                alt="Plato" 
                className="h-12 w-auto"
                onError={(e) => {
                  const img = e.currentTarget;
                  if (img.src.endsWith('.svg')) {
                    img.src = '/images/plato-logo.png';
                  }
                }}
              />
            </div>
            
            {/* Right nav items */}
            <div className="flex-1 flex justify-end">
              <div className="flex items-center gap-6">
                <a href="/login" className="text-gray-600 hover:text-gray-900 font-medium transition-colors">
                  Login
                </a>
                <a
                  href="/register"
                  className="bg-gradient-to-r from-green-500 to-green-600 text-white px-6 py-2.5 rounded-lg hover:shadow-lg font-semibold transition-all shadow-sm"
                >
                  Start Free Trial
                </a>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section - Problem/Solution Focused */}
      <div className="relative overflow-hidden bg-gradient-to-br from-green-50 via-white to-green-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-20 lg:py-32">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            {/* Left Column - Copy */}
            <div>
              <div className="inline-flex items-center gap-2 bg-green-100 text-green-700 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-semibold mb-4 sm:mb-6">
                <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Trusted by 1,000+ professional kitchens
          </div>
              
              <h1 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold text-gray-900 mb-4 sm:mb-6 leading-tight">
                Protect Your Recipes.<br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-green-700">
                  Perfect Your Costs.
                </span>
        </h1>
              
              <p className="text-base sm:text-lg lg:text-xl text-gray-600 mb-6 sm:mb-8 leading-relaxed">
                The only recipe management platform built for food businesses that need to protect their secrets 
                while mastering their food costs. Stop recipe theft, optimize pricing, and control team access.
              </p>

              <div className="flex flex-col gap-3 sm:gap-4 mb-6 sm:mb-8">
          <a
            href="/register"
                  className="group bg-gradient-to-r from-green-500 to-green-600 text-white text-base sm:text-lg px-6 sm:px-8 py-3 sm:py-4 rounded-xl font-semibold hover:shadow-xl transition-all duration-200 shadow-lg transform hover:-translate-y-0.5 flex items-center justify-center gap-2"
          >
                  Start Free Trial
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
          </a>
          <a
                  href="#demo"
                  className="border-2 border-gray-300 text-gray-700 text-base sm:text-lg px-6 sm:px-8 py-3 sm:py-4 rounded-xl font-semibold hover:border-green-500 hover:bg-green-50 transition-all duration-200 flex items-center justify-center gap-2"
                >
                  <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Watch Demo
                </a>
              </div>

              {/* Trust Indicators */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-6 text-xs sm:text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 sm:w-5 sm:h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                No credit card required
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 sm:w-5 sm:h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Setup in 5 minutes
              </div>
              </div>
            </div>

            {/* Right Column - Visual/Screenshot - Hidden on small mobile */}
            <div className="relative hidden sm:block">
              <div className="relative bg-white rounded-2xl shadow-2xl border border-gray-200 p-8">
                {/* Mock Recipe Card */}
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-2xl font-bold text-gray-900">Sourdough Loaf</h3>
                    <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-semibold">
                      £1.85 cost
                    </span>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between py-2 border-b border-gray-100">
                      <span className="text-gray-600">Strong White Flour</span>
                      <span className="font-semibold">500g</span>
                    </div>
                    <div className="flex items-center justify-between py-2 border-b border-gray-100">
                      <span className="text-gray-600">Water</span>
                      <span className="font-semibold">350ml</span>
                    </div>
                    <div className="flex items-center justify-between py-2 border-b border-gray-100">
                      <span className="text-gray-600">Sourdough Starter</span>
                      <span className="font-semibold">100g</span>
                    </div>
                    <div className="flex items-center justify-between py-2">
                      <span className="text-gray-600">Sea Salt</span>
                      <span className="font-semibold">10g</span>
                    </div>
                  </div>
                  <div className="mt-6 p-4 bg-gradient-to-r from-green-50 to-green-100 rounded-lg">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-700">Selling Price: £5.50</span>
                      <span className="font-bold text-green-700">Food Cost: 33.6%</span>
                    </div>
                  </div>
                </div>
                {/* Security Badge */}
                <div className="absolute -top-4 -right-4 bg-gradient-to-br from-green-500 to-green-600 text-white px-4 py-2 rounded-full shadow-lg flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  <span className="text-sm font-semibold">Protected</span>
                </div>
              </div>
              {/* Decorative Elements */}
              <div className="absolute -z-10 top-10 -left-10 w-72 h-72 bg-green-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob"></div>
              <div className="absolute -z-10 top-20 -right-10 w-72 h-72 bg-green-300 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-2000"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Problem Statement Section */}
      <div className="py-12 sm:py-16 lg:py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8 sm:mb-12 lg:mb-16">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-3 sm:mb-4">You've worked too hard to lose your recipes</h2>
            <p className="text-base sm:text-lg lg:text-xl text-gray-600 max-w-3xl mx-auto">
              Every food business faces the same challenges. We've built the solution.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Problem 1 */}
            <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-200">
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Recipe Theft</h3>
              <p className="text-gray-600 mb-4">
                Staff accessing your secret recipes from home. Competitors copying your signature dishes.
              </p>
              <div className="flex items-center gap-2 text-emerald-600 font-semibold">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                We solve this
              </div>
            </div>

            {/* Problem 2 */}
            <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-200">
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Cost Chaos</h3>
              <p className="text-gray-600 mb-4">
                Spreadsheets breaking. Manual calculations taking hours. Pricing guesswork losing you money.
              </p>
              <div className="flex items-center gap-2 text-emerald-600 font-semibold">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                We solve this
              </div>
            </div>

            {/* Problem 3 */}
            <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-200">
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Team Headaches</h3>
              <p className="text-gray-600 mb-4">
                No control over who sees what. Email invites ignored. Staff sharing passwords.
              </p>
              <div className="flex items-center gap-2 text-emerald-600 font-semibold">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                We solve this
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Key Features Section */}
      <div id="features" className="py-12 sm:py-16 lg:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Feature 1 - Recipe Protection */}
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-16 items-center mb-16 lg:mb-32">
            <div>
              <div className="inline-flex items-center gap-2 bg-emerald-100 text-emerald-700 px-4 py-2 rounded-full text-sm font-semibold mb-6">
                🔒 Security First
              </div>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-4 sm:mb-6">
                Stop Recipe Theft Cold
              </h2>
              <p className="text-base sm:text-lg lg:text-xl text-gray-600 mb-6 sm:mb-8">
                Your recipes are your competitive advantage. Our device-based PIN system means staff can only 
                access recipes on your work devices—never from home.
              </p>
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <svg className="w-6 h-6 text-emerald-600 flex-shrink-0 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-1">Device-Only Access</h4>
                    <p className="text-gray-600">PINs work only on your authorized kitchen devices. No home access possible.</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <svg className="w-6 h-6 text-emerald-600 flex-shrink-0 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-1">Instant Revocation</h4>
                    <p className="text-gray-600">Remove access instantly when someone leaves. No more worrying about ex-staff.</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <svg className="w-6 h-6 text-emerald-600 flex-shrink-0 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-1">Role-Based Permissions</h4>
                    <p className="text-gray-600">Control exactly who can view, edit, or manage recipes and costs.</p>
                  </div>
                </li>
              </ul>
            </div>
            <div className="relative">
              <div className="bg-gradient-to-br from-emerald-100 to-emerald-50 rounded-2xl p-8">
                <div className="bg-white rounded-xl p-6 shadow-lg">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 bg-emerald-600 rounded-full flex items-center justify-center">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900">Work iPad Access</h4>
                      <p className="text-sm text-gray-600">Your bakery device</p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="text-gray-700">Alice (Baker)</span>
                      <span className="font-mono text-lg text-emerald-600">PIN: ••••</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="text-gray-700">Bob (Chef)</span>
                      <span className="font-mono text-lg text-emerald-600">PIN: ••••</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="text-gray-700">Carol (Manager)</span>
                      <span className="font-mono text-lg text-emerald-600">PIN: ••••</span>
                    </div>
                  </div>
                  <div className="mt-6 p-4 bg-emerald-50 rounded-lg border border-emerald-200">
                    <p className="text-sm text-emerald-800 font-semibold">✓ Access granted on work devices only</p>
                  </div>
                </div>
              </div>
            </div>
        </div>
        
          {/* Feature 2 - Cost Management */}
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-16 items-center mb-16 lg:mb-32">
            <div className="order-2 lg:order-1">
              <div className="bg-gradient-to-br from-amber-100 to-amber-50 rounded-2xl p-8">
                <div className="bg-white rounded-xl p-6 shadow-lg">
                  <h4 className="font-bold text-gray-900 mb-4">Real-Time Cost Calculation</h4>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-semibold text-gray-900">Chocolate Cake</p>
                        <p className="text-sm text-gray-600">Makes 12 slices</p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-gray-900">£8.45</p>
                        <p className="text-sm text-gray-600">total cost</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-3 bg-emerald-50 rounded-lg">
                        <p className="text-sm text-gray-600">Per slice</p>
                        <p className="text-xl font-bold text-emerald-700">£0.70</p>
                      </div>
                      <div className="p-3 bg-amber-50 rounded-lg">
                        <p className="text-sm text-gray-600">Sell at £2.95</p>
                        <p className="text-xl font-bold text-amber-700">23.7%</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-emerald-700 font-semibold">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
                      Optimal food cost %
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="order-1 lg:order-2">
              <div className="inline-flex items-center gap-2 bg-amber-100 text-amber-700 px-4 py-2 rounded-full text-sm font-semibold mb-6">
                💰 Smart Pricing
              </div>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-4 sm:mb-6">
                Know Your True Costs—Instantly
              </h2>
              <p className="text-base sm:text-lg lg:text-xl text-gray-600 mb-6 sm:mb-8">
                Stop guessing. Get automatic cost calculations with every recipe change. Set target food costs 
                and get recommended pricing that protects your margins.
              </p>
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <svg className="w-6 h-6 text-amber-600 flex-shrink-0 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-1">Live Cost Updates</h4>
                    <p className="text-gray-600">Change an ingredient price once, see every affected recipe update automatically.</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <svg className="w-6 h-6 text-amber-600 flex-shrink-0 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-1">Smart Unit Conversion</h4>
                    <p className="text-gray-600">Buy in kilos, use in cups. We handle all conversions with density-based accuracy.</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <svg className="w-6 h-6 text-amber-600 flex-shrink-0 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-1">Pricing Recommendations</h4>
                    <p className="text-gray-600">Set your target food cost %. Get suggested selling prices instantly.</p>
                  </div>
                </li>
              </ul>
            </div>
          </div>

          {/* Feature 3 - Team Collaboration */}
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-16 items-center">
            <div>
              <div className="inline-flex items-center gap-2 bg-indigo-100 text-indigo-700 px-4 py-2 rounded-full text-sm font-semibold mb-6">
                👥 Team Power
              </div>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-4 sm:mb-6">
                Your Whole Team, One Platform
              </h2>
              <p className="text-base sm:text-lg lg:text-xl text-gray-600 mb-6 sm:mb-8">
                No more email hassles. Add team members in seconds with simple PINs. Control permissions 
                by role. Keep everyone on the same page.
              </p>
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <svg className="w-6 h-6 text-indigo-600 flex-shrink-0 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-1">Zero Email Setup</h4>
                    <p className="text-gray-600">Add staff in 30 seconds. Just name, role, and PIN. No email required.</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <svg className="w-6 h-6 text-indigo-600 flex-shrink-0 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-1">Granular Permissions</h4>
                    <p className="text-gray-600">Owners, Admins, Editors, Viewers—each role sees exactly what they need.</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <svg className="w-6 h-6 text-indigo-600 flex-shrink-0 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-1">Centralized Updates</h4>
                    <p className="text-gray-600">Update a recipe once. Everyone sees the latest version instantly.</p>
                  </div>
                </li>
              </ul>
            </div>
            <div className="relative">
              <div className="bg-gradient-to-br from-indigo-100 to-indigo-50 rounded-2xl p-8">
                <div className="bg-white rounded-xl p-6 shadow-lg">
                  <h4 className="font-bold text-gray-900 mb-4">Team Members (5)</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                          <span className="text-indigo-700 font-semibold">S</span>
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">Sarah Chen</p>
                          <p className="text-sm text-gray-600">Owner</p>
                        </div>
                      </div>
                      <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded">Full Access</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
                          <span className="text-emerald-700 font-semibold">M</span>
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">Mike Smith</p>
                          <p className="text-sm text-gray-600">Head Chef</p>
                        </div>
                      </div>
                      <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded">Editor</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
                          <span className="text-amber-700 font-semibold">J</span>
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">Julia Park</p>
                          <p className="text-sm text-gray-600">Sous Chef</p>
                        </div>
                      </div>
                      <span className="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded">Viewer</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Social Proof / Stats Section */}
      <div className="py-12 sm:py-16 lg:py-20 bg-gradient-to-r from-emerald-600 to-emerald-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8 text-center text-white">
            <div>
              <div className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-2">1,000+</div>
              <div className="text-emerald-100">Kitchens Protected</div>
            </div>
            <div>
              <div className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-2">50K+</div>
              <div className="text-emerald-100 text-sm sm:text-base">Recipes Managed</div>
            </div>
            <div>
              <div className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-2">£2M+</div>
              <div className="text-emerald-100 text-sm sm:text-base">Costs Tracked</div>
            </div>
            <div>
              <div className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-2">4.9★</div>
              <div className="text-emerald-100 text-sm sm:text-base">Average Rating</div>
            </div>
          </div>
        </div>
      </div>

      {/* Testimonials */}
      <div className="py-12 sm:py-16 lg:py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8 sm:mb-12 lg:mb-16">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-3 sm:mb-4">Loved by food professionals</h2>
            <p className="text-base sm:text-lg lg:text-xl text-gray-600">See why kitchens are switching to Plato</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-200">
              <div className="flex gap-1 mb-4">
                {[1,2,3,4,5].map(i => (
                  <svg key={i} className="w-5 h-5 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <p className="text-gray-700 mb-4">
                "Finally stopped worrying about staff stealing our signature recipes. The PIN system is genius—they can only access on our kitchen iPad."
              </p>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center">
                  <span className="text-emerald-700 font-bold">JB</span>
                </div>
                <div>
                  <p className="font-semibold text-gray-900">James Butler</p>
                  <p className="text-sm text-gray-600">Owner, Butler's Bakery</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-200">
              <div className="flex gap-1 mb-4">
                {[1,2,3,4,5].map(i => (
                  <svg key={i} className="w-5 h-5 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
                ))}
              </div>
              <p className="text-gray-700 mb-4">
                "Cut my food costing time from 3 hours to 15 minutes. The automatic calculations when ingredient prices change are a game-changer."
              </p>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center">
                  <span className="text-amber-700 font-bold">MR</span>
                </div>
                <div>
                  <p className="font-semibold text-gray-900">Maria Rodriguez</p>
                  <p className="text-sm text-gray-600">Head Chef, The Green Olive</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-200">
              <div className="flex gap-1 mb-4">
                {[1,2,3,4,5].map(i => (
                  <svg key={i} className="w-5 h-5 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <p className="text-gray-700 mb-4">
                "Our food costs dropped 8% in the first month just by having accurate data. Paid for itself immediately."
              </p>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center">
                  <span className="text-indigo-700 font-bold">TC</span>
                </div>
                <div>
                  <p className="font-semibold text-gray-900">Tom Chen</p>
                  <p className="text-sm text-gray-600">Owner, Chen's Dim Sum</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* How It Works */}
      <div className="py-12 sm:py-16 lg:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8 sm:mb-12 lg:mb-16">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-3 sm:mb-4">Get started in 3 simple steps</h2>
            <p className="text-base sm:text-lg lg:text-xl text-gray-600">Be up and running in under 5 minutes</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 sm:gap-12">
            <div className="text-center">
              <div className="relative inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl shadow-lg mb-4 sm:mb-6">
                <span className="text-2xl sm:text-3xl font-bold text-white">1</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2 sm:mb-3">Add Your Ingredients</h3>
              <p className="text-gray-600 text-sm sm:text-base lg:text-lg">
                Import or enter your ingredients with purchase prices. We calculate per-unit costs automatically.
              </p>
            </div>

            <div className="text-center">
              <div className="relative inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-amber-500 to-amber-600 rounded-2xl shadow-lg mb-4 sm:mb-6">
                <span className="text-2xl sm:text-3xl font-bold text-white">2</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2 sm:mb-3">Build Your Recipes</h3>
              <p className="text-gray-600 text-sm sm:text-base lg:text-lg">
                Create recipes using any units you want. See costs update in real-time as you work.
              </p>
            </div>

            <div className="text-center">
              <div className="relative inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-2xl shadow-lg mb-4 sm:mb-6">
                <span className="text-2xl sm:text-3xl font-bold text-white">3</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2 sm:mb-3">Add Your Team</h3>
              <p className="text-gray-600 text-sm sm:text-base lg:text-lg">
                Give team members PINs for secure device-based access. Start collaborating instantly.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Final CTA */}
      <div className="py-12 sm:py-16 lg:py-24 bg-gradient-to-br from-emerald-600 via-emerald-700 to-emerald-800 relative overflow-hidden">
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDE0YzMuMzEgMCA2IDIuNjkgNiA2cy0yLjY5IDYtNiA2LTYtMi42OS02LTYgMi42OS02IDYtNk0xMiA0MGMzLjMxIDAgNiAyLjY5IDYgNnMtMi42OSA2LTYgNi02LTIuNjktNi02IDIuNjktNiA2LTYiLz48L2c+PC9nPjwvc3ZnPg==')] opacity-40"></div>
        <div className="max-w-5xl mx-auto px-4 text-center relative z-10">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-bold text-white mb-4 sm:mb-6 leading-tight">
            Ready to protect your recipes and perfect your costs?
          </h2>
          <p className="text-base sm:text-lg lg:text-xl xl:text-2xl text-emerald-100 mb-8 sm:mb-12 max-w-3xl mx-auto">
            Join over 1,000 professional kitchens who trust Plato to protect their competitive advantage 
            and optimize their profitability.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center mb-6 sm:mb-8">
                <a
                  href="/register"
              className="group bg-white text-emerald-600 px-6 sm:px-10 py-3 sm:py-5 rounded-xl font-bold text-base sm:text-lg hover:bg-gray-50 transition-all duration-200 shadow-xl hover:shadow-2xl transform hover:-translate-y-0.5 flex items-center justify-center gap-2"
                >
              Start Your Free Trial
              <svg className="w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
                </a>
                <a
              href="/pricing"
              className="border-2 border-white text-white px-6 sm:px-10 py-3 sm:py-5 rounded-xl font-bold text-base sm:text-lg hover:bg-white/10 transition-all duration-200"
                >
              View Pricing
                </a>
              </div>

          <div className="flex flex-col sm:flex-row flex-wrap justify-center gap-3 sm:gap-8 text-emerald-100 text-sm sm:text-base">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              Free 14-day trial
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              No credit card required
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              Cancel anytime
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-3 mb-4">
              <img src="/images/plato-logo.svg" alt="Plato" className="h-10 w-auto" />
              </div>
              <p className="text-gray-600">
                Recipe management and cost control for professional kitchens.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-3">Product</h4>
              <ul className="space-y-2 text-gray-600">
                <li><a href="#features" className="hover:text-gray-900 transition-colors">Features</a></li>
                <li><a href="/pricing" className="hover:text-gray-900 transition-colors">Pricing</a></li>
                <li><a href="#" className="hover:text-gray-900 transition-colors">Security</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-3">Company</h4>
              <ul className="space-y-2 text-gray-600">
                <li><a href="#" className="hover:text-gray-900 transition-colors">About</a></li>
                <li><a href="#" className="hover:text-gray-900 transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-gray-900 transition-colors">Contact</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-3">Legal</h4>
              <ul className="space-y-2 text-gray-600">
                <li><a href="#" className="hover:text-gray-900 transition-colors">Privacy</a></li>
                <li><a href="#" className="hover:text-gray-900 transition-colors">Terms</a></li>
                <li><a href="#" className="hover:text-gray-900 transition-colors">Security</a></li>
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
      `}</style>
    </div>
  );
}
