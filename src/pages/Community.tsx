import { useState, useMemo } from "react";
import { Search, Users, Plus, Sparkles, Trophy, Flame } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useCommunity } from "@/hooks/use-community";
import type { CommunityInfo } from "@/hooks/use-community";
import { CommunityEmptyState } from "@/components/CommunityEmptyState";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

const SPORTS = [
  "All",
  "Padel",
  "Tennis",
  "Fitness",
  "Boxing",
  "Soccer",
  "Basketball",
  "Yoga",
  "Swimming",
  "Running",
  "MMA",
  "CrossFit",
  "Martial Arts",
];

const fmt = (n: number) =>
  n >= 1000 ? `${(n / 1000).toFixed(1).replace(/\.0$/, "")}K` : n.toString();

const cardVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.06, duration: 0.4, ease: "easeOut" as const },
  }),
};

const FeaturedCard = ({
  community,
  onClick,
  index,
}: {
  community: CommunityInfo;
  onClick: () => void;
  index: number;
}) => (
  <motion.div
    custom={index}
    variants={cardVariants}
    initial="hidden"
    animate="visible"
    className="min-w-[280px] md:min-w-0 snap-center"
  >
    <Card
      onClick={onClick}
      className="group relative overflow-hidden rounded-2xl border-border/20 cursor-pointer hover:shadow-elevated transition-all duration-300 hover:-translate-y-1 bg-card h-[220px]"
    >
      {/* Cover image */}
      <div className="absolute inset-0">
        {community.image ? (
          <img
            src={community.image}
            alt={community.coachName}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="h-full w-full bg-gradient-to-br from-[#1A1A2E] to-[#00D4AA]/30" />
        )}
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
      </div>

      {/* Content */}
      <div className="relative h-full flex flex-col justify-end p-5">
        <div className="flex items-center gap-2 mb-1.5">
          {community.isVerified && (
            <Badge className="bg-[#00D4AA]/20 text-[#00D4AA] border-[#00D4AA]/30 text-[10px] px-2 py-0 h-5">
              <Sparkles className="h-3 w-3 mr-1" />
              Verified
            </Badge>
          )}
          <Badge className="bg-white/10 text-white/90 border-white/20 text-[10px] px-2 py-0 h-5">
            {community.sport}
          </Badge>
        </div>
        <h3 className="text-lg font-bold text-white truncate">
          {community.coachName}
        </h3>
        {community.tagline && (
          <p className="text-xs text-white/60 truncate mt-0.5">
            {community.tagline}
          </p>
        )}
        <div className="flex items-center justify-between mt-3">
          <span className="flex items-center gap-1.5 text-xs text-white/70">
            <Users className="h-3.5 w-3.5" />
            {fmt(community.memberCount)} members
          </span>
          <Button
            size="sm"
            className="h-8 px-4 rounded-full bg-gradient-to-r from-[#00D4AA] to-[#00B894] text-white text-xs font-semibold shadow-lg hover:shadow-xl transition-all hover:scale-105"
            onClick={(e) => {
              e.stopPropagation();
              onClick();
            }}
          >
            <Plus className="h-3.5 w-3.5 mr-1" />
            Join
          </Button>
        </div>
      </div>
    </Card>
  </motion.div>
);

