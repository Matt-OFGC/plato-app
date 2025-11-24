'use client';

import Image from 'next/image';
import { useState, useRef } from 'react';
import { cn } from '@/lib/utils';

interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  priority?: boolean;
  quality?: number;
  placeholder?: 'blur' | 'empty';
  blurDataURL?: string;
  sizes?: string;
  fill?: boolean;
  style?: React.CSSProperties;
  onClick?: () => void;
  onLoad?: () => void;
  onError?: () => void;
}

export function OptimizedImage({
  src,
  alt,
  width = 400,
  height = 300,
  className,
  priority = false,
  quality = 85,
  placeholder = 'empty',
  blurDataURL,
  sizes,
  fill = false,
  style,
  onClick,
  onLoad,
  onError,
}: OptimizedImageProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [useFallback, setUseFallback] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  
  // Only use blur if blurDataURL is provided, otherwise use empty placeholder
  const effectivePlaceholder = blurDataURL ? 'blur' : 'empty';

  const handleLoad = () => {
    setIsLoading(false);
    onLoad?.();
  };

  const handleError = () => {
    setHasError(true);
    setIsLoading(false);
    onError?.();
    // If Next.js Image fails and it's an external URL, try fallback
    if ((src.startsWith('http://') || src.startsWith('https://')) && !useFallback) {
      setUseFallback(true);
      setHasError(false); // Reset error to allow fallback to render
      setIsLoading(true); // Reset loading state
    }
  };

  const handleFallbackError = () => {
    setHasError(true);
    setIsLoading(false);
  };

  // Fallback for broken images - try regular img tag for external URLs
  if (useFallback && !hasError) {
    return (
      <div
        className={cn('relative overflow-hidden', className)}
        style={style}
        onClick={onClick}
      >
        <img
          src={src}
          alt={alt}
          width={fill ? undefined : width}
          height={fill ? undefined : height}
          className={cn(
            'transition-opacity duration-300',
            isLoading ? 'opacity-0' : 'opacity-100',
            onClick && 'cursor-pointer hover:opacity-90',
            fill ? 'w-full h-full object-cover' : ''
          )}
          style={fill ? { objectFit: 'cover' } : { width, height, ...style }}
          onLoad={handleLoad}
          onError={handleFallbackError}
        />
        {isLoading && (
          <div className="absolute inset-0 bg-gray-200 animate-pulse flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
          </div>
        )}
      </div>
    );
  }

  // Show placeholder if both Next Image and fallback failed
  if (hasError && useFallback) {
    return (
      <div
        className={cn(
          'bg-gray-200 flex items-center justify-center text-gray-400',
          className
        )}
        style={{ width: fill ? '100%' : width, height: fill ? '100%' : height, ...style }}
        onClick={onClick}
      >
        <div className="text-center">
          <svg
            className="w-8 h-8 mx-auto mb-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          <p className="text-xs">Image unavailable</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn('relative overflow-hidden', className)}
      style={style}
      onClick={onClick}
    >
      <Image
        ref={imgRef}
        src={src}
        alt={alt}
        width={fill ? undefined : width}
        height={fill ? undefined : height}
        fill={fill}
        priority={priority}
        quality={quality}
        placeholder={effectivePlaceholder}
        blurDataURL={blurDataURL}
        sizes={sizes || '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw'}
        className={cn(
          'transition-opacity duration-300',
          isLoading ? 'opacity-0' : 'opacity-100',
          onClick && 'cursor-pointer hover:opacity-90'
        )}
        onLoad={handleLoad}
        onError={handleError}
      />
      
      {isLoading && (
        <div className="absolute inset-0 bg-gray-200 animate-pulse flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
        </div>
      )}
    </div>
  );
}

// Specialized components for common use cases
export function RecipeImage({
  src,
  alt,
  className,
  onClick,
}: {
  src?: string;
  alt: string;
  className?: string;
  onClick?: () => void;
}) {
  return (
    <OptimizedImage
      src={src || '/api/placeholder-image?name=recipe&size=400'}
      alt={alt}
      width={200}
      height={150}
      className={cn('rounded-lg object-cover', className)}
      onClick={onClick}
      sizes="(max-width: 768px) 100vw, 200px"
    />
  );
}

export function IngredientImage({
  src,
  alt,
  className,
}: {
  src?: string;
  alt: string;
  className?: string;
}) {
  return (
    <OptimizedImage
      src={src || '/api/placeholder-image?name=ingredient&size=100'}
      alt={alt}
      width={64}
      height={64}
      className={cn('rounded-lg object-cover', className)}
      sizes="64px"
    />
  );
}

export function CompanyLogo({
  src,
  alt,
  className,
}: {
  src?: string;
  alt: string;
  className?: string;
}) {
  return (
    <OptimizedImage
      src={src || '/api/placeholder-image?name=logo&size=200'}
      alt={alt}
      width={120}
      height={60}
      className={cn('object-contain', className)}
      sizes="120px"
    />
  );
}

// Avatar component
export function UserAvatar({
  src,
  alt,
  size = 40,
  className,
}: {
  src?: string;
  alt: string;
  size?: number;
  className?: string;
}) {
  return (
    <OptimizedImage
      src={src || '/api/placeholder-image?name=avatar&size=100'}
      alt={alt}
      width={size}
      height={size}
      className={cn('rounded-full object-cover', className)}
      sizes={`${size}px`}
    />
  );
}
