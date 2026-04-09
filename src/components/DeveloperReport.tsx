import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { 
  Code, 
  Database, 
  Layers, 
  Users, 
  Calendar, 
  MessageSquare, 
  Video,
  BookOpen,
  Settings,
  Zap,
  Shield,
  Activity,
  TrendingUp,
  Heart,
  Star,
  ChevronDown,
  ChevronRight
} from "lucide-react";
import { cn } from "@/lib/utils";

interface DeveloperReportProps {
  userId: string;
}

interface ComponentInfo {
  name: string;
  category: string;
  description: string;
  features: string[];
  icon: any;
}

interface HookInfo {
  name: string;
  category: string;
  description: string;
  features: string[];
}

interface PageInfo {
  name: string;
  route: string;
  description: string;
  features: string[];
}

export function DeveloperReport({ userId }: DeveloperReportProps) {
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});
  
  // Only show for dev user
  if (userId !== "dev-user-id") {
    return null;
  }

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const components: ComponentInfo[] = [
    {
      name: "ActiveIndicator",
      category: "UI",
      description: "Shows online/offline status of users",
      features: ["Real-time status", "Visual indicators", "Presence tracking"],
      icon: Activity
    },
    {
      name: "AdminContentPanel",
      category: "Admin",
      description: "Content management for administrators",
      features: ["Content moderation", "Bulk actions", "Analytics"],
      icon: Shield
    },
    {
      name: "AdminUserManager",
      category: "Admin",
      description: "User management dashboard",
      features: ["User CRUD", "Role management", "Suspension controls"],
      icon: Users
    },
    {
      name: "AdminVerificationInbox",
      category: "Admin",
      description: "Coach verification workflow",
      features: ["Document review", "Approval process", "Notification system"],
      icon: Shield
    },
    {
      name: "AppShell",
      category: "Layout",
      description: "Main application layout wrapper",
      features: ["Responsive design", "Navigation", "Global state"],
      icon: Layers
    },
    {
      name: "AvailabilityCalendar",
      category: "Booking",
      description: "Coach availability management",
      features: ["Time slot selection", "Recurring availability", "Timezone support"],
      icon: Calendar
    },
    {
      name: "BobInsights",
      category: "Analytics",
      description: "AI-powered insights dashboard",
      features: ["Performance metrics", "Trend analysis", "Recommendations"],
      icon: TrendingUp
    },
    {
      name: "BookingCalendar",
      category: "Booking",
      description: "Session booking interface",
      features: ["Real-time availability", "Conflict prevention", "Multi-timezone"],
      icon: Calendar
    },
    {
      name: "BookingCoachCard",
      category: "Booking",
      description: "Coach profile card for bookings",
      features: ["Coach info", "Ratings", "Quick booking"],
      icon: Users
    },
    {
      name: "BookingModal",
      category: "Booking",
      description: "Session booking workflow",
      features: ["Date/time selection", "Payment integration", "Confirmation"],
      icon: Calendar
    },
    {
      name: "CoachCard",
      category: "Discovery",
      description: "Coach profile display card",
      features: ["Profile info", "Ratings", "Specializations"],
      icon: Users
    },
    {
      name: "CoachCommunity",
      category: "Community",
      description: "Coach-specific community features",
      features: ["Group discussions", "Resource sharing", "Networking"],
      icon: Users
    },
    {
      name: "CoachInsights",
      category: "Analytics",
      description: "Coach performance dashboard",
      features: ["Session analytics", "Client progress", "Revenue tracking"],
      icon: TrendingUp
    },
    {
      name: "CoachSessions",
      category: "Coaching",
      description: "Session management interface",
      features: ["Session scheduling", "Progress tracking", "Notes"],
      icon: BookOpen
    }
  ];

  const hooks: HookInfo[] = [
    {
      name: "use-activity",
      category: "Social",
      description: "User activity tracking and management",
      features: ["Activity logging", "Timeline generation", "Real-time updates"]
    },
    {
      name: "use-availability",
      category: "Booking",
      description: "Coach availability management",
      features: ["Time slot management", "Recurring schedules", "Conflict detection"]
    },
    {
      name: "use-booking-conflict-prevention",
      category: "Booking",
      description: "Prevents double bookings and conflicts",
      features: ["Real-time validation", "Overlap detection", "Auto-resolution"]
    },
    {
      name: "use-booking-participants",
      category: "Booking",
      description: "Manages session participants",
      features: ["Participant tracking", "Group limits", "Waitlist management"]
    },
    {
      name: "use-booking-requests",
      category: "Booking",
      description: "Handles booking request lifecycle",
      features: ["Request creation", "Approval workflow", "Status tracking"]
    },
    {
      name: "use-booking-toast",
      category: "UI",
      description: "Booking-specific notification system",
      features: ["Success messages", "Error handling", "Progress indicators"]
    },
    {
      name: "use-challenges",
      category: "Gamification",
      description: "User challenges and achievements",
      features: ["Challenge creation", "Progress tracking", "Rewards system"]
    },
    {
      name: "use-coach-posts",
      category: "Content",
      description: "Coach content management",
      features: ["Post creation", "Media handling", "Engagement tracking"]
    },
    {
      name: "use-coach-reviews",
      category: "Reviews",
      description: "Coach rating and review system",
      features: ["Review collection", "Rating aggregation", "Sentiment analysis"]
    },
    {
      name: "use-coach-videos",
      category: "Content",
      description: "Video content management for coaches",
      features: ["Video upload", "Transcoding", "Analytics"]
    },
    {
      name: "use-community",
      category: "Social",
      description: "Community features and interactions",
      features: ["Group management", "Discussions", "Moderation"]
    },
    {
      name: "use-feed",
      category: "Content",
      description: "Social feed management",
      features: ["Content aggregation", "Personalization", "Real-time updates"]
    },
    {
      name: "use-follow",
      category: "Social",
      description: "User following system",
      features: ["Follow/unfollow", "Privacy controls", "Recommendations"]
    },
    {
      name: "use-follower-counts",
      category: "Social",
      description: "Real-time follower statistics",
      features: ["Count tracking", "Growth metrics", "Trend analysis"]
    },
    {
      name: "use-group-booking",
      category: "Booking",
      description: "Group session booking management",
      features: ["Multi-participant", "Capacity management", "Group pricing"]
    },
    {
      name: "use-group-pricing",
      category: "Pricing",
      description: "Dynamic group pricing system",
      features: ["Tiered pricing", "Discounts", "Revenue optimization"]
    },
    {
      name: "use-home-data",
      category: "Data",
      description: "Home page data aggregation",
      features: ["Personalized content", "Performance optimization", "Caching"]
    },
    {
      name: "use-messages",
      category: "Communication",
      description: "Real-time messaging system",
      features: ["Chat functionality", "File sharing", "Message history"]
    },
    {
      name: "use-mobile",
      category: "UI",
      description: "Mobile responsiveness utilities",
      features: ["Breakpoint detection", "Touch interactions", "Mobile-first design"]
    },
    {
      name: "use-notifications",
      category: "Communication",
      description: "Push notification management",
      features: ["Real-time alerts", "Preference management", "Multi-channel"]
    },
    {
      name: "use-online-status",
      category: "Social",
      description: "User presence tracking",
      features: ["Online indicators", "Last seen", "Activity status"]
    },
    {
      name: "use-page-sections",
      category: "UI",
      description: "Dynamic page section management",
      features: ["Section configuration", "Personalization", "A/B testing"]
    },
    {
      name: "use-products",
      category: "Commerce",
      description: "Product catalog management",
      features: ["Product listings", "Inventory", "Pricing"]
    },
    {
      name: "use-saved-items",
      category: "Content",
      description: "User bookmarking system",
      features: ["Save/unsave", "Collections", "Search"]
    },
    {
      name: "use-smart-availability-sync",
      category: "Booking",
      description: "Intelligent availability synchronization",
      features: ["Calendar integration", "Conflict resolution", "Auto-updates"]
    },
    {
      name: "use-smart-feed",
      category: "AI",
      description: "AI-powered content recommendation",
      features: ["Machine learning", "Personalization", "Engagement optimization"]
    },
    {
      name: "use-stories",
      category: "Content",
      description: "Story feature implementation",
      features: ["Story creation", "Viewing analytics", "Auto-expiration"]
    },
    {
      name: "use-trainee-progress",
      category: "Training",
      description: "Trainee progress tracking",
      features: ["Milestone tracking", "Progress visualization", "Goal setting"]
    },
    {
      name: "use-training-sessions",
      category: "Training",
      description: "Training session management",
      features: ["Session planning", "Resource allocation", "Feedback collection"]
    },
    {
      name: "use-training-templates",
      category: "Training",
      description: "Reusable training templates",
      features: ["Template library", "Customization", "Version control"]
    },
    {
      name: "use-trending",
      category: "Discovery",
      description: "Trending content identification",
      features: ["Trend analysis", "Hot topics", "Viral content detection"]
    }
  ];

  const pages: PageInfo[] = [
    {
      name: "AdminDashboard",
      route: "/admin",
      description: "Administrative control center",
      features: ["User management", "Content moderation", "System analytics", "Platform controls"]
    },
    {
      name: "Book",
      route: "/book",
      description: "Session booking interface",
      features: ["Coach selection", "Time booking", "Payment processing", "Confirmation"]
    },
    {
      name: "Bookings",
      route: "/bookings",
      description: "User booking management",
      features: ["Booking history", "Cancellation", "Rescheduling", "Reviews"]
    },
    {
      name: "Chat",
      route: "/chat",
      description: "Real-time messaging",
      features: ["Direct messaging", "Group chats", "File sharing", "Video calls"]
    },
    {
      name: "CircloPro",
      route: "/pro",
      description: "Premium subscription features",
      features: ["Advanced analytics", "Priority support", "Exclusive content", "Enhanced tools"]
    },
    {
      name: "CoachCommunityPage",
      route: "/coach-community",
      description: "Coach networking platform",
      features: ["Coach discussions", "Resource sharing", "Mentorship", "Best practices"]
    },
    {
      name: "CoachDashboard",
      route: "/coach/dashboard",
      description: "Coach management interface",
      features: ["Session management", "Client tracking", "Revenue analytics", "Schedule management"]
    },
    {
      name: "CoachProfile",
      route: "/coach/profile",
      description: "Coach profile management",
      features: ["Profile editing", "Specialization tags", "Portfolio", "Availability settings"]
    },
    {
      name: "Community",
      route: "/community",
      description: "Social community features",
      features: ["Group discussions", "Events", "User connections", "Content sharing"]
    },
    {
      name: "CreateContent",
      route: "/create",
      description: "Content creation tools",
      features: ["Post creation", "Media upload", "Scheduling", "Analytics"]
    },
    {
      name: "Discover",
      route: "/discover",
      description: "Content and coach discovery",
      features: ["Personalized recommendations", "Search filters", "Trending content", "Categories"]
    },
    {
      name: "EditProfile",
      route: "/profile/edit",
      description: "User profile editing",
      features: ["Personal info", "Privacy settings", "Preferences", "Account management"]
    },
    {
      name: "Feed",
      route: "/feed",
      description: "Social media feed",
      features: ["Personalized content", "Interactions", "Real-time updates", "Content filtering"]
    },
    {
      name: "Following",
      route: "/following",
      description: "Following management",
      features: ["Following list", "Suggestions", "Activity feed", "Relationship management"]
    },
    {
      name: "Inbox",
      route: "/inbox",
      description: "Message inbox",
      features: ["Message threads", "Notifications", "Search", "Archive"]
    },
    {
      name: "JoinGroup",
      route: "/join-group",
      description: "Group joining interface",
      features: ["Group discovery", "Join requests", "Group info", "Member preview"]
    },
    {
      name: "MySchedule",
      route: "/schedule",
      description: "Personal schedule management",
      features: ["Calendar view", "Session planning", "Reminders", "Conflict detection"]
    },
    {
      name: "Plays",
      route: "/plays",
      description: "Training plays and strategies",
      features: ["Play library", "Custom plays", "Sharing", "Categories"]
    },
    {
      name: "Reels",
      route: "/reels",
      description: "Short-form video content",
      features: ["Video feed", "Creation tools", "Interactions", "Trending"]
    },
    {
      name: "SavedCollections",
      route: "/saved",
      description: "Saved content management",
      features: ["Collections", "Bookmarks", "Organization", "Search"]
    },
    {
      name: "UserProfile",
      route: "/profile/:id",
      description: "User profile viewing",
      features: ["Profile display", "Content feed", "Interactions", "Follow/unfollow"]
    }
  ];

  const stats = {
    totalComponents: components.length,
    totalHooks: hooks.length,
    totalPages: pages.length,
    totalFeatures: components.reduce((acc, comp) => acc + comp.features.length, 0) +
                  hooks.reduce((acc, hook) => acc + hook.features.length, 0) +
                  pages.reduce((acc, page) => acc + page.features.length, 0)
  };

  const ComponentCard = ({ component }: { component: ComponentInfo }) => {
    const Icon = component.icon;
    const isExpanded = expandedSections[`component-${component.name}`];
    
    return (
      <Card className="mb-4">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Icon className="h-5 w-5 text-primary" />
              <div>
                <CardTitle className="text-lg">{component.name}</CardTitle>
                <Badge variant="secondary" className="mt-1">
                  {component.category}
                </Badge>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => toggleSection(`component-${component.name}`)}
            >
              {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </Button>
          </div>
        </CardHeader>
        {isExpanded && (
          <CardContent className="pt-0">
            <p className="text-muted-foreground mb-3">{component.description}</p>
            <div className="space-y-1">
              <h4 className="font-medium text-sm">Features:</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                {component.features.map((feature, idx) => (
                  <li key={idx} className="flex items-center gap-2">
                    <div className="h-1 w-1 bg-primary rounded-full" />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
          </CardContent>
        )}
      </Card>
    );
  };

  const HookCard = ({ hook }: { hook: HookInfo }) => {
    const isExpanded = expandedSections[`hook-${hook.name}`];
    
    return (
      <Card className="mb-4">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg font-mono">{hook.name}</CardTitle>
              <Badge variant="outline" className="mt-1">
                {hook.category}
              </Badge>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => toggleSection(`hook-${hook.name}`)}
            >
              {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </Button>
          </div>
        </CardHeader>
        {isExpanded && (
          <CardContent className="pt-0">
            <p className="text-muted-foreground mb-3">{hook.description}</p>
            <div className="space-y-1">
              <h4 className="font-medium text-sm">Capabilities:</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                {hook.features.map((feature, idx) => (
                  <li key={idx} className="flex items-center gap-2">
                    <Zap className="h-3 w-3 text-yellow-500" />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
          </CardContent>
        )}
      </Card>
    );
  };

  const PageCard = ({ page }: { page: PageInfo }) => {
    const isExpanded = expandedSections[`page-${page.name}`];
    
    return (
      <Card className="mb-4">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">{page.name}</CardTitle>
              <Badge variant="default" className="mt-1 font-mono text-xs">
                {page.route}
              </Badge>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => toggleSection(`page-${page.name}`)}
            >
              {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </Button>
          </div>
        </CardHeader>
        {isExpanded && (
          <CardContent className="pt-0">
            <p className="text-muted-foreground mb-3">{page.description}</p>
            <div className="space-y-1">
              <h4 className="font-medium text-sm">Key Features:</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                {page.features.map((feature, idx) => (
                  <li key={idx} className="flex items-center gap-2">
                    <Star className="h-3 w-3 text-blue-500" />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
          </CardContent>
        )}
      </Card>
    );
  };

  return (
    <div className="fixed inset-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-50">
      <div className="container mx-auto py-6 h-full">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-primary">Circlo Platform Developer Report</h1>
            <p className="text-muted-foreground">Comprehensive overview of platform development</p>
          </div>
          <Button
            variant="outline"
            onClick={() => window.location.reload()}
            className="gap-2"
          >
            <Code className="h-4 w-4" />
            Close Report
          </Button>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-primary">{stats.totalComponents}</div>
              <div className="text-sm text-muted-foreground">Components</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-green-600">{stats.totalHooks}</div>
              <div className="text-sm text-muted-foreground">Custom Hooks</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">{stats.totalPages}</div>
              <div className="text-sm text-muted-foreground">Pages</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-purple-600">{stats.totalFeatures}</div>
              <div className="text-sm text-muted-foreground">Features</div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="components" className="h-[calc(100vh-200px)]">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="components">Components</TabsTrigger>
            <TabsTrigger value="hooks">Custom Hooks</TabsTrigger>
            <TabsTrigger value="pages">Pages</TabsTrigger>
          </TabsList>

          <TabsContent value="components" className="h-full mt-4">
            <ScrollArea className="h-full pr-4">
              <div className="space-y-4">
                {components.map((component) => (
                  <ComponentCard key={component.name} component={component} />
                ))}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="hooks" className="h-full mt-4">
            <ScrollArea className="h-full pr-4">
              <div className="space-y-4">
                {hooks.map((hook) => (
                  <HookCard key={hook.name} hook={hook} />
                ))}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="pages" className="h-full mt-4">
            <ScrollArea className="h-full pr-4">
              <div className="space-y-4">
                {pages.map((page) => (
                  <PageCard key={page.name} page={page} />
                ))}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}