const CommunityCard = ({
  community,
  onClick,
  index,
}: {
  community: CommunityInfo;
  onClick: () => void;
  index: number;
}) => (
  <motion.div
    custom={index}
    variants={cardVariants}
    initial="hidden"
    animate="visible"
  >
    <Card
      onClick={onClick}
      className="group relative overflow-hidden rounded-2xl border-border/20 cursor-pointer hover:shadow-elevated transition-all duration-300 hover:-translate-y-1 bg-card"
    >
      {/* Cover */}
      <div className="relative h-36 overflow-hidden">
        {community.image ? (
          <img
            src={community.image}
            alt={community.coachName}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="h-full w-full bg-gradient-to-br from-[#1A1A2E] to-[#00D4AA]/20" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        <Badge className="absolute top-3 left-3 bg-black/40 backdrop-blur-sm text-white/90 border-white/10 text-[10px] px-2 py-0 h-5">
          {community.sport}
        </Badge>
        {community.isVerified && (
          <div className="absolute top-3 right-3 h-5 w-5 rounded-full bg-[#00D4AA]/90 flex items-center justify-center">
            <Sparkles className="h-3 w-3 text-white" />
          </div>
        )}
      </div>

      {/* Body */}
      <div className="p-4">
        <h3 className="font-bold text-foreground text-sm truncate group-hover:text-[#00D4AA] transition-colors">
          {community.coachName}
        </h3>
        {community.tagline && (
          <p className="text-xs text-muted-foreground truncate mt-0.5">
            {community.tagline}
          </p>
        )}
        <div className="flex items-center justify-between mt-3">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Users className="h-3.5 w-3.5" />
              {fmt(community.memberCount)}
            </span>
            {community.memberCount > 5 && (
              <span className="flex items-center gap-1 text-xs text-[#FF6B2C]">
                <Flame className="h-3.5 w-3.5" />
                Active
              </span>
            )}
          </div>
          <Button
            size="sm"
            className="h-8 px-3 rounded-full bg-gradient-to-r from-[#00D4AA] to-[#00B894] text-white text-xs font-semibold hover:scale-105 transition-transform"
            onClick={(e) => {
              e.stopPropagation();
              onClick();
            }}
          >
            <Plus className="h-3.5 w-3.5 mr-1" />
            Join
          </Button>
        </div>
      </div>
    </Card>
  </motion.div>
);

const Community = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeSport, setActiveSport] = useState("All");
  const { communities, loading } = useCommunity();
  const navigate = useNavigate();

  const filtered = useMemo(() => {
    if (!communities) return [];
    return communities.filter((c) => {
      const matchSearch =
        !searchQuery ||
        c.coachName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.sport.toLowerCase().includes(searchQuery.toLowerCase());
      const matchSport =
        activeSport === "All" ||
        c.sport.toLowerCase() === activeSport.toLowerCase();
      return matchSearch && matchSport;
    });
  }, [communities, searchQuery, activeSport]);

  const featured = useMemo(
    () => (communities || []).slice(0, 3),
    [communities]
  );

  const hasNone = !loading && (!communities || communities.length === 0);

  return (
    <div className="w-full pb-24 md:pb-10 max-w-6xl mx-auto">
      {/* Hero Section */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative overflow-hidden px-4 md:px-0 pt-8 pb-10 md:pt-12 md:pb-14"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-[#00D4AA]/5 via-transparent to-[#FF6B2C]/5 pointer-events-none" />
        <div className="relative max-w-2xl mx-auto text-center md:text-left">
          <div className="flex items-center justify-center md:justify-start gap-2 mb-3">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-[#00D4AA] to-[#00B894] flex items-center justify-center">
              <Trophy className="h-4 w-4 text-white" />
            </div>
            <span className="text-xs font-semibold uppercase tracking-widest text-[#00D4AA]">
              Communities
            </span>
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-foreground tracking-tight">
            Join the Circle
          </h1>
          <p className="mt-2 text-sm md:text-base text-muted-foreground max-w-md mx-auto md:mx-0">
            Connect with coaches and athletes who share your passion. Train together, grow together.
          </p>

          {/* Search */}
          <div className="relative mt-6 max-w-lg mx-auto md:mx-0">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50" />
            <input
              placeholder="Search by coach or sport..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-12 pl-11 pr-4 rounded-xl bg-card border border-border/30 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-[#00D4AA]/30 focus:border-[#00D4AA]/40 shadow-sm transition-all"
            />
          </div>
        </div>
      </motion.div>

      {hasNone ? (
        <div className="px-4 md:px-0">
          <CommunityEmptyState
            title="Be the first to create a community"
            description="No communities yet — start one and bring athletes together around your sport."
            actionLabel="Create Community"
          />
        </div>
      ) : (
        <>
          {/* Featured Communities */}
          {!loading && featured.length > 0 && (
            <div className="px-4 md:px-0 mb-10">
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="h-4 w-4 text-[#FF6B2C]" />
                <h2 className="text-lg font-bold text-foreground">Featured</h2>
              </div>
              <div className="flex gap-4 overflow-x-auto snap-x snap-mandatory pb-2 -mx-4 px-4 md:mx-0 md:px-0 md:grid md:grid-cols-3 md:overflow-visible scrollbar-hide">
                {featured.map((c, i) => (
                  <FeaturedCard
                    key={c.coachId}
                    community={c}
                    index={i}
                    onClick={() => navigate(`/community/${c.coachId}`)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Sport Filter Pills */}
          <div className="mb-8 px-4 md:px-0">
            <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 md:mx-0 md:px-0 scrollbar-hide">
              {SPORTS.map((sport) => (
                <button
                  key={sport}
                  onClick={() => setActiveSport(sport)}
                  className={`flex-shrink-0 px-4 py-2 rounded-full text-xs font-semibold transition-all duration-200 ${
                    activeSport === sport
                      ? "bg-gradient-to-r from-[#00D4AA] to-[#00B894] text-white shadow-md"
                      : "bg-card border border-border/30 text-muted-foreground hover:text-foreground hover:border-[#00D4AA]/30"
                  }`}
                >
                  {sport}
                </button>
              ))}
            </div>
          </div>

          {/* Community Grid */}
          <div className="px-4 md:px-0">
            <div className="flex items-center gap-2 mb-4">
              <Users className="h-4 w-4 text-muted-foreground" />
              <h2 className="text-lg font-bold text-foreground">
                Browse Communities
              </h2>
              {filtered.length > 0 && (
                <span className="text-xs text-muted-foreground ml-1">
                  ({filtered.length})
                </span>
              )}
            </div>

            {loading ? (
              <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div
                    key={i}
                    className="bg-card rounded-2xl border border-border/20 overflow-hidden animate-pulse"
                  >
                    <div className="h-36 bg-secondary" />
                    <div className="p-4 space-y-3">
                      <div className="h-4 bg-secondary rounded w-32" />
                      <div className="h-3 bg-secondary rounded w-24" />
                      <div className="flex justify-between">
                        <div className="h-3 bg-secondary rounded w-16" />
                        <div className="h-8 bg-secondary rounded-full w-20" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-16">
                <div className="h-12 w-12 rounded-full bg-muted mx-auto mb-3 flex items-center justify-center">
                  <Search className="h-5 w-5 text-muted-foreground" />
                </div>
                <p className="text-sm text-muted-foreground">
                  No communities found for "{searchQuery || activeSport}"
                </p>
              </div>
            ) : (
              <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                {filtered.map((community, i) => (
                  <CommunityCard
                    key={community.coachId}
                    community={community}
                    index={i}
                    onClick={() =>
                      navigate(`/community/${community.coachId}`)
                    }
                  />
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default Community;
