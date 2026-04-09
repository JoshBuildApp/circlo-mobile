import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, ArrowLeft, Dumbbell, Trophy, Sparkles, Users, Sun, Home, Zap, Target, Heart, Wind } from "lucide-react";
import { cn } from "@/lib/utils";

interface QuizAnswer {
  goal: string;
  frequency: string;
  environment: string;
  social: string;
  excitement: string;
}

interface SportMatch {
  sport: string;
  match: number;
  icon: string;
  description: string;
}

const questions = [
  {
    id: "goal",
    question: "What's your main goal?",
    options: [
      { value: "lose_weight", label: "Lose Weight", icon: Zap, description: "Burn fat and get lean" },
      { value: "build_muscle", label: "Build Muscle", icon: Dumbbell, description: "Get stronger and bigger" },
      { value: "stay_active", label: "Stay Active", icon: Heart, description: "Keep healthy and moving" },
      { value: "compete", label: "Compete", icon: Trophy, description: "Train to win" },
    ],
  },
  {
    id: "frequency",
    question: "How often do you train?",
    options: [
      { value: "light", label: "1-2x / week", icon: Sun, description: "Easy start" },
      { value: "moderate", label: "3-4x / week", icon: Target, description: "Consistent grind" },
      { value: "intense", label: "5+ / week", icon: Zap, description: "All in" },
    ],
  },
  {
    id: "environment",
    question: "Indoor or outdoor?",
    options: [
      { value: "indoor", label: "Indoor", icon: Home, description: "Gym, studio, court" },
      { value: "outdoor", label: "Outdoor", icon: Sun, description: "Fresh air, open space" },
      { value: "both", label: "Both", icon: Sparkles, description: "Mix it up" },
    ],
  },
  {
    id: "social",
    question: "How do you like to train?",
    options: [
      { value: "solo", label: "Solo", icon: Target, description: "Just me and the grind" },
      { value: "partner", label: "With a Partner", icon: Users, description: "1-on-1 energy" },
      { value: "group", label: "Group", icon: Users, description: "Team vibes" },
    ],
  },
  {
    id: "excitement",
    question: "What excites you most?",
    options: [
      { value: "speed", label: "Speed", icon: Zap, description: "Fast and explosive" },
      { value: "strength", label: "Strength", icon: Dumbbell, description: "Raw power" },
      { value: "flexibility", label: "Flexibility", icon: Wind, description: "Flow and balance" },
      { value: "endurance", label: "Endurance", icon: Heart, description: "Go the distance" },
    ],
  },
];

// Sport scoring matrix
const sportScores: Record<string, Record<string, number>> = {
  padel:       { lose_weight: 7, build_muscle: 4, stay_active: 9, compete: 8, light: 7, moderate: 9, intense: 7, indoor: 8, outdoor: 6, both: 9, solo: 3, partner: 10, group: 8, speed: 8, strength: 5, flexibility: 6, endurance: 7 },
  fitness:     { lose_weight: 10, build_muscle: 10, stay_active: 8, compete: 5, light: 6, moderate: 9, intense: 10, indoor: 10, outdoor: 4, both: 8, solo: 10, partner: 7, group: 8, speed: 6, strength: 10, flexibility: 5, endurance: 7 },
  tennis:      { lose_weight: 7, build_muscle: 5, stay_active: 8, compete: 9, light: 6, moderate: 8, intense: 9, indoor: 6, outdoor: 9, both: 9, solo: 4, partner: 10, group: 5, speed: 9, strength: 6, flexibility: 7, endurance: 8 },
  boxing:      { lose_weight: 9, build_muscle: 8, stay_active: 7, compete: 10, light: 5, moderate: 8, intense: 10, indoor: 10, outdoor: 5, both: 7, solo: 8, partner: 9, group: 7, speed: 10, strength: 9, flexibility: 4, endurance: 8 },
  soccer:      { lose_weight: 8, build_muscle: 5, stay_active: 9, compete: 9, light: 5, moderate: 8, intense: 9, indoor: 4, outdoor: 10, both: 7, solo: 3, partner: 6, group: 10, speed: 9, strength: 6, flexibility: 5, endurance: 10 },
  basketball:  { lose_weight: 8, build_muscle: 6, stay_active: 9, compete: 8, light: 5, moderate: 8, intense: 9, indoor: 9, outdoor: 7, both: 9, solo: 4, partner: 7, group: 10, speed: 9, strength: 7, flexibility: 6, endurance: 8 },
  yoga:        { lose_weight: 5, build_muscle: 4, stay_active: 10, compete: 2, light: 10, moderate: 8, intense: 6, indoor: 9, outdoor: 7, both: 9, solo: 10, partner: 6, group: 8, speed: 2, strength: 4, flexibility: 10, endurance: 5 },
  swimming:    { lose_weight: 9, build_muscle: 7, stay_active: 10, compete: 7, light: 8, moderate: 9, intense: 9, indoor: 9, outdoor: 7, both: 9, solo: 10, partner: 5, group: 6, speed: 7, strength: 7, flexibility: 8, endurance: 10 },
  running:     { lose_weight: 10, build_muscle: 3, stay_active: 9, compete: 7, light: 8, moderate: 9, intense: 10, indoor: 5, outdoor: 10, both: 8, solo: 10, partner: 6, group: 7, speed: 8, strength: 3, flexibility: 4, endurance: 10 },
  mma:         { lose_weight: 8, build_muscle: 9, stay_active: 6, compete: 10, light: 3, moderate: 7, intense: 10, indoor: 10, outdoor: 4, both: 7, solo: 7, partner: 10, group: 7, speed: 9, strength: 10, flexibility: 7, endurance: 8 },
  crossfit:    { lose_weight: 9, build_muscle: 9, stay_active: 7, compete: 8, light: 3, moderate: 7, intense: 10, indoor: 9, outdoor: 5, both: 8, solo: 6, partner: 7, group: 10, speed: 8, strength: 10, flexibility: 5, endurance: 9 },
  martial_arts:{ lose_weight: 7, build_muscle: 7, stay_active: 8, compete: 9, light: 5, moderate: 8, intense: 9, indoor: 10, outdoor: 4, both: 7, solo: 8, partner: 9, group: 8, speed: 8, strength: 8, flexibility: 9, endurance: 7 },
};

