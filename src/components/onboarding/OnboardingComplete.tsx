import { useEffect, useState } from "react";
import { CheckCircle, Sparkles } from "lucide-react";
import CircloLogo from "@/components/CircloLogo";

export function OnboardingComplete() {
  const [showAnimation, setShowAnimation] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowAnimation(true);
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-purple-600 to-blue-800 flex items-center justify-center">
      <div className="text-center text-white space-y-8 animate-in fade-in duration-1000">
        {/* Logo */}
        <div className="mb-8">
          <CircloLogo className="mx-auto h-16 w-auto text-white" />
        </div>

        {/* Success Icon */}
        <div className={`transition-all duration-1000 ${showAnimation ? 'scale-100 opacity-100' : 'scale-50 opacity-0'}`}>
          <div className="relative">
            <CheckCircle className="w-24 h-24 mx-auto text-green-400" />
            <div className="absolute -top-2 -right-2">
              <Sparkles className="w-8 h-8 text-yellow-300 animate-pulse" />
            </div>
          </div>
        </div>

        {/* Welcome Message */}
        <div className={`space-y-4 transition-all duration-1000 delay-500 ${showAnimation ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}>
          <h1 className="text-3xl md:text-4xl font-bold">
            Welcome to Circlo! 🎉
          </h1>
          <p className="text-lg md:text-xl text-blue-100 max-w-md mx-auto">
            Your profile is all set up! We're personalizing your experience based on your preferences.
          </p>
        </div>

        {/* Features Preview */}
        <div className={`grid grid-cols-1 md:grid-cols-3 gap-6 mt-12 max-w-2xl mx-auto transition-all duration-1000 delay-1000 ${showAnimation ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}>
          <div className="bg-white/10 backdrop-blur-lg rounded-lg p-6 text-center">
            <div className="text-2xl mb-2">🏅</div>
            <h3 className="font-semibold mb-1">Personalized Coaches</h3>
            <p className="text-sm text-blue-100">Matched to your sports and skill level</p>
          </div>
          
          <div className="bg-white/10 backdrop-blur-lg rounded-lg p-6 text-center">
            <div className="text-2xl mb-2">⏰</div>
            <h3 className="font-semibold mb-1">Perfect Timing</h3>
            <p className="text-sm text-blue-100">Sessions that fit your schedule</p>
          </div>
          
          <div className="bg-white/10 backdrop-blur-lg rounded-lg p-6 text-center">
            <div className="text-2xl mb-2">🎯</div>
            <h3 className="font-semibold mb-1">Tailored Content</h3>
            <p className="text-sm text-blue-100">Training content just for you</p>
          </div>
        </div>

        {/* Loading Message */}
        <div className={`text-blue-100 transition-all duration-1000 delay-1500 ${showAnimation ? 'opacity-100' : 'opacity-0'}`}>
          <div className="flex items-center justify-center space-x-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            <span>Redirecting to your personalized discover page...</span>
          </div>
        </div>
      </div>
    </div>
  );
}