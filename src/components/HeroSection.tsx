import heroBg from "@/assets/hero-bg.jpg";
import CircloLogo from "@/components/CircloLogo";

interface HeroSectionProps {
  onScrollToContent: () => void;
}

const HeroSection = ({ onScrollToContent }: HeroSectionProps) => {
  return (
    <section className="relative h-screen min-h-[700px] flex items-center justify-center overflow-hidden">
      {/* Background image with Ken Burns effect */}
      <img
        src={heroBg}
        alt="Athletes training"
        className="absolute inset-0 h-full w-full object-cover scale-110 animate-[float_20s_ease-in-out_infinite]"
        width={1920}
        height={1080}
      />

      {/* Dark overlays for contrast */}
      <div className="absolute inset-0 bg-gradient-to-b from-foreground/70 via-foreground/40 to-background" />
      <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-transparent to-accent/10" />

      {/* Content */}
      <div className="relative z-10 text-center px-6 max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-3 mb-10 animate-fade-in">
          <CircloLogo variant="full" size="lg" theme="white" />
        </div>

        <h1
          className="text-6xl sm:text-7xl md:text-8xl font-bold text-primary-foreground mb-6 leading-[0.95] tracking-tight animate-fade-in-up"
          style={{ animationDelay: "100ms" }}
        >
          Find your
          <br />
          <span className="gradient-text">circle.</span>
        </h1>

        <p
          className="text-lg text-primary-foreground/70 mb-12 max-w-md mx-auto animate-fade-in-up opacity-0"
          style={{ animationDelay: "250ms" }}
        >
          The sports platform where content meets coaching.
        </p>

        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-white/80 text-xs font-medium mb-4">
          <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          🦾 Powered by OpenClaw
        </div>

        <button
          onClick={onScrollToContent}
          className="bg-brand-gradient text-primary-foreground px-10 py-4 rounded-xl font-semibold text-base tracking-wide transition-all duration-200 hover:brightness-110 hover:scale-[1.04] active:scale-95 animate-fade-in-up shadow-brand opacity-0"
          style={{ animationDelay: "400ms" }}
        >
          Start Exploring
        </button>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-float">
        <div className="w-6 h-10 border-2 border-primary-foreground/20 rounded-full flex items-start justify-center p-1.5">
          <div className="w-1.5 h-3 bg-primary rounded-full animate-pulse-glow" />
        </div>
      </div>

      {/* Ambient glow */}
      <div className="absolute -bottom-40 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-primary/8 blur-[150px] pointer-events-none" />
    </section>
  );
};

export default HeroSection;
