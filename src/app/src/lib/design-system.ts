// Design system utilities
// Re-export useToast and ToastProvider from ToastProvider for convenience
export { useToast, ToastProvider } from "@/components/ToastProvider";

export function AppHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-6">
      <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
      {subtitle && <p className="text-gray-600 mt-1">{subtitle}</p>}
    </div>
  );
}

/* =============================================================================
   LIQUID GLASS DESIGN TOKENS
   Apple 2025 Liquid Glass Design Language
   ============================================================================= */

/**
 * Glass Opacity Scales
 * Controls the translucency of glass surfaces
 */
export const GLASS_OPACITY = {
  light: 0.4,      // Subtle translucency for backgrounds
  medium: 0.6,     // Standard glass surfaces
  heavy: 0.85,     // More opaque glass for overlays
  solid: 0.95,     // Nearly opaque with slight translucency
} as const;

/**
 * Blur Intensity Scales
 * Controls backdrop-filter blur intensity
 */
export const GLASS_BLUR = {
  subtle: '10px',    // Light blur for performance (mobile)
  light: '20px',     // Standard blur
  medium: '30px',    // Enhanced blur for depth
  heavy: '40px',     // Maximum blur for dramatic effect
} as const;

/**
 * Reflection Angles and Intensities
 * Controls the angle and strength of glass reflections
 */
export const GLASS_REFLECTION = {
  angle: '135deg',                    // Gradient angle for reflections
  intensity: {
    subtle: 'rgba(255, 255, 255, 0.3)',  // Light reflection
    medium: 'rgba(255, 255, 255, 0.5)',  // Standard reflection
    strong: 'rgba(255, 255, 255, 0.7)',  // Strong reflection
  },
  greenTint: {
    light: 'rgba(16, 185, 129, 0.05)',   // Subtle green tint
    medium: 'rgba(16, 185, 129, 0.1)',  // Standard green tint
    strong: 'rgba(16, 185, 129, 0.15)',  // Strong green tint
  },
} as const;

/**
 * Animation Timing Curves
 * Apple-style spring animations and smooth transitions
 */
export const ANIMATION_CURVES = {
  spring: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',    // Spring animation
  smooth: 'cubic-bezier(0.4, 0, 0.2, 1)',          // Smooth transition
  bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)', // Bounce effect
  easeOut: 'cubic-bezier(0.16, 1, 0.3, 1)',        // Ease out
} as const;

/**
 * Animation Durations
 * Standard timing for transitions
 */
export const ANIMATION_DURATION = {
  instant: '75ms',   // Instant feedback
  fast: '150ms',     // Quick transitions
  normal: '300ms',   // Standard transitions
  slow: '500ms',     // Deliberate animations
} as const;

/**
 * Spacing Scales for Glass Elements
 * Optimized spacing for glass UI components
 */
export const GLASS_SPACING = {
  compact: {
    padding: '0.5rem',      // 8px - Compact elements
    gap: '0.375rem',        // 6px - Tight spacing
  },
  comfortable: {
    padding: '0.75rem',     // 12px - Standard elements
    gap: '0.5rem',          // 8px - Standard spacing
  },
  spacious: {
    padding: '1rem',        // 16px - Spacious elements
    gap: '0.75rem',         // 12px - Generous spacing
  },
} as const;

/**
 * Depth Layers
 * Z-index based opacity for layered glass effects
 */
export const DEPTH_LAYERS = {
  base: {
    zIndex: 0,
    opacity: GLASS_OPACITY.medium,
  },
  elevated: {
    zIndex: 10,
    opacity: GLASS_OPACITY.heavy,
  },
  floating: {
    zIndex: 20,
    opacity: GLASS_OPACITY.solid,
  },
} as const;

/**
 * Green Theme Glass Variants
 * Pre-configured glass styles with green tinting
 */
export const GREEN_GLASS_VARIANTS = {
  light: {
    background: 'rgba(255, 255, 255, 0.5)',
    tint: GLASS_REFLECTION.greenTint.light,
    blur: GLASS_BLUR.light,
  },
  medium: {
    background: 'rgba(255, 255, 255, 0.6)',
    tint: GLASS_REFLECTION.greenTint.medium,
    blur: GLASS_BLUR.medium,
  },
  heavy: {
    background: 'rgba(255, 255, 255, 0.75)',
    tint: GLASS_REFLECTION.greenTint.strong,
    blur: GLASS_BLUR.heavy,
  },
} as const;