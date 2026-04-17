import { ReactNode } from 'react';
import CircloLogo from '@/components/CircloLogo';
import { Button } from '@/components/ui/button';
import { Search, Menu } from 'lucide-react';

interface PublicLayoutProps {
  children: ReactNode;
}

export function PublicLayout({ children }: PublicLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      {/* Public Header */}
      <header className="bg-card shadow-card sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center">
              <CircloLogo className="h-8 w-auto" />
            </div>

            {/* Navigation - Desktop */}
            <nav className="hidden md:flex items-center space-x-8">
              <a href="/discover" className="text-muted-foreground hover:text-foreground font-medium transition-colors">
                Find Coaches
              </a>
              <a href="/community" className="text-muted-foreground hover:text-foreground font-medium transition-colors">
                Community
              </a>
              <a href="/about" className="text-muted-foreground hover:text-foreground font-medium transition-colors">
                About
              </a>
              <a href="/pricing" className="text-muted-foreground hover:text-foreground font-medium transition-colors">
                Pricing
              </a>
            </nav>

            {/* Actions */}
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="sm" className="hidden md:flex">
                <Search className="w-4 h-4" />
              </Button>
              
              <div className="hidden md:flex items-center space-x-3">
                <Button variant="ghost" onClick={() => window.location.href = '/login'}>
                  Sign In
                </Button>
                <Button onClick={() => window.location.href = '/signup'}>
                  Get Started
                </Button>
              </div>

              {/* Mobile Menu Button */}
              <Button variant="ghost" size="sm" className="md:hidden">
                <Menu className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main>{children}</main>

      {/* Public Footer */}
      <footer className="bg-card border-t border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* Company */}
            <div>
              <CircloLogo className="h-8 w-auto mb-4" />
              <p className="text-muted-foreground text-sm">
                Circlo — The social marketplace for coaches and trainers. Discover, follow, and book.
              </p>
            </div>

            {/* For Clients */}
            <div>
              <h3 className="font-semibold text-foreground mb-4">For Athletes</h3>
              <ul className="space-y-2 text-sm">
                <li><a href="/discover" className="text-muted-foreground hover:text-foreground transition-colors">Find Coaches</a></li>
                <li><a href="/how-it-works" className="text-muted-foreground hover:text-foreground transition-colors">How It Works</a></li>
                <li><a href="/success-stories" className="text-muted-foreground hover:text-foreground transition-colors">Success Stories</a></li>
                <li><a href="/pricing" className="text-muted-foreground hover:text-foreground transition-colors">Pricing</a></li>
              </ul>
            </div>

            {/* For Coaches */}
            <div>
              <h3 className="font-semibold text-foreground mb-4">For Coaches</h3>
              <ul className="space-y-2 text-sm">
                <li><a href="/become-coach" className="text-muted-foreground hover:text-foreground transition-colors">Become a Coach</a></li>
                <li><a href="/coach-resources" className="text-muted-foreground hover:text-foreground transition-colors">Resources</a></li>
                <li><a href="/coach-community" className="text-muted-foreground hover:text-foreground transition-colors">Community</a></li>
                <li><a href="/coach-success" className="text-muted-foreground hover:text-foreground transition-colors">Success Tips</a></li>
              </ul>
            </div>

            {/* Support */}
            <div>
              <h3 className="font-semibold text-foreground mb-4">Support</h3>
              <ul className="space-y-2 text-sm">
                <li><a href="/help" className="text-muted-foreground hover:text-foreground transition-colors">Help Center</a></li>
                <li><a href="/contact" className="text-muted-foreground hover:text-foreground transition-colors">Contact Us</a></li>
                <li><a href="/privacy" className="text-muted-foreground hover:text-foreground transition-colors">Privacy Policy</a></li>
                <li><a href="/terms" className="text-muted-foreground hover:text-foreground transition-colors">Terms of Service</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-border mt-8 pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-muted-foreground text-sm">
              © {new Date().getFullYear()} Circlo. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
