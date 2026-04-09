import { lazy, Suspense, useEffect, useState, ReactNode } from "react";

interface LazySectionProps {
  children: ReactNode;
  fallback?: ReactNode;
  rootMargin?: string;
  threshold?: number;
}

const DefaultSkeleton = () => (
  <div className="animate-pulse">
    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
    <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
    <div className="h-4 bg-gray-200 rounded w-5/6"></div>
  </div>
);

export const LazySection = ({ 
  children, 
  fallback = <DefaultSkeleton />,
  rootMargin = "100px",
  threshold = 0.1
}: LazySectionProps) => {
  const [isVisible, setIsVisible] = useState(false);
  const [ref, setRef] = useState<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!ref) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin, threshold }
    );

    observer.observe(ref);
    return () => observer.disconnect();
  }, [ref, rootMargin, threshold]);

  return (
    <div ref={setRef}>
      {isVisible ? children : fallback}
    </div>
  );
};

// Higher-order component for lazy loading components
export const withLazyLoading = <P extends object>(
  Component: React.ComponentType<P>,
  fallback?: ReactNode
) => {
  return (props: P) => (
    <LazySection fallback={fallback}>
      <Component {...props} />
    </LazySection>
  );
};