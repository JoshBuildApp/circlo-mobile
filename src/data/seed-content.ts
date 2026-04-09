/**
 * Seed content: photos matched to coaches by sport.
 * These are auto-distributed as photo posts on coach profiles.
 */
export interface SeedPost {
  coachId: string;
  coachName: string;
  sport: string;
  mediaUrl: string;
  caption: string;
  category: "training" | "highlights" | "tips" | "moments";
}

export const seedPosts: SeedPost[] = [
  // Soccer — Coach 1 (Maria Santos)
  {
    coachId: "1",
    coachName: "Maria Santos",
    sport: "Soccer",
    mediaUrl: "/images/content/soccer-action-1.jpg",
    caption: "Training session focus ⚽ Every detail counts on the pitch.",
    category: "training",
  },
  {
    coachId: "1",
    coachName: "Maria Santos",
    sport: "Soccer",
    mediaUrl: "/images/content/soccer-action-2.jpg",
    caption: "Young talent shining bright 🌟 The next generation is here.",
    category: "highlights",
  },

  // Basketball — Coach 2 (James Cooper)
  {
    coachId: "2",
    coachName: "James Cooper",
    sport: "Basketball",
    mediaUrl: "/images/content/basketball-action-1.jpg",
    caption: "Reaching new heights 🏀 Elevate your game every day.",
    category: "highlights",
  },
  {
    coachId: "2",
    coachName: "James Cooper",
    sport: "Basketball",
    mediaUrl: "/images/content/basketball-action-2.jpg",
    caption: "The court is our classroom 📐 Strategy meets hustle.",
    category: "training",
  },
  {
    coachId: "2",
    coachName: "James Cooper",
    sport: "Basketball",
    mediaUrl: "/images/content/basketball-action-3.jpg",
    caption: "Grind doesn't stop 💪 Dedication on and off the court.",
    category: "moments",
  },

  // Yoga — Coach 3 (Elena Voss)
  {
    coachId: "3",
    coachName: "Elena Voss",
    sport: "Yoga",
    mediaUrl: "/images/content/yoga-action-1.jpg",
    caption: "Focus, breathe, perform 🧘 Mind and body alignment.",
    category: "training",
  },

  // Tennis — Coach 4 (Robert Chen)
  {
    coachId: "4",
    coachName: "Robert Chen",
    sport: "Tennis",
    mediaUrl: "/images/content/tennis-action-1.jpg",
    caption: "Full extension, maximum power 🎾 Technique is everything.",
    category: "highlights",
  },

  // Boxing — Coach 5 (Marcus Wright)
  {
    coachId: "5",
    coachName: "Marcus Wright",
    sport: "Boxing",
    mediaUrl: "/images/content/boxing-action-1.jpg",
    caption: "Contact sport, champion heart 🥊 Never back down.",
    category: "training",
  },

  // Swimming — Coach 6 (Lisa Andersson)
  {
    coachId: "6",
    coachName: "Lisa Andersson",
    sport: "Swimming",
    mediaUrl: "/images/content/swimming-action-1.jpg",
    caption: "Power through water 🏊 Speed meets precision.",
    category: "highlights",
  },
];
