import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

interface NotFoundPageProps {
  /** Override heading text */
  title?: string;
  /** Override description */
  description?: string;
  /** If true, hide navigation buttons (useful inside ErrorBoundary) */
  hideNav?: boolean;
  /** Custom "go back" handler */
  onGoBack?: () => void;
  /** Custom "go home" handler */
  onGoHome?: () => void;
}

export default function NotFoundPage({
  title = "Page Not Found",
  description = "The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.",
  hideNav = false,
  onGoBack,
  onGoHome,
}: NotFoundPageProps) {
  return (
    <div className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-background">
      <CircleAnimation />
      <CharactersAnimation />
      <MessageDisplay
        title={title}
        description={description}
        hideNav={hideNav}
        onGoBack={onGoBack}
        onGoHome={onGoHome}
      />
    </div>
  );
}

/* ─── Message ─── */

function MessageDisplay({
  title,
  description,
  hideNav,
  onGoBack,
  onGoHome,
}: {
  title: string;
  description: string;
  hideNav: boolean;
  onGoBack?: () => void;
  onGoHome?: () => void;
}) {
  const navigate = useNavigate();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 1200);
    return () => clearTimeout(timer);
  }, []);

  const handleBack = onGoBack ?? (() => navigate(-1));
  const handleHome = onGoHome ?? (() => navigate("/home"));

  return (
    <div
      className={`relative z-20 flex flex-col items-center justify-center text-center px-6 transition-all duration-700 ${
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
      }`}
    >
      <div className="space-y-5 max-w-md">
        <p className="text-sm font-medium tracking-widest uppercase text-muted-foreground">
          {title}
        </p>

        <h1 className="text-[8rem] sm:text-[10rem] font-heading font-black leading-none text-foreground select-none">
          404
        </h1>

        <p className="text-sm text-muted-foreground leading-relaxed max-w-xs mx-auto">
          {description}
        </p>

        {!hideNav && (
          <div className="flex items-center justify-center gap-3 pt-2">
            <Button
              variant="outline"
              onClick={handleBack}
              className="gap-2"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="m12 19-7-7 7-7" />
                <path d="M19 12H5" />
              </svg>
              Go Back
            </Button>
            <Button onClick={handleHome} className="gap-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                <polyline points="9 22 9 12 15 12 15 22" />
              </svg>
              Go Home
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Stick‑figure characters ─── */

type StickFigure = {
  top?: string;
  bottom?: string;
  src: string;
  transform?: string;
  speedX: number;
  speedRotation?: number;
};

function CharactersAnimation() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = ref.current;
    if (!container) return;

    const figures: StickFigure[] = [
      {
        top: "0%",
        src: "https://raw.githubusercontent.com/RicardoYare/imagenes/9ef29f5bbe075b1d1230a996d87bca313b9b6a63/sticks/stick0.svg",
        transform: "rotateZ(-90deg)",
        speedX: 1500,
      },
      {
        top: "10%",
        src: "https://raw.githubusercontent.com/RicardoYare/imagenes/9ef29f5bbe075b1d1230a996d87bca313b9b6a63/sticks/stick1.svg",
        speedX: 3000,
        speedRotation: 2000,
      },
      {
        top: "20%",
        src: "https://raw.githubusercontent.com/RicardoYare/imagenes/9ef29f5bbe075b1d1230a996d87bca313b9b6a63/sticks/stick2.svg",
        speedX: 5000,
        speedRotation: 1000,
      },
      {
        top: "25%",
        src: "https://raw.githubusercontent.com/RicardoYare/imagenes/9ef29f5bbe075b1d1230a996d87bca313b9b6a63/sticks/stick0.svg",
        speedX: 2500,
        speedRotation: 1500,
      },
      {
        top: "35%",
        src: "https://raw.githubusercontent.com/RicardoYare/imagenes/9ef29f5bbe075b1d1230a996d87bca313b9b6a63/sticks/stick0.svg",
        speedX: 2000,
        speedRotation: 300,
      },
      {
        bottom: "5%",
        src: "https://raw.githubusercontent.com/RicardoYare/imagenes/9ef29f5bbe075b1d1230a996d87bca313b9b6a63/sticks/stick3.svg",
        speedX: 0,
      },
    ];

    container.innerHTML = "";

    figures.forEach((fig, i) => {
      const img = document.createElement("img");
      img.style.position = "absolute";
      img.style.width = "18%";
      img.style.height = "18%";
      if (fig.top) img.style.top = fig.top;
      if (fig.bottom) img.style.bottom = fig.bottom;
      img.src = fig.src;
      if (fig.transform) img.style.transform = fig.transform;
      container.appendChild(img);

      if (i === 5) return;

      img.animate([{ left: "100%" }, { left: "-20%" }], {
        duration: fig.speedX,
        easing: "linear",
        fill: "forwards",
      });

      if (i === 0) return;

      if (fig.speedRotation) {
        img.animate(
          [{ transform: "rotate(0deg)" }, { transform: "rotate(-360deg)" }],
          { duration: fig.speedRotation, iterations: Infinity, easing: "linear" }
        );
      }
    });

    return () => {
      container.innerHTML = "";
    };
  }, []);

  return (
    <div
      ref={ref}
      className="absolute inset-0 z-10 pointer-events-none overflow-hidden"
    />
  );
}

/* ─── Circle canvas ─── */

interface Circulo {
  x: number;
  y: number;
  size: number;
}

function CircleAnimation() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>();
  const timerRef = useRef(0);
  const circulosRef = useRef<Circulo[]>([]);

  const initArr = () => {
    const c = canvasRef.current;
    if (!c) return;
    circulosRef.current = [];
    for (let i = 0; i < 300; i++) {
      circulosRef.current.push({
        x:
          Math.floor(Math.random() * (c.width * 3 - c.width * 1.2 + 1)) +
          c.width * 1.2,
        y:
          Math.floor(Math.random() * (c.height - c.height * -0.2 + 1)) +
          c.height * -0.2,
        size: c.width / 1000,
      });
    }
  };

  const draw = () => {
    const c = canvasRef.current;
    if (!c) return;
    const ctx = c.getContext("2d");
    if (!ctx) return;

    timerRef.current++;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    const dx = c.width / 80;
    const gr = c.width / 1000;

    // Use CSS variable for circle color to match theme
    const rootStyles = getComputedStyle(document.documentElement);
    const fg = rootStyles.getPropertyValue("--foreground").trim();
    ctx.fillStyle = fg ? `hsl(${fg})` : "#1a1a2e";

    ctx.clearRect(0, 0, c.width, c.height);

    circulosRef.current.forEach((ci) => {
      ctx.beginPath();
      if (timerRef.current < 65) {
        ci.x -= dx;
        ci.size += gr;
      }
      if (timerRef.current > 65 && timerRef.current < 500) {
        ci.x -= dx * 0.02;
        ci.size += gr * 0.2;
      }
      ctx.arc(ci.x, ci.y, ci.size, 0, Math.PI * 2);
      ctx.fill();
    });

    if (timerRef.current > 500) {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      return;
    }
    rafRef.current = requestAnimationFrame(draw);
  };

  useEffect(() => {
    const c = canvasRef.current;
    if (!c) return;

    const setup = () => {
      c.width = window.innerWidth;
      c.height = window.innerHeight;
      timerRef.current = 0;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      initArr();
      draw();
    };

    setup();
    window.addEventListener("resize", setup);
    return () => {
      window.removeEventListener("resize", setup);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 z-0 opacity-10"
    />
  );
}
