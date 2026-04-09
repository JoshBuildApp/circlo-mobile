import { ReactNode } from 'react';
import CircloLogo from '@/components/CircloLogo';
import { Button } from '@/components/ui/button';
import { Search, Menu } from 'lucide-react';

interface PublicLayoutProps {
  children: ReactNode;
}

export function PublicLayout({ children }: PublicLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Public Header */}
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center">
              <CircloLogo className="h-8 w-auto" />
            </div>

            {/* Navigation - Desktop */}
            <nav className="hidden md:flex items-center space-x-8">
              <a href="/discover" className="text-gray-700 hover:text-gray-900 font-medium">
                Find Coaches
              </a>
              <a href="/community" className="text-gray-700 hover:text-gray-900 font-medium">
                Community
              </a>
              <a href="/about" className="text-gray-700 hover:text-gray-900 font-medium">
                About
              </a>
              <a href="/pricing" className="text-gray-700 hover:text-gray-900 font-medium">
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
      <footer className="bg-white border-t">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* Company */}
            <div>
              <CircloLogo className="h-8 w-auto mb-4" />
              <p className="text-gray-600 text-sm">
                Connecting you with professional coaches to unlock your potential.
              </p>
            </div>

            {/* For Clients */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-4">For Clients</h3>
              <ul className="space-y-2 text-sm">
                <li><a href="/discover" className="text-gray-600 hover:text-gray-900">Find Coaches</a></li>
                <li><a href="/how-it-works" className="text-gray-600 hover:text-gray-900">How It Works</a></li>
                <li><a href="/success-stories" className="text-gray-600 hover:text-gray-900">Success Stories</a></li>
                <li><a href="/pricing" className="text-gray-600 hover:text-gray-900">Pricing</a></li>
              </ul>
            </div>

            {/* For Coaches */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-4">For Coaches</h3>
              <ul className="space-y-2 text-sm">
                <li><a href="/become-coach" className="text-gray-600 hover:text-gray-900">Become a Coach</a></li>
                <li><a href="/coach-resources" className="text-gray-600 hover:text-gray-900">Resources</a></li>
                <li><a href="/coach-community" className="text-gray-600 hover:text-gray-900">Community</a></li>
                <li><a href="/coach-success" className="text-gray-600 hover:text-gray-900">Success Tips</a></li>
              </ul>
            </div>

            {/* Support */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-4">Support</h3>
              <ul className="space-y-2 text-sm">
                <li><a href="/help" className="text-gray-600 hover:text-gray-900">Help Center</a></li>
                <li><a href="/contact" className="text-gray-600 hover:text-gray-900">Contact Us</a></li>
                <li><a href="/privacy" className="text-gray-600 hover:text-gray-900">Privacy Policy</a></li>
                <li><a href="/terms" className="text-gray-600 hover:text-gray-900">Terms of Service</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t mt-8 pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-600 text-sm">
              © 2024 Circlo. All rights reserved.
            </p>
            <div className="flex space-x-6 mt-4 md:mt-0">
              <a href="#" className="text-gray-400 hover:text-gray-600">
                <span className="sr-only">Facebook</span>
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M20 10C20 4.477 15.523 0 10 0S0 4.477 0 10c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V10h2.54V7.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V10h2.773l-.443 2.89h-2.33v6.988C16.343 19.128 20 14.991 20 10z" clipRule="evenodd" />
                </svg>
              </a>
              <a href="#" className="text-gray-400 hover:text-gray-600">
                <span className="sr-only">Twitter</span>
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M6.29 18.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0020 3.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.073 4.073 0 01.8 7.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 010 16.407a11.616 11.616 0 006.29 1.84" />
                </svg>
              </a>
              <a href="#" className="text-gray-400 hover:text-gray-600">
                <span className="sr-only">LinkedIn</span>
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.338 16.338H13.67V12.16c0-.995-.017-2.277-1.387-2.277-1.39 0-1.601 1.086-1.601 2.207v4.248H8.014v-8.59h2.559v1.174h.037c.356-.675 1.227-1.387 2.526-1.387 2.703 0 3.203 1.778 3.203 4.092v4.711zM5.005 6.575a1.548 1.548 0 11-.003-3.096 1.548 1.548 0 01.003 3.096zm-1.337 9.763H6.34v-8.59H3.667v8.59zM17.668 1H2.328C1.595 1 1 1.581 1 2.298v15.403C1 18.418 1.595 19 2.328 19h15.34c.734 0 1.332-.582 1.332-1.299V2.298C19 1.581 18.402 1 17.668 1z" clipRule="evenodd" />
                </svg>
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}