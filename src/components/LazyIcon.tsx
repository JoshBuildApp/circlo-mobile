import { lazy, Suspense, ComponentType } from "react";
import { LucideProps } from "lucide-react";

interface LazyIconProps extends Omit<LucideProps, 'ref'> {
  iconLoader: () => Promise<{ default: ComponentType<LucideProps> }>;
  fallback?: ComponentType<Omit<LucideProps, 'ref'>>;
}

const DefaultFallback = ({ className }: { className?: string }) => (
  <div className={`w-4 h-4 bg-muted rounded animate-pulse ${className || ''}`} />
);

export const LazyIcon = ({ iconLoader, fallback: Fallback = DefaultFallback, ...props }: LazyIconProps) => {
  const IconComponent = lazy(iconLoader);
  
  return (
    <Suspense fallback={<Fallback className={props.className} />}>
      <IconComponent {...props} />
    </Suspense>
  );
};
