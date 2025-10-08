export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      {/* Navigation Bar */}
      <nav className="border-b border-gray-200 bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <img 
                src="/images/plato-logo.svg" 
                alt="Plato" 
                className="h-10 w-auto"
              />
              <span className="text-2xl font-bold text-gray-900">Plato</span>
            </div>
            <div className="flex items-center gap-4">
              <a
                href="/pricing"
                className="text-gray-600 hover:text-gray-900 font-medium transition-colors"
              >
                Pricing
              </a>
              <a
                href="/login"
                className="text-gray-600 hover:text-gray-900 font-medium transition-colors"
              >
                Login
              </a>
              <a
                href="/register"
                className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 font-medium transition-colors shadow-sm"
              >
                Get Started
              </a>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="text-center py-20 px-4 bg-gradient-to-b from-gray-50 to-white">
        <div className="flex justify-center mb-8">
          <div className="relative">
            <img 
              src="/images/plato-logo.svg" 
              alt="Plato" 
              className="h-24 w-auto"
            />
            <div className="absolute -inset-4 bg-gradient-to-r from-indigo-500/10 to-amber-500/10 rounded-full blur-2xl"></div>
          </div>
        </div>
        <h1 className="text-5xl md:text-7xl font-bold text-gray-900 mb-6 max-w-5xl mx-auto leading-tight">
          Let us do the <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-amber-600">thinking</span> for you
        </h1>
        <p className="text-xl md:text-2xl text-gray-600 max-w-3xl mx-auto mb-12 leading-relaxed">
          Seamlessly manage your ingredients and recipes with automatic cost calculation, 
          unit conversion, and intelligent pricing.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <a
            href="/register"
            className="bg-indigo-600 text-white text-lg px-10 py-4 rounded-xl font-semibold hover:bg-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
          >
            Get Started Free
          </a>
          <a
            href="/login"
            className="border-2 border-gray-300 text-gray-700 text-lg px-10 py-4 rounded-xl font-semibold hover:border-gray-400 hover:bg-gray-50 transition-all duration-200"
          >
            Sign In
          </a>
        </div>
      </div>

      {/* Feature Cards */}
      <div className="max-w-7xl mx-auto px-4 py-24">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">Everything you need to manage your kitchen</h2>
          <p className="text-xl text-gray-600">Powerful tools designed for chefs, bakers, and food businesses</p>
        </div>
        
        <div className="grid gap-8 md:grid-cols-3">
          <div className="bg-white rounded-2xl border border-gray-200 p-8 hover:border-indigo-300 hover:shadow-lg transition-all duration-300">
            <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-2xl flex items-center justify-center mb-6">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <h3 className="text-2xl font-semibold text-gray-900 mb-3">Ingredients</h3>
            <p className="text-gray-600 leading-relaxed">
              Track your ingredient purchases with precise cost data. Input bulk purchases and let Plato 
              calculate per-unit costs automatically.
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 p-8 hover:border-amber-300 hover:shadow-lg transition-all duration-300">
            <div className="w-16 h-16 bg-gradient-to-br from-amber-500 to-amber-600 rounded-2xl flex items-center justify-center mb-6">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-2xl font-semibold text-gray-900 mb-3">Recipes</h3>
            <p className="text-gray-600 leading-relaxed">
              Build recipes with automatic cost calculation. Convert between any units seamlessly - 
              from cups to grams, teaspoons to milliliters.
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 p-8 hover:border-indigo-300 hover:shadow-lg transition-all duration-300">
            <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center mb-6">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
            <h3 className="text-2xl font-semibold text-gray-900 mb-3">Cost Analytics</h3>
            <p className="text-gray-600 leading-relaxed">
              Get insights into your costs, margins, and ingredient usage. Make data-driven decisions 
              to optimize your kitchen operations.
            </p>
          </div>
        </div>
      </div>

      {/* Features List */}
      <div className="bg-gradient-to-b from-gray-50 to-white py-24">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-20">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Why Choose Plato?</h2>
            <p className="text-xl text-gray-600">Built for professionals who demand precision and efficiency</p>
          </div>
          <div className="grid gap-16 md:grid-cols-3">
            <div className="text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-2xl font-semibold text-gray-900 mb-3">Lightning Fast</h3>
              <p className="text-gray-600 text-lg leading-relaxed">Instant unit conversions and cost calculations that save you time and reduce errors</p>
            </div>
            <div className="text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-2xl font-semibold text-gray-900 mb-3">Accurate</h3>
              <p className="text-gray-600 text-lg leading-relaxed">Precise calculations with industry-standard units and density-based conversions</p>
            </div>
            <div className="text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-amber-500 to-amber-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-2xl font-semibold text-gray-900 mb-3">Simple</h3>
              <p className="text-gray-600 text-lg leading-relaxed">Intuitive interface that just works - no training required</p>
            </div>
          </div>
        </div>
      </div>

      {/* Call to Action */}
      <div className="py-24 px-4">
        <div className="max-w-5xl mx-auto text-center">
          <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-3xl p-16 text-white relative overflow-hidden shadow-2xl">
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDE0YzMuMzEgMCA2IDIuNjkgNiA2cy0yLjY5IDYtNiA2LTYtMi42OS02LTYgMi42OS02IDYtNk0xMiA0MGMzLjMxIDAgNiAyLjY5IDYgNnMtMi42OSA2LTYgNi02LTIuNjktNi02IDIuNjktNiA2LTYiLz48L2c+PC9nPjwvc3ZnPg==')] opacity-40"></div>
            <div className="relative z-10">
              <h2 className="text-5xl font-bold mb-6">Ready to streamline your kitchen?</h2>
              <p className="text-2xl mb-12 opacity-95 max-w-2xl mx-auto">
                Join thousands of chefs and home cooks who trust Plato for their ingredient and recipe management.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <a
                  href="/register"
                  className="bg-white text-indigo-600 px-10 py-4 rounded-xl font-semibold text-lg hover:bg-gray-100 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                >
                  Start Free Trial
                </a>
                <a
                  href="/login"
                  className="border-2 border-white text-white px-10 py-4 rounded-xl font-semibold text-lg hover:bg-white/10 transition-all duration-200"
                >
                  Sign In
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-gray-50 py-12">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center">
            <div className="flex justify-center items-center gap-3 mb-4">
              <img src="/images/plato-logo.svg" alt="Plato" className="h-8 w-auto" />
              <span className="text-xl font-bold text-gray-900">Plato</span>
            </div>
            <p className="text-gray-600 mb-6">Let us do the thinking for you</p>
            <div className="flex justify-center gap-8 text-sm text-gray-600">
              <a href="/pricing" className="hover:text-gray-900 transition-colors">Pricing</a>
              <a href="/login" className="hover:text-gray-900 transition-colors">Login</a>
              <a href="/register" className="hover:text-gray-900 transition-colors">Sign Up</a>
            </div>
            <p className="text-sm text-gray-500 mt-8">© 2025 Plato. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
