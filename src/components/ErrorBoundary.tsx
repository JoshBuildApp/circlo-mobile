import React, { Component, ReactNode, lazy, Suspense } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { AlertCircle, Home, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

const NotFoundPage = lazy(() => import('@/components/ui/page-not-found'));

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

interface ErrorBoundaryProps {
  children: ReactNode;
  routeName?: string;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
    this.logErrorToSupabase(error, errorInfo);
  }

  private async logErrorToSupabase(error: Error, errorInfo: React.ErrorInfo) {
    try {
      await supabase
        .from('agent_activity')
        .insert({
          type: 'error_boundary',
          summary: `Error in ${this.props.routeName || 'unknown'}: ${error.message}`,
          details: {
            route: this.props.routeName,
            error_message: error.message,
            error_stack: error.stack,
            component_stack: errorInfo.componentStack,
            timestamp: new Date().toISOString()
          }
        });
    } catch (logError) {
      console.error('Failed to log error to Supabase:', logError);
    }
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: undefined });
  };

  private handleGoHome = () => {
    window.location.href = '/home';
  };

  render() {
    if (this.state.hasError) {
      return (
        <Suspense
          fallback={
            <div className="min-h-screen bg-background flex items-center justify-center p-4">
              <Card className="max-w-md w-full shadow-xl border-0">
                <CardContent className="p-8 text-center space-y-6">
                  <div className="flex justify-center mb-6">
                    <span className="text-2xl font-bold text-foreground">Circlo</span>
                  </div>
                  <div className="flex justify-center">
                    <div className="w-24 h-24 bg-destructive/10 rounded-full flex items-center justify-center">
                      <AlertCircle className="w-12 h-12 text-destructive" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <h2 className="text-xl font-semibold text-foreground">Something went wrong</h2>
                    <p className="text-muted-foreground text-sm">Loading error page...</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          }
        >
          <NotFoundPage
            title="Something Went Wrong"
            description={
              import.meta.env.DEV && this.state.error
                ? this.state.error.message
                : "We're experiencing a technical hiccup. Don't worry — our team has been notified."
            }
            onGoBack={this.handleRetry}
            onGoHome={this.handleGoHome}
          />
        </Suspense>
      );
    }

    return this.props.children;
  }
}