const sportLabels: Record<string, { label: string; icon: string; desc: string }> = {
  padel: { label: "Padel", icon: "🎾", desc: "Fast-paced racket sport with a social twist" },
  fitness: { label: "Fitness", icon: "💪", desc: "Strength training and conditioning" },
  tennis: { label: "Tennis", icon: "🎾", desc: "Classic competitive racket sport" },
  boxing: { label: "Boxing", icon: "🥊", desc: "High-intensity striking and defense" },
  soccer: { label: "Soccer", icon: "⚽", desc: "The beautiful game — teamwork and endurance" },
  basketball: { label: "Basketball", icon: "🏀", desc: "Speed, agility, and team play" },
  yoga: { label: "Yoga", icon: "🧘", desc: "Mind-body balance and flexibility" },
  swimming: { label: "Swimming", icon: "🏊", desc: "Full-body low-impact workout" },
  running: { label: "Running", icon: "🏃", desc: "Cardio king — go your own pace" },
  mma: { label: "MMA", icon: "🥋", desc: "Mixed martial arts — ultimate combat sport" },
  crossfit: { label: "CrossFit", icon: "🏋️", desc: "Functional fitness at high intensity" },
  martial_arts: { label: "Martial Arts", icon: "🥋", desc: "Discipline, technique, and self-defense" },
};

function calculateResults(answers: QuizAnswer): SportMatch[] {
  const scores: Record<string, number> = {};
  const answerValues = Object.values(answers);

  for (const [sport, matrix] of Object.entries(sportScores)) {
    let total = 0;
    for (const val of answerValues) {
      total += matrix[val] || 0;
    }
    // Normalize to percentage (max possible = 5 questions × 10 points = 50)
    scores[sport] = Math.round((total / 50) * 100);
  }

  return Object.entries(scores)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3)
    .map(([sport, match]) => ({
      sport,
      match,
      icon: sportLabels[sport]?.icon || "🏆",
      description: sportLabels[sport]?.desc || "",
    }));
}

interface WorkoutQuizProps {
  onComplete?: (results: SportMatch[]) => void;
  onFindCoach?: (sport: string) => void;
}

