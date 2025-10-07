export default function Home() {
  return (
    <div className="min-h-[80vh] flex flex-col">
      {/* Hero Section */}
      <div className="text-center py-16">
        <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-6">
          Plato
        </h1>
        <p className="text-xl text-gray-600 mb-4 max-w-2xl mx-auto">
          Let us do the thinking for you
        </p>
        <p className="text-lg text-gray-500 max-w-3xl mx-auto mb-12">
          Seamlessly manage your ingredients and recipes with automatic cost calculation, 
          unit conversion, and intelligent pricing. From grams to cups, from pounds to teaspoons - 
          we handle it all effortlessly.
        </p>
      </div>

      {/* Feature Cards */}
      <div className="grid gap-8 md:grid-cols-2 max-w-4xl mx-auto">
        <a href="/ingredients" className="group block">
          <div className="bg-white rounded-2xl border border-gray-200 p-8 hover:border-blue-300 hover:shadow-lg transition-all duration-300">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-6 group-hover:bg-blue-200 transition-colors">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <h3 className="text-2xl font-semibold text-gray-900 mb-3">Ingredients</h3>
            <p className="text-gray-600 mb-4">
              Track your ingredient purchases with precise cost data. Input bulk purchases and let Plato 
              calculate per-unit costs automatically.
            </p>
            <div className="flex items-center text-blue-600 font-medium group-hover:text-blue-700">
              Manage Ingredients
              <svg className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </div>
        </a>

        <a href="/recipes" className="group block">
          <div className="bg-white rounded-2xl border border-gray-200 p-8 hover:border-purple-300 hover:shadow-lg transition-all duration-300">
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mb-6 group-hover:bg-purple-200 transition-colors">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-2xl font-semibold text-gray-900 mb-3">Recipes</h3>
            <p className="text-gray-600 mb-4">
              Build recipes with automatic cost calculation. Convert between any units seamlessly - 
              from cups to grams, teaspoons to milliliters.
            </p>
            <div className="flex items-center text-purple-600 font-medium group-hover:text-purple-700">
              Create Recipes
              <svg className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </div>
        </a>
      </div>

      {/* Features List */}
      <div className="mt-20 max-w-4xl mx-auto">
        <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">Why Choose Plato?</h2>
        <div className="grid gap-8 md:grid-cols-3">
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Lightning Fast</h3>
            <p className="text-gray-600">Instant unit conversions and cost calculations</p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Accurate</h3>
            <p className="text-gray-600">Precise calculations with industry-standard units</p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 bg-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Simple</h3>
            <p className="text-gray-600">Intuitive interface that just works</p>
          </div>
        </div>
      </div>

      {/* Call to Action */}
      <div className="mt-20 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-12 text-center text-white">
        <h2 className="text-3xl font-bold mb-4">Ready to streamline your kitchen?</h2>
        <p className="text-xl mb-8 opacity-90">
          Join thousands of chefs and home cooks who trust Plato for their ingredient and recipe management.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <a 
            href="/register" 
            className="bg-white text-blue-600 px-8 py-3 rounded-xl font-medium hover:bg-gray-100 transition-colors"
          >
            Start Free Trial
          </a>
          <a 
            href="/pricing" 
            className="border-2 border-white text-white px-8 py-3 rounded-xl font-medium hover:bg-white hover:text-blue-600 transition-colors"
          >
            View Pricing
          </a>
        </div>
      </div>
    </div>
  );
}
