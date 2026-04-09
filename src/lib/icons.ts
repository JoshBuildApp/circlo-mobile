// Optimized icon exports to enable tree-shaking
// Only import what you need

// Core navigation icons
export { 
  Home,
  Search,
  Calendar,
  MessageCircle,
  User,
  Settings,
  Menu,
  X,
  ArrowLeft,
  ArrowRight,
} from "lucide-react";

// Action icons - lazy loaded
export const ActionIcons = {
  Heart: () => import("lucide-react").then(mod => ({ default: mod.Heart })),
  Share: () => import("lucide-react").then(mod => ({ default: mod.Share })),
  Bookmark: () => import("lucide-react").then(mod => ({ default: mod.Bookmark })),
  MoreVertical: () => import("lucide-react").then(mod => ({ default: mod.MoreVertical })),
  Edit: () => import("lucide-react").then(mod => ({ default: mod.Edit })),
  Trash2: () => import("lucide-react").then(mod => ({ default: mod.Trash2 })),
  Eye: () => import("lucide-react").then(mod => ({ default: mod.Eye })),
  EyeOff: () => import("lucide-react").then(mod => ({ default: mod.EyeOff })),
};

// Media icons - lazy loaded
export const MediaIcons = {
  Play: () => import("lucide-react").then(mod => ({ default: mod.Play })),
  Pause: () => import("lucide-react").then(mod => ({ default: mod.Pause })),
  Volume2: () => import("lucide-react").then(mod => ({ default: mod.Volume2 })),
  VolumeX: () => import("lucide-react").then(mod => ({ default: mod.VolumeX })),
  Camera: () => import("lucide-react").then(mod => ({ default: mod.Camera })),
  Video: () => import("lucide-react").then(mod => ({ default: mod.Video })),
  Image: () => import("lucide-react").then(mod => ({ default: mod.Image })),
  Upload: () => import("lucide-react").then(mod => ({ default: mod.Upload })),
};

// Status icons - lazy loaded
export const StatusIcons = {
  Check: () => import("lucide-react").then(mod => ({ default: mod.Check })),
  CheckCircle: () => import("lucide-react").then(mod => ({ default: mod.CheckCircle })),
  AlertCircle: () => import("lucide-react").then(mod => ({ default: mod.AlertCircle })),
  AlertTriangle: () => import("lucide-react").then(mod => ({ default: mod.AlertTriangle })),
  Info: () => import("lucide-react").then(mod => ({ default: mod.Info })),
  Loader2: () => import("lucide-react").then(mod => ({ default: mod.Loader2 })),
};

// Communication icons - lazy loaded
export const CommunicationIcons = {
  Send: () => import("lucide-react").then(mod => ({ default: mod.Send })),
  Phone: () => import("lucide-react").then(mod => ({ default: mod.Phone })),
  Mail: () => import("lucide-react").then(mod => ({ default: mod.Mail })),
  Bell: () => import("lucide-react").then(mod => ({ default: mod.Bell })),
  BellOff: () => import("lucide-react").then(mod => ({ default: mod.BellOff })),
};

// Business icons - lazy loaded
export const BusinessIcons = {
  Star: () => import("lucide-react").then(mod => ({ default: mod.Star })),
  TrendingUp: () => import("lucide-react").then(mod => ({ default: mod.TrendingUp })),
  BarChart3: () => import("lucide-react").then(mod => ({ default: mod.BarChart3 })),
  DollarSign: () => import("lucide-react").then(mod => ({ default: mod.DollarSign })),
  Users: () => import("lucide-react").then(mod => ({ default: mod.Users })),
  Award: () => import("lucide-react").then(mod => ({ default: mod.Award })),
  Target: () => import("lucide-react").then(mod => ({ default: mod.Target })),
};