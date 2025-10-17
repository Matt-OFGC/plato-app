"use client";

/**
 * Responsive Design Examples Component
 * 
 * This component showcases all the responsive design patterns available in the Plato app.
 * Use this as a reference when building new components.
 */

export function ResponsiveExamples() {
  return (
    <div className="app-container py-8 space-y-12">
      <div className="text-center">
        <h1 className="responsive-text-h1 mb-4">Responsive Design Examples</h1>
        <p className="responsive-text-body text-gray-600 max-w-2xl mx-auto">
          This component demonstrates all the responsive design patterns available in the Plato app.
          Use these patterns to build consistent, mobile-first components.
        </p>
      </div>

      {/* Responsive Typography Examples */}
      <section className="space-y-6">
        <h2 className="responsive-text-h2">Typography Scale</h2>
        <div className="responsive-card">
          <h1 className="responsive-text-h1 mb-4">Main Heading (H1)</h1>
          <h2 className="responsive-text-h2 mb-4">Section Heading (H2)</h2>
          <h3 className="responsive-text-h3 mb-4">Subsection Heading (H3)</h3>
          <p className="responsive-text-body">
            Body text that scales fluidly across all devices. This text uses the responsive-text-body class
            which automatically adjusts font size and line height based on viewport size.
          </p>
        </div>
      </section>

      {/* Responsive Grid Examples */}
      <section className="space-y-6">
        <h2 className="responsive-text-h2">Grid Layouts</h2>
        
        {/* Two Column Grid */}
        <div>
          <h3 className="responsive-text-h3 mb-4">Two Column Grid</h3>
          <div className="responsive-grid-2">
            <div className="responsive-card">
              <h4 className="font-semibold mb-2">Column 1</h4>
              <p>This card automatically stacks on mobile and displays side-by-side on tablets and desktop.</p>
            </div>
            <div className="responsive-card">
              <h4 className="font-semibold mb-2">Column 2</h4>
              <p>The gap between columns adjusts responsively using CSS variables.</p>
            </div>
          </div>
        </div>

        {/* Three Column Grid */}
        <div>
          <h3 className="responsive-text-h3 mb-4">Three Column Grid</h3>
          <div className="responsive-grid-3">
            <div className="responsive-card">
              <h4 className="font-semibold mb-2">Card 1</h4>
              <p>Single column on mobile, two columns on tablets, three columns on desktop.</p>
            </div>
            <div className="responsive-card">
              <h4 className="font-semibold mb-2">Card 2</h4>
              <p>Perfect for displaying lists of items or features.</p>
            </div>
            <div className="responsive-card">
              <h4 className="font-semibold mb-2">Card 3</h4>
              <p>Consistent spacing and responsive behavior.</p>
            </div>
          </div>
        </div>

        {/* Four Column Grid */}
        <div>
          <h3 className="responsive-text-h3 mb-4">Four Column Grid</h3>
          <div className="responsive-grid-4">
            <div className="responsive-card text-center">
              <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-emerald-600 font-bold">1</span>
              </div>
              <h4 className="font-semibold mb-2">Step 1</h4>
              <p className="text-sm">Mobile: 1 column</p>
            </div>
            <div className="responsive-card text-center">
              <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-emerald-600 font-bold">2</span>
              </div>
              <h4 className="font-semibold mb-2">Step 2</h4>
              <p className="text-sm">Tablet: 2 columns</p>
            </div>
            <div className="responsive-card text-center">
              <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-emerald-600 font-bold">3</span>
              </div>
              <h4 className="font-semibold mb-2">Step 3</h4>
              <p className="text-sm">Desktop: 3 columns</p>
            </div>
            <div className="responsive-card text-center">
              <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-emerald-600 font-bold">4</span>
              </div>
              <h4 className="font-semibold mb-2">Step 4</h4>
              <p className="text-sm">Large: 4 columns</p>
            </div>
          </div>
        </div>
      </section>

      {/* Responsive Flex Examples */}
      <section className="space-y-6">
        <h2 className="responsive-text-h2">Flexbox Layouts</h2>
        
        {/* Basic Flex */}
        <div>
          <h3 className="responsive-text-h3 mb-4">Basic Flex (Wrapping)</h3>
          <div className="responsive-flex">
            <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-sm">Tag 1</span>
            <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-sm">Tag 2</span>
            <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-sm">Tag 3</span>
            <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-sm">Tag 4</span>
            <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-sm">Tag 5</span>
            <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-sm">Tag 6</span>
          </div>
        </div>

        {/* Space Between */}
        <div>
          <h3 className="responsive-text-h3 mb-4">Space Between</h3>
          <div className="responsive-card">
            <div className="responsive-flex-between">
              <div>
                <h4 className="font-semibold">Left Content</h4>
                <p className="text-sm text-gray-600">This stays on the left</p>
              </div>
              <div>
                <button className="responsive-btn responsive-btn-primary">Action</button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Responsive Button Examples */}
      <section className="space-y-6">
        <h2 className="responsive-text-h2">Button Styles</h2>
        <div className="responsive-flex">
          <button className="responsive-btn responsive-btn-primary">Primary</button>
          <button className="responsive-btn responsive-btn-secondary">Secondary</button>
        </div>
        <p className="text-sm text-gray-600">
          Buttons automatically adjust their size and padding based on viewport. 
          Touch targets are optimized for mobile devices.
        </p>
      </section>

      {/* Responsive Form Examples */}
      <section className="space-y-6">
        <h2 className="responsive-text-h2">Form Elements</h2>
        <div className="responsive-card">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <input 
                type="email" 
                className="responsive-input"
                placeholder="Enter your email"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Message
              </label>
              <textarea 
                className="responsive-input min-h-[120px] resize-none"
                placeholder="Enter your message"
              />
            </div>
          </div>
        </div>
        <p className="text-sm text-gray-600">
          Form inputs use responsive sizing and prevent zoom on iOS devices.
        </p>
      </section>

      {/* Scrollable Pane Example */}
      <section className="space-y-6">
        <h2 className="responsive-text-h2">Scrollable Panes</h2>
        <div className="responsive-card">
          <h3 className="font-semibold mb-4">Long Content List</h3>
          <div className="scroll-pane border border-gray-200 rounded-lg p-4">
            <div className="space-y-3">
              {Array.from({ length: 20 }, (_, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                  <span>Item {i + 1}</span>
                  <span className="text-sm text-gray-500">Details</span>
                </div>
              ))}
            </div>
          </div>
        </div>
        <p className="text-sm text-gray-600">
          Scrollable panes automatically calculate their height based on viewport size.
        </p>
      </section>

      {/* Breakpoint Indicators */}
      <section className="space-y-6">
        <h2 className="responsive-text-h2">Current Breakpoint</h2>
        <div className="responsive-card">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div className="p-3 bg-red-50 rounded">
              <div className="text-sm font-medium text-red-700">Mobile</div>
              <div className="text-xs text-red-600">&lt; 640px</div>
            </div>
            <div className="p-3 bg-yellow-50 rounded">
              <div className="text-sm font-medium text-yellow-700">Tablet</div>
              <div className="text-xs text-yellow-600">640px - 1024px</div>
            </div>
            <div className="p-3 bg-green-50 rounded">
              <div className="text-sm font-medium text-green-700">Desktop</div>
              <div className="text-xs text-green-600">1024px - 1280px</div>
            </div>
            <div className="p-3 bg-blue-50 rounded">
              <div className="text-sm font-medium text-blue-700">Large</div>
              <div className="text-xs text-blue-600">&gt; 1280px</div>
            </div>
          </div>
        </div>
      </section>

      {/* Usage Instructions */}
      <section className="space-y-6">
        <h2 className="responsive-text-h2">Usage Instructions</h2>
        <div className="responsive-card">
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">Container</h3>
              <code className="block bg-gray-100 p-2 rounded text-sm">
                &lt;div className="app-container"&gt;Content&lt;/div&gt;
              </code>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Grids</h3>
              <code className="block bg-gray-100 p-2 rounded text-sm">
                &lt;div className="responsive-grid-2"&gt;Two columns&lt;/div&gt;<br/>
                &lt;div className="responsive-grid-3"&gt;Three columns&lt;/div&gt;<br/>
                &lt;div className="responsive-grid-4"&gt;Four columns&lt;/div&gt;
              </code>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Components</h3>
              <code className="block bg-gray-100 p-2 rounded text-sm">
                &lt;div className="responsive-card"&gt;Card&lt;/div&gt;<br/>
                &lt;button className="responsive-btn responsive-btn-primary"&gt;Button&lt;/button&gt;<br/>
                &lt;input className="responsive-input" /&gt;
              </code>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
