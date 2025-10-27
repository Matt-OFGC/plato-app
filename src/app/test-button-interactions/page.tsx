'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { InteractiveButton } from '@/components/ui/InteractiveButton';

export default function ButtonDemoPage() {
  const [loading, setLoading] = useState(false);

  const handleAsyncAction = async () => {
    setLoading(true);
    // Simulate async operation
    await new Promise(resolve => setTimeout(resolve, 2000));
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Enhanced Button Interactions</h1>
        
        {/* Standard Buttons */}
        <section className="mb-12">
          <h2 className="text-xl font-semibold text-gray-800 mb-6">Standard Buttons</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="space-y-4">
              <h3 className="font-medium text-gray-700">Primary</h3>
              <div className="space-y-3">
                <Button variant="primary" size="sm">Small</Button>
                <Button variant="primary" size="md">Medium</Button>
                <Button variant="primary" size="lg">Large</Button>
                <Button variant="primary" loading={loading} onClick={handleAsyncAction}>
                  {loading ? 'Loading...' : 'Async Action'}
                </Button>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-medium text-gray-700">Secondary</h3>
              <div className="space-y-3">
                <Button variant="secondary" size="sm">Small</Button>
                <Button variant="secondary" size="md">Medium</Button>
                <Button variant="secondary" size="lg">Large</Button>
                <Button variant="secondary" disabled>Disabled</Button>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-medium text-gray-700">Outline</h3>
              <div className="space-y-3">
                <Button variant="outline" size="sm">Small</Button>
                <Button variant="outline" size="md">Medium</Button>
                <Button variant="outline" size="lg">Large</Button>
                <Button variant="outline" disabled>Disabled</Button>
              </div>
            </div>
          </div>
        </section>

        {/* Interactive Buttons */}
        <section className="mb-12">
          <h2 className="text-xl font-semibold text-gray-800 mb-6">Interactive Buttons (Enhanced)</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="space-y-4">
              <h3 className="font-medium text-gray-700">Primary Interactive</h3>
              <div className="space-y-3">
                <InteractiveButton variant="primary" size="sm">Small</InteractiveButton>
                <InteractiveButton variant="primary" size="md">Medium</InteractiveButton>
                <InteractiveButton variant="primary" size="lg">Large</InteractiveButton>
                <InteractiveButton 
                  variant="primary" 
                  loading={loading} 
                  onClick={handleAsyncAction}
                  haptic={true}
                  ripple={true}
                >
                  {loading ? 'Loading...' : 'Enhanced Async'}
                </InteractiveButton>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-medium text-gray-700">Secondary Interactive</h3>
              <div className="space-y-3">
                <InteractiveButton variant="secondary" size="sm">Small</InteractiveButton>
                <InteractiveButton variant="secondary" size="md">Medium</InteractiveButton>
                <InteractiveButton variant="secondary" size="lg">Large</InteractiveButton>
                <InteractiveButton variant="secondary" disabled>Disabled</InteractiveButton>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-medium text-gray-700">Outline Interactive</h3>
              <div className="space-y-3">
                <InteractiveButton variant="outline" size="sm">Small</InteractiveButton>
                <InteractiveButton variant="outline" size="md">Medium</InteractiveButton>
                <InteractiveButton variant="outline" size="lg">Large</InteractiveButton>
                <InteractiveButton variant="outline" disabled>Disabled</InteractiveButton>
              </div>
            </div>
          </div>
        </section>

        {/* Special Effects */}
        <section className="mb-12">
          <h2 className="text-xl font-semibold text-gray-800 mb-6">Special Effects</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="font-medium text-gray-700">Ripple Effects</h3>
              <div className="space-y-3">
                <InteractiveButton variant="primary" ripple={true}>Ripple Enabled</InteractiveButton>
                <InteractiveButton variant="primary" ripple={false}>Ripple Disabled</InteractiveButton>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-medium text-gray-700">Haptic Feedback</h3>
              <div className="space-y-3">
                <InteractiveButton variant="primary" haptic={true}>Haptic Enabled</InteractiveButton>
                <InteractiveButton variant="primary" haptic={false}>Haptic Disabled</InteractiveButton>
              </div>
            </div>
          </div>
        </section>

        {/* Destructive Actions */}
        <section className="mb-12">
          <h2 className="text-xl font-semibold text-gray-800 mb-6">Destructive Actions</h2>
          <div className="space-y-3">
            <InteractiveButton variant="destructive" size="sm">Delete Small</InteractiveButton>
            <InteractiveButton variant="destructive" size="md">Delete Medium</InteractiveButton>
            <InteractiveButton variant="destructive" size="lg">Delete Large</InteractiveButton>
          </div>
        </section>

        {/* Instructions */}
        <section className="bg-white rounded-xl p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">How to Experience the Enhancements</h2>
          <div className="space-y-3 text-gray-600">
            <p><strong>🖱️ Click any button</strong> - Notice the instant scale-down effect and ripple animation</p>
            <p><strong>📱 On mobile devices</strong> - Feel the haptic feedback vibration when you tap</p>
            <p><strong>🎯 Hover effects</strong> - Buttons lift slightly and show subtle glow</p>
            <p><strong>⚡ Loading states</strong> - Click "Async Action" buttons to see smooth loading transitions</p>
            <p><strong>🎨 Visual feedback</strong> - Every interaction has immediate visual response</p>
          </div>
        </section>
      </div>
    </div>
  );
}
