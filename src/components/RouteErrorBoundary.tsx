import React from 'react';
import { ErrorBoundary } from './ErrorBoundary';

interface RouteErrorBoundaryProps {
  children: React.ReactNode;
  routeName: string;
}

export const RouteErrorBoundary: React.FC<RouteErrorBoundaryProps> = ({ 
  children, 
  routeName 
}) => {
  return (
    <ErrorBoundary routeName={routeName}>
      {children}
    </ErrorBoundary>
  );
};