# Responsive Design System

This document outlines the comprehensive responsive design system implemented across the Plato application. The system provides fluid, mobile-first layouts that work seamlessly across iPhone, iPad, and desktop viewports.

## 🎯 Goals

- **Fluid Responsiveness**: Replace brittle fixed pixel sizing with relative units
- **Consistent Breakpoints**: Standardized media queries across all components
- **Flexible Layouts**: Convert rigid blocks to flexible grid/flex patterns
- **No Visual Regressions**: Maintain existing visual style and component order

## 📐 Design Tokens

### Container System
```css
/* Fluid responsive container */
.app-container {
  width: 100%;
  max-width: var(--container-max);
  margin: 0 auto;
  padding-left: var(--gutter);
  padding-right: var(--gutter);
}
```

### Spacing Scale (rem-based)
```css
:root {
  --gutter: 1rem;         /* 16px - base gutter */
  --gutter-sm: 0.5rem;    /* 8px - small gutter */
  --gutter-md: 0.75rem;   /* 12px - medium gutter */
  --gutter-lg: 1.5rem;    /* 24px - large gutter */
  --gutter-xl: 2rem;      /* 32px - extra large gutter */
}
```

### Typography Scale
```css
:root {
  --text-xs: 0.75rem;     /* 12px */
  --text-sm: 0.875rem;    /* 14px */
  --text-base: 1rem;      /* 16px */
  --text-lg: 1.125rem;    /* 18px */
  --text-xl: 1.25rem;     /* 20px */
  --text-2xl: 1.5rem;     /* 24px */
  --text-3xl: 1.875rem;   /* 30px */
  --text-4xl: 2.25rem;    /* 36px */
  --text-5xl: 3rem;       /* 48px */
  --text-6xl: 3.75rem;    /* 60px */
}
```

### Breakpoints
```css
:root {
  --breakpoint-sm: 640px;   /* phones */
  --breakpoint-md: 768px;   /* tablets / iPad */
  --breakpoint-lg: 1024px;  /* small desktop */
  --breakpoint-xl: 1280px;  /* desktop */
  --breakpoint-2xl: 1536px; /* large */
}
```

## 🏗️ Layout Patterns

### 1. App Container
Use `.app-container` for main content areas:

```jsx
<div className="app-container">
  {/* Your content */}
</div>
```

**Benefits:**
- Fluid width with max-width constraints
- Responsive padding that scales with viewport
- Consistent margins across all pages

### 2. Responsive Grids

#### Two-Column Grid
```jsx
<div className="responsive-grid-2">
  <div>Column 1</div>
  <div>Column 2</div>
</div>
```

#### Three-Column Grid
```jsx
<div className="responsive-grid-3">
  <div>Column 1</div>
  <div>Column 2</div>
  <div>Column 3</div>
</div>
```

#### Four-Column Grid
```jsx
<div className="responsive-grid-4">
  <div>Column 1</div>
  <div>Column 2</div>
  <div>Column 3</div>
  <div>Column 4</div>
</div>
```

**Breakpoint Behavior:**
- Mobile: Single column
- Tablet: 2-3 columns
- Desktop: Full column count

### 3. Responsive Flexbox

#### Basic Flex
```jsx
<div className="responsive-flex">
  <div>Item 1</div>
  <div>Item 2</div>
  <div>Item 3</div>
</div>
```

#### Space Between
```jsx
<div className="responsive-flex-between">
  <div>Left Content</div>
  <div>Right Content</div>
</div>
```

**Features:**
- Automatic wrapping on small screens
- Responsive gap spacing
- Flexible alignment

### 4. Responsive Cards
```jsx
<div className="responsive-card">
  <h3>Card Title</h3>
  <p>Card content goes here...</p>
</div>
```

**Features:**
- Responsive padding and border radius
- Consistent shadows and hover effects
- Full width on mobile, constrained on desktop

## 🎨 Component Patterns

### Responsive Typography
```jsx
<h1 className="responsive-text-h1">Fluid Heading</h1>
<h2 className="responsive-text-h2">Responsive Subheading</h2>
<h3 className="responsive-text-h3">Section Title</h3>
<p className="responsive-text-body">Body text that scales</p>
```

