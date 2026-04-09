import coach1 from "@/assets/coach-1.jpg";
import coach2 from "@/assets/coach-2.jpg";
import coach3 from "@/assets/coach-3.jpg";
import coach4 from "@/assets/coach-4.jpg";
import coach5 from "@/assets/coach-5.jpg";
import coach6 from "@/assets/coach-6.jpg";

export interface Video {
  title: string;
  url: string;
  thumbnail?: string;
  category: "training" | "highlights" | "tips" | "interview";
  duration?: string;
  views?: number;
}

export interface Review {
  name: string;
  avatar: string;
  rating: number;
  text: string;
  date: string;
}

export interface Coach {
  id: string;
  name: string;
  tagline: string;
  sport: string;
  location: string;
  bio: string;
  longBio: string;
  coachingStyle: string;
  idealFor: string;
  specialties: string[];
  image: string;
  coverImage: string;
  price: number;
  rating: number;
  reviewCount: number;
  followers: number;
  yearsExperience: number;
  videos: Video[];
  reviews: Review[];
}

export const coaches: Coach[] = [
  {
    id: "1",
    name: "Maria Santos",
    tagline: "Soccer Coach | Youth Development Specialist",
    sport: "Soccer",
    location: "Los Angeles, CA",
    bio: "Former pro player turned elite youth coach. 10+ years of experience developing the next generation.",
    longBio: "Maria played professionally in the NWSL for 6 seasons before transitioning to coaching. She specializes in developing young athletes' technical skills and tactical awareness. Her training methodology combines drill-based fundamentals with game-situational learning.",
    coachingStyle: "Structured drills mixed with game-situational play. High energy, patient, and detail-oriented.",
    idealFor: "Youth athletes ages 8–18 looking to develop strong fundamentals and competitive edge.",
    specialties: ["Youth Development", "Technical Skills", "Game Tactics"],
    image: coach1,
    coverImage: coach1,
    price: 75,
    rating: 4.9,
    reviewCount: 127,
    followers: 2340,
    yearsExperience: 10,
    videos: [
      { title: "Dribbling Masterclass", url: "https://www.youtube.com/embed/dQw4w9WgXcQ", category: "training", duration: "12:30", views: 15400 },
      { title: "Shooting Technique", url: "https://www.youtube.com/embed/dQw4w9WgXcQ", category: "training", duration: "8:45", views: 9200 },
      { title: "Match Day Highlights", url: "https://www.youtube.com/embed/dQw4w9WgXcQ", category: "highlights", duration: "5:20", views: 22100 },
      { title: "5 Tips for Young Players", url: "https://www.youtube.com/embed/dQw4w9WgXcQ", category: "tips", duration: "6:15", views: 18700 },
      { title: "Post-Game Analysis", url: "https://www.youtube.com/embed/dQw4w9WgXcQ", category: "interview", duration: "15:00", views: 4300 },
    ],
    reviews: [
      { name: "Carlos M.", avatar: "C", rating: 5, text: "Maria transformed my daughter's game in just 3 months. Incredible coach!", date: "2 weeks ago" },
      { name: "Sarah K.", avatar: "S", rating: 5, text: "Patient, knowledgeable, and truly cares about each player's development.", date: "1 month ago" },
      { name: "David R.", avatar: "D", rating: 4, text: "Great training sessions. My son looks forward to every practice.", date: "2 months ago" },
    ],
  },
  {
    id: "2",
    name: "James Cooper",
    tagline: "Basketball Coach | Next Level Training",
    sport: "Basketball",
    location: "Chicago, IL",
    bio: "NCAA Division I coach helping players reach the next level with elite training.",
    longBio: "James spent 8 years coaching at the collegiate level before opening his private training practice. He focuses on shooting mechanics, ball handling, and basketball IQ. His clients include several players who went on to play professionally.",
    coachingStyle: "Intense, data-driven, and focused on measurable improvement. Film study included.",
    idealFor: "Competitive players (high school+) aiming for college or pro-level performance.",
    specialties: ["Shooting Mechanics", "Ball Handling", "Basketball IQ"],
    image: coach2,
    coverImage: coach2,
    price: 90,
    rating: 4.8,
    reviewCount: 89,
    followers: 5120,
    yearsExperience: 12,
    videos: [
      { title: "Shooting Form Breakdown", url: "https://www.youtube.com/embed/dQw4w9WgXcQ", category: "training", duration: "10:15", views: 31200 },
      { title: "Court Vision Drills", url: "https://www.youtube.com/embed/dQw4w9WgXcQ", category: "training", duration: "7:30", views: 12800 },
      { title: "Game-Winning Plays", url: "https://www.youtube.com/embed/dQw4w9WgXcQ", category: "highlights", duration: "4:50", views: 45600 },
      { title: "Handle Like a Pro", url: "https://www.youtube.com/embed/dQw4w9WgXcQ", category: "tips", duration: "9:00", views: 28900 },
    ],
    reviews: [
      { name: "Mike T.", avatar: "M", rating: 5, text: "Coach Cooper's training got me a D1 scholarship. Forever grateful.", date: "3 weeks ago" },
      { name: "Jordan L.", avatar: "J", rating: 5, text: "Best shooting coach I've ever worked with. Period.", date: "1 month ago" },
    ],
  },
  {
    id: "3",
    name: "Elena Voss",
    tagline: "Yoga Instructor | Mind & Body Performance",
    sport: "Yoga",
    location: "Austin, TX",
    bio: "Certified yoga instructor blending mindfulness with athletic performance.",
    longBio: "Elena holds certifications in Vinyasa, Yin, and Sports Yoga. She works with professional athletes to improve flexibility, recovery, and mental focus. Her sessions combine traditional yoga with modern sports science principles.",
    coachingStyle: "Calm, intentional, and personalized. Each session adapts to your body and goals.",
    idealFor: "Athletes seeking better recovery, flexibility, and mental clarity. All levels welcome.",
    specialties: ["Sports Yoga", "Flexibility", "Mindfulness"],
    image: coach3,
    coverImage: coach3,
    price: 60,
    rating: 5.0,
    reviewCount: 203,
    followers: 8750,
    yearsExperience: 8,
    videos: [
      { title: "Morning Flow Routine", url: "https://www.youtube.com/embed/dQw4w9WgXcQ", category: "training", duration: "20:00", views: 67800 },
      { title: "Recovery for Athletes", url: "https://www.youtube.com/embed/dQw4w9WgXcQ", category: "tips", duration: "14:30", views: 23400 },
      { title: "Competition Day Prep", url: "https://www.youtube.com/embed/dQw4w9WgXcQ", category: "highlights", duration: "8:00", views: 15200 },
      { title: "Breathwork Basics", url: "https://www.youtube.com/embed/dQw4w9WgXcQ", category: "tips", duration: "11:45", views: 41000 },
      { title: "Interview: The Yoga Athlete", url: "https://www.youtube.com/embed/dQw4w9WgXcQ", category: "interview", duration: "18:30", views: 8900 },
      { title: "Deep Stretch Session", url: "https://www.youtube.com/embed/dQw4w9WgXcQ", category: "training", duration: "25:00", views: 52300 },
    ],
    reviews: [
      { name: "Anna P.", avatar: "A", rating: 5, text: "Elena's sessions are life-changing. My recovery has improved 10x.", date: "1 week ago" },
      { name: "Tom W.", avatar: "T", rating: 5, text: "As a marathon runner, yoga with Elena is now essential to my training.", date: "3 weeks ago" },
      { name: "Lisa H.", avatar: "L", rating: 5, text: "The most calming yet effective yoga practice I've ever experienced.", date: "1 month ago" },
    ],
  },
  {
    id: "4",
    name: "Robert Chen",
    tagline: "Tennis Coach | Competitive Edge",
    sport: "Tennis",
    location: "Miami, FL",
    bio: "ATP-ranked coach with 15 years of competitive and coaching experience.",
    longBio: "Robert reached a career-high ATP ranking of 180 before dedicating himself to coaching full-time. He has trained junior national champions and adults returning to the sport. His approach emphasizes proper technique and strategic play.",
    coachingStyle: "Technical precision with strategic match play. Analytical and demanding.",
    idealFor: "Junior competitors and adult players seeking tournament-level improvement.",
    specialties: ["Serve Technique", "Match Strategy", "Footwork"],
    image: coach4,
    coverImage: coach4,
    price: 100,
    rating: 4.7,
    reviewCount: 64,
    followers: 3200,
    yearsExperience: 15,
    videos: [
      { title: "Perfect Your Serve", url: "https://www.youtube.com/embed/dQw4w9WgXcQ", category: "training", duration: "11:20", views: 19500 },
      { title: "Footwork Fundamentals", url: "https://www.youtube.com/embed/dQw4w9WgXcQ", category: "training", duration: "9:45", views: 14300 },
      { title: "Match Point Highlights", url: "https://www.youtube.com/embed/dQw4w9WgXcQ", category: "highlights", duration: "6:30", views: 27800 },
      { title: "3 Forehand Fixes", url: "https://www.youtube.com/embed/dQw4w9WgXcQ", category: "tips", duration: "5:10", views: 35200 },
    ],
    reviews: [
      { name: "Kevin O.", avatar: "K", rating: 5, text: "Robert's serve technique coaching is world-class.", date: "2 weeks ago" },
      { name: "Rachel N.", avatar: "R", rating: 4, text: "Demanding but incredibly effective. My game improved dramatically.", date: "1 month ago" },
    ],
  },
  {
    id: "5",
    name: "Marcus Wright",
    tagline: "Boxing Trainer | Champion Mindset",
    sport: "Boxing",
    location: "New York, NY",
    bio: "Professional boxing trainer. Train like a fighter, think like a champion.",
    longBio: "Marcus has been in boxing for over 20 years, both as a fighter and a trainer. He runs an intense but accessible program suitable for competitive boxers and fitness enthusiasts alike. His gym has produced 3 regional champions.",
    coachingStyle: "High-intensity, disciplined, and motivational. Pushes limits with encouragement.",
    idealFor: "Anyone from fitness beginners to competitive fighters wanting to sharpen their skills.",
    specialties: ["Technique", "Conditioning", "Fight Prep"],
    image: coach5,
    coverImage: coach5,
    price: 85,
    rating: 4.9,
    reviewCount: 156,
    followers: 12400,
    yearsExperience: 20,
    videos: [
      { title: "Boxing Basics", url: "https://www.youtube.com/embed/dQw4w9WgXcQ", category: "training", duration: "13:00", views: 89200 },
      { title: "Heavy Bag Combos", url: "https://www.youtube.com/embed/dQw4w9WgXcQ", category: "training", duration: "7:15", views: 54300 },
      { title: "Fight Night Highlights", url: "https://www.youtube.com/embed/dQw4w9WgXcQ", category: "highlights", duration: "4:00", views: 112000 },
      { title: "Speed & Power Tips", url: "https://www.youtube.com/embed/dQw4w9WgXcQ", category: "tips", duration: "8:30", views: 67800 },
      { title: "Champ Talk Interview", url: "https://www.youtube.com/embed/dQw4w9WgXcQ", category: "interview", duration: "22:00", views: 15600 },
    ],
    reviews: [
      { name: "Derek F.", avatar: "D", rating: 5, text: "Marcus is the real deal. I went from zero to competing in 8 months.", date: "1 week ago" },
      { name: "Priya S.", avatar: "P", rating: 5, text: "Best workout of my life, every single time. Incredibly motivating.", date: "2 weeks ago" },
      { name: "Chris B.", avatar: "C", rating: 5, text: "Won my first amateur bout thanks to Marcus. Champion mindset indeed.", date: "1 month ago" },
    ],
  },
  {
    id: "6",
    name: "Lisa Andersson",
    tagline: "Swim Coach | Stroke Efficiency Expert",
    sport: "Swimming",
    location: "San Diego, CA",
    bio: "Olympic trials qualifier helping swimmers of all levels improve their strokes.",
    longBio: "Lisa competed at the Olympic trials in the 200m butterfly and has since dedicated her career to coaching. She works with competitive swimmers and triathletes, focusing on stroke efficiency and race strategy.",
    coachingStyle: "Methodical and encouraging. Breaks down complex mechanics into achievable steps.",
    idealFor: "Competitive swimmers and triathletes looking to shave time and improve efficiency.",
    specialties: ["Stroke Technique", "Race Strategy", "Endurance"],
    image: coach6,
    coverImage: coach6,
    price: 80,
    rating: 4.8,
    reviewCount: 98,
    followers: 4500,
    yearsExperience: 11,
    videos: [
      { title: "Freestyle Efficiency", url: "https://www.youtube.com/embed/dQw4w9WgXcQ", category: "training", duration: "10:00", views: 25400 },
      { title: "Flip Turn Technique", url: "https://www.youtube.com/embed/dQw4w9WgXcQ", category: "training", duration: "6:40", views: 18900 },
      { title: "Race Day Highlights", url: "https://www.youtube.com/embed/dQw4w9WgXcQ", category: "highlights", duration: "3:45", views: 31200 },
      { title: "Breathing Tips", url: "https://www.youtube.com/embed/dQw4w9WgXcQ", category: "tips", duration: "7:20", views: 42100 },
    ],
    reviews: [
      { name: "Emma T.", avatar: "E", rating: 5, text: "Dropped 3 seconds off my 200m after just 6 sessions with Lisa.", date: "2 weeks ago" },
      { name: "Ryan G.", avatar: "R", rating: 4, text: "Great attention to detail. Lisa sees things in my stroke nobody else caught.", date: "1 month ago" },
    ],
  },
];

export const sports = [...new Set(coaches.map((c) => c.sport))];
export const locations = [...new Set(coaches.map((c) => c.location))];