const WorkoutQuiz = ({ onComplete, onFindCoach }: WorkoutQuizProps) => {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Partial<QuizAnswer>>({});
  const [results, setResults] = useState<SportMatch[] | null>(null);
  const [direction, setDirection] = useState(1);

  const currentQuestion = questions[step];
  const totalSteps = questions.length;
  const progress = ((step + 1) / totalSteps) * 100;

  const handleSelect = (value: string) => {
    const key = currentQuestion.id as keyof QuizAnswer;
    const newAnswers = { ...answers, [key]: value };
    setAnswers(newAnswers);

    if (step < totalSteps - 1) {
      setDirection(1);
      setTimeout(() => setStep(step + 1), 200);
    } else {
      // Calculate results
      const res = calculateResults(newAnswers as QuizAnswer);
      setResults(res);
      onComplete?.(res);
    }
  };

  const handleBack = () => {
    if (step > 0) {
      setDirection(-1);
      setStep(step - 1);
    }
  };

  const handleReset = () => {
    setStep(0);
    setAnswers({});
    setResults(null);
    setDirection(1);
  };

  // Results Screen
  if (results) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md mx-auto"
      >
        <div className="text-center mb-6">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", delay: 0.2 }}
            className="text-4xl mb-3"
          >
            🎯
          </motion.div>
          <h3 className="font-heading text-xl font-bold text-foreground">Your Perfect Match</h3>
          <p className="text-sm text-muted-foreground mt-1">Based on your answers, here are your top workouts</p>
        </div>

        <div className="space-y-3">
          {results.map((result, i) => (
            <motion.div
              key={result.sport}
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 + i * 0.15 }}
              className={cn(
                "flex items-center gap-4 p-4 rounded-2xl border transition-all",
                i === 0
                  ? "bg-primary/5 border-primary/20 shadow-sm"
                  : "bg-card border-border/50"
              )}
            >
              <span className="text-3xl">{result.icon}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-heading font-bold text-foreground">{sportLabels[result.sport]?.label}</span>
                  {i === 0 && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
                      Best Match
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">{result.description}</p>
                {/* Match bar */}
                <div className="mt-2 flex items-center gap-2">
                  <div className="flex-1 h-1.5 rounded-full bg-secondary overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${result.match}%` }}
                      transition={{ delay: 0.5 + i * 0.15, duration: 0.6 }}
                      className={cn(
                        "h-full rounded-full",
                        i === 0 ? "bg-primary" : "bg-primary/60"
                      )}
                    />
                  </div>
                  <span className="text-xs font-bold text-foreground w-10 text-right">{result.match}%</span>
                </div>
              </div>
              <button
                onClick={() => onFindCoach?.(result.sport)}
                className="shrink-0 px-3 py-1.5 rounded-xl bg-primary/10 text-primary text-xs font-medium hover:bg-primary/20 transition-colors"
              >
                Find Coach
              </button>
            </motion.div>
          ))}
        </div>

        <button
          onClick={handleReset}
          className="w-full mt-4 py-2.5 rounded-xl text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          Retake Quiz
        </button>
      </motion.div>
    );
  }

  // Quiz Screen
  return (
    <div className="w-full max-w-md mx-auto">
      {/* Progress */}
      <div className="flex items-center gap-3 mb-6">
        {step > 0 && (
          <button onClick={handleBack} className="text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft size={18} />
          </button>
        )}
        <div className="flex-1 h-1.5 rounded-full bg-secondary overflow-hidden">
          <motion.div
            className="h-full rounded-full bg-primary"
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
        <span className="text-xs text-muted-foreground font-medium">{step + 1}/{totalSteps}</span>
      </div>

      {/* Question */}
      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: direction * 40 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: direction * -40 }}
          transition={{ duration: 0.25 }}
        >
          <h3 className="font-heading text-lg font-bold text-foreground text-center mb-6">
            {currentQuestion.question}
          </h3>

          <div className="space-y-3">
            {currentQuestion.options.map((option) => {
              const isSelected = answers[currentQuestion.id as keyof QuizAnswer] === option.value;
              return (
                <motion.button
                  key={option.value}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => handleSelect(option.value)}
                  className={cn(
                    "w-full flex items-center gap-4 p-4 rounded-2xl border text-left transition-all duration-200",
                    isSelected
                      ? "bg-primary/10 border-primary/30 shadow-sm"
                      : "bg-card border-border/50 hover:border-primary/20 hover:bg-primary/5"
                  )}
                >
                  <div className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors",
                    isSelected ? "bg-primary/20" : "bg-secondary"
                  )}>
                    <option.icon size={18} className={isSelected ? "text-primary" : "text-muted-foreground"} />
                  </div>
                  <div>
                    <p className="font-medium text-sm text-foreground">{option.label}</p>
                    <p className="text-xs text-muted-foreground">{option.description}</p>
                  </div>
                  {isSelected && (
                    <ArrowRight size={16} className="text-primary ml-auto shrink-0" />
                  )}
                </motion.button>
              );
            })}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default WorkoutQuiz;
