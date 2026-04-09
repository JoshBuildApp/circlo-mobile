import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Star, MapPin, Clock, Users, Loader2 } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface BookingCoachCardProps {
  id: string;
  name: string;
  avatar?: string;
  rating: number;
  totalReviews: number;
  specialties: string[];
  location?: string;
  hourlyRate: number;
  availability?: string;
  totalClients?: number;
  responseTime?: string;
  isVerified?: boolean;
  onSelect: (coachId: string) => void;
  onViewProfile?: (coachId: string) => void;
  isSelected?: boolean;
}

export function BookingCoachCard({
  id,
  name,
  avatar,
  rating,
  totalReviews,
  specialties,
  location,
  hourlyRate,
  availability,
  totalClients,
  responseTime,
  isVerified = false,
  onSelect,
  onViewProfile,
  isSelected = false,
}: BookingCoachCardProps) {
  const [isSelectLoading, setIsSelectLoading] = useState(false);
  const [isProfileLoading, setIsProfileLoading] = useState(false);

  const handleSelect = async () => {
    if (!isSelectLoading) {
      setIsSelectLoading(true);
      try {
        await onSelect(id);
      } finally {
        setIsSelectLoading(false);
      }
    }
  };

  const handleViewProfile = async () => {
    if (onViewProfile && !isProfileLoading) {
      setIsProfileLoading(true);
      try {
        await onViewProfile(id);
      } finally {
        setIsProfileLoading(false);
      }
    }
  };

  return (
    <Card className={cn(
      "overflow-hidden transition-all duration-200 ease-out",
      "hover:shadow-lg hover:brightness-105 active:scale-[0.97]",
      "cursor-pointer group",
      isSelected && "ring-2 ring-blue-500 bg-blue-50"
    )}>
      <CardContent className="p-4">
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-start gap-3">
            <div className="relative">
              {avatar ? (
                <img
                  src={avatar}
                  alt={name}
                  className={cn(
                    "w-12 h-12 rounded-full object-cover transition-transform duration-200",
                    "group-hover:scale-105"
                  )}
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden'); }}
                />
              ) : null}
              <div className={cn(
                "w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-lg",
                avatar ? "hidden" : ""
              )}>
                {name?.charAt(0)?.toUpperCase() || '?'}
              </div>
              {isVerified && (
                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-blue-500 rounded-full border-2 border-white">
                  <div className="w-2 h-2 bg-white rounded-full m-auto mt-0.5" />
                </div>
              )}
            </div>
            <div className="flex-1">
              <h3 className={cn(
                "font-semibold text-gray-900 transition-colors duration-200",
                "group-hover:text-blue-600"
              )}>
                {name}
              </h3>
              <div className="flex items-center gap-1 text-sm text-gray-600">
                <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                <span>{rating.toFixed(1)}</span>
                <span>({totalReviews})</span>
              </div>
            </div>
            <div className="text-right">
              <div className="font-semibold text-gray-900">${hourlyRate}</div>
              <div className="text-sm text-gray-500">per hour</div>
            </div>
          </div>

          {/* Location and availability */}
          <div className="space-y-2">
            {location && (
              <div className="flex items-center gap-1 text-sm text-gray-600">
                <MapPin className="w-4 h-4" />
                <span>{location}</span>
              </div>
            )}
            {availability && (
              <div className="text-sm text-green-600 font-medium">
                {availability}
              </div>
            )}
          </div>

          {/* Stats */}
          <div className="flex gap-4 text-sm text-gray-600">
            {totalClients && (
              <div className="flex items-center gap-1">
                <Users className="w-4 h-4" />
                <span>{totalClients} clients</span>
              </div>
            )}
            {responseTime && (
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                <span>{responseTime}</span>
              </div>
            )}
          </div>

          {/* Specialties */}
          <div className="flex flex-wrap gap-1">
            {specialties.slice(0, 3).map((specialty) => (
              <Badge
                key={specialty}
                variant="secondary"
                className={cn(
                  "text-xs transition-colors duration-200",
                  "hover:bg-blue-100 hover:text-blue-700"
                )}
              >
                {specialty}
              </Badge>
            ))}
            {specialties.length > 3 && (
              <Badge variant="secondary" className="text-xs">
                +{specialties.length - 3}
              </Badge>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            {onViewProfile && (
              <Button
                variant="outline"
                size="sm"
                className={cn(
                  "flex-1 transition-all duration-200",
                  "hover:bg-gray-50 hover:brightness-105 active:scale-[0.97]"
                )}
                onClick={handleViewProfile}
                disabled={isProfileLoading}
              >
                {isProfileLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                    Loading...
                  </>
                ) : (
                  "View Profile"
                )}
              </Button>
            )}
            <Button
              size="sm"
              className={cn(
                "flex-1 transition-all duration-200",
                "hover:brightness-110 active:scale-[0.97]",
                isSelected && "bg-blue-600 hover:bg-blue-700"
              )}
              onClick={handleSelect}
              disabled={isSelectLoading}
            >
              {isSelectLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                  Selecting...
                </>
              ) : isSelected ? (
                "Selected"
              ) : (
                "Select Coach"
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}