**Features:**
- Uses `clamp()` for fluid scaling
- Maintains readability across all devices
- Consistent line heights

### Responsive Buttons
```jsx
<button className="responsive-btn responsive-btn-primary">
  Primary Action
</button>

<button className="responsive-btn responsive-btn-secondary">
  Secondary Action
</button>
```

**Features:**
- Touch-friendly sizing on mobile
- Responsive padding and font sizes
- Consistent hover states

### Responsive Form Inputs
```jsx
<input 
  type="text" 
  className="responsive-input"
  placeholder="Enter text..."
/>
```

**Features:**
- Prevents zoom on iOS (16px minimum)
- Responsive padding and sizing
- Consistent focus states

### Scrollable Panes
```jsx
<div className="scroll-pane">
  {/* Long content that scrolls */}
</div>
```

**Features:**
- Viewport-aware height calculation
- Smooth scrolling on touch devices
- Proper overscroll behavior

## 📱 Viewport-Specific Optimizations

### iPhone (375×812)
- Single column layouts
- Touch-friendly button sizes (48px minimum)
- Optimized typography scaling
- Safe area support

### iPad (820×1180)
- Two-column layouts where appropriate
- Constrained scrollable panes
- Balanced spacing and typography
- Touch-optimized interactions

### Desktop (1440×900+)
- Multi-column layouts
- Centered content with breathable gutters
- Hover states and interactions
- Optimal reading line lengths

## 🔧 Migration Guide

### Before (Fixed Sizing)
```jsx
<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
  <div className="grid grid-cols-3 gap-6">
    <div className="w-64 h-48">Fixed Card</div>
  </div>
</div>
```

### After (Responsive)
```jsx
<div className="app-container">
  <div className="responsive-grid-3">
    <div className="responsive-card">Fluid Card</div>
  </div>
</div>
```

### Common Replacements

| Old Pattern | New Pattern | Benefit |
|-------------|-------------|---------|
| `max-w-7xl mx-auto px-4 sm:px-6 lg:px-8` | `app-container` | Consistent, fluid container |
| `grid grid-cols-3 gap-6` | `responsive-grid-3` | Automatic responsive behavior |
| `w-64 h-48` | `responsive-card` | Fluid sizing with constraints |
| `text-2xl` | `responsive-text-h2` | Fluid typography scaling |
| `px-4 py-2` | CSS variables | Consistent spacing system |

## 🛠️ Development Tools

### Audit Script
Run the responsive audit to find non-responsive patterns:

```bash
npm run audit:responsive
```

**What it finds:**
- Fixed pixel widths/heights
- Tailwind arbitrary values
- Non-responsive containers
- Absolute positioning for layout

### Linting Rules
The system includes ESLint rules to prevent:
- Fixed pixel sizing in layout properties
- Non-responsive container classes
- Absolute positioning for layout

## 📋 Best Practices

### ✅ Do
- Use `.app-container` for main content areas
- Use responsive grid classes for layouts
- Use CSS variables for spacing
- Test on multiple viewport sizes
- Use fluid typography with `clamp()`

### ❌ Don't
- Use fixed pixel widths for containers
- Use absolute positioning for layout
- Hardcode breakpoint values
- Ignore touch target sizes
- Skip mobile-first approach

## 🧪 Testing Checklist

### iPhone (375×812)
- [ ] No horizontal scroll
- [ ] Main pages readable
- [ ] Toolbars wrap cleanly
- [ ] Touch targets ≥ 44px

### iPad (820×1180)
- [ ] Two-column content where applicable
- [ ] Inner panes scroll properly
- [ ] No horizontal overflow
- [ ] Balanced spacing

### Desktop (1440×900)
- [ ] Content centered with gutters
- [ ] No excessive whitespace
- [ ] Hover states work
- [ ] Optimal reading experience

## 🎯 Performance Considerations

- CSS variables reduce bundle size
- Responsive classes minimize media queries
- Fluid layouts reduce layout shifts
- Touch optimizations improve mobile performance

## 🔄 Future Enhancements

- Container queries support
- Advanced grid patterns
- Animation system integration
- Dark mode optimizations
- Print stylesheet updates

---

This responsive design system ensures Plato provides an excellent user experience across all devices while maintaining development efficiency and code consistency.
