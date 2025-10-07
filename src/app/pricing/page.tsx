import Link from "next/link";

export default function PricingPage() {
  const plans = [
    {
      name: "Starter",
      price: "Free",
      period: "forever",
      description: "Perfect for home cooks and small kitchens",
      features: [
        "Up to 50 ingredients",
        "Up to 25 recipes", 
        "Basic unit conversions",
        "Cost calculations",
        "Community support"
      ],
      cta: "Get Started Free",
      ctaLink: "/register",
      popular: false
    },
    {
      name: "Professional",
      price: "£9.99",
      period: "per month",
      description: "Ideal for professional chefs and restaurants",
      features: [
        "Unlimited ingredients",
        "Unlimited recipes",
        "Advanced unit conversions",
        "Real-time cost tracking",
        "Recipe scaling",
        "Export to PDF",
        "Priority support",
        "Team collaboration (up to 5 users)"
      ],
      cta: "Start Free Trial",
      ctaLink: "/register?plan=professional",
      popular: true
    },
    {
      name: "Enterprise",
      price: "£29.99",
      period: "per month",
      description: "For large restaurants and food service companies",
      features: [
        "Everything in Professional",
        "Unlimited team members",
        "Advanced analytics",
        "API access",
        "Custom integrations",
        "Dedicated account manager",
        "24/7 phone support",
        "Custom reporting"
      ],
      cta: "Contact Sales",
      ctaLink: "/contact",
      popular: false
    }
  ];

  return (
    <div className="max-w-7xl mx-auto">
      <div className="text-center mb-16">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Simple, Transparent Pricing</h1>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
          Choose the plan that fits your needs. Start free and upgrade anytime as your business grows.
        </p>
      </div>

      <div className="grid gap-8 md:grid-cols-3 mb-16">
        {plans.map((plan) => (
          <div
            key={plan.name}
            className={`relative bg-white rounded-2xl border-2 p-8 ${
              plan.popular 
                ? 'border-purple-500 shadow-lg' 
                : 'border-gray-200 hover:border-gray-300'
            } transition-all duration-300`}
          >
            {plan.popular && (
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <span className="bg-purple-500 text-white px-4 py-1 rounded-full text-sm font-medium">
                  Most Popular
                </span>
              </div>
            )}
            
            <div className="text-center mb-6">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
              <div className="mb-2">
                <span className="text-4xl font-bold text-gray-900">{plan.price}</span>
                <span className="text-gray-600 ml-1">{plan.period}</span>
              </div>
              <p className="text-gray-600">{plan.description}</p>
            </div>

            <ul className="space-y-3 mb-8">
              {plan.features.map((feature, index) => (
                <li key={index} className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-gray-700">{feature}</span>
                </li>
              ))}
            </ul>

            <Link
              href={plan.ctaLink}
              className={`block w-full text-center py-3 px-6 rounded-xl font-medium transition-colors ${
                plan.popular
                  ? 'bg-purple-600 text-white hover:bg-purple-700'
                  : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
              }`}
            >
              {plan.cta}
            </Link>
          </div>
        ))}
      </div>

      <div className="bg-gray-50 rounded-2xl p-8 text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Frequently Asked Questions</h2>
        <div className="grid gap-6 md:grid-cols-2 max-w-4xl mx-auto">
          <div className="text-left">
            <h3 className="font-semibold text-gray-900 mb-2">Can I change plans anytime?</h3>
            <p className="text-gray-600">Yes! You can upgrade or downgrade your plan at any time. Changes take effect immediately.</p>
          </div>
          <div className="text-left">
            <h3 className="font-semibold text-gray-900 mb-2">What payment methods do you accept?</h3>
            <p className="text-gray-600">We accept all major credit cards, PayPal, and bank transfers for Enterprise plans.</p>
          </div>
          <div className="text-left">
            <h3 className="font-semibold text-gray-900 mb-2">Is there a free trial?</h3>
            <p className="text-gray-600">Yes! Professional and Enterprise plans come with a 14-day free trial. No credit card required.</p>
          </div>
          <div className="text-left">
            <h3 className="font-semibold text-gray-900 mb-2">Can I cancel anytime?</h3>
            <p className="text-gray-600">Absolutely. Cancel anytime with no cancellation fees. Your data remains accessible for 30 days.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
