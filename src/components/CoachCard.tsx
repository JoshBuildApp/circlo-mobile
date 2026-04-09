import { useState } from "react";
import { Heart, MapPin, Star, Clock, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { useFollow } from "@/hooks/use-follow";
import { CoachResponseBadge } from "./CoachResponseBadge";

interface CoachCardProps {
  id: string;
  name: string;
  avatar?: string;
  specialties: string[];
  rating?: number;
  reviewCount?: number;
  location?: string;
  isFollowing?: boolean;
  hourlyRate?: number;
  isVerified?: boolean;
  onBookingClick?: () => void;
}

export const CoachCard = ({
  id,
  name,
  avatar,
  specialties = [],
  rating,
  reviewCount,
  location,
  isFollowing: initialIsFollowing = false,
  hourlyRate,
  isVerified = false,
  onBookingClick,
}: CoachCardProps) => {
  const [isLiked, setIsLiked] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { following: isFollowing, toggleFollow, loading: isFollowLoading } = useFollow(id);

  const handleLike = () => {
    setIsLiked(!isLiked);
    toast({
      description: isLiked ? "Removed from favorites" : "Added to favorites",
    });
  };

  const handleFollow = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await toggleFollow();
  };

  const handleCardClick = () => {
    navigate(`/coach/${id}`);
  };

  const handleBookingClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onBookingClick) {
      onBookingClick();
    } else {
      navigate(`/book/${id}`);
    }
  };

  return (
    <Card className="group cursor-pointer transition-all duration-200 hover:shadow-md border-gray-200" aria-label={`Coach ${name}`}>
      <CardContent className="p-4" onClick={handleCardClick}>
        <div className="flex items-start gap-3">
          <div className="relative">
            <Avatar className="h-12 w-12">
              <AvatarImage src={avatar} alt={name} />
              <AvatarFallback>{name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
            </Avatar>
            {isVerified && (
              <div className="absolute -top-1 -right-1 bg-blue-500 rounded-full p-1">
                <div className="w-2 h-2 bg-white rounded-full" />
              </div>
            )}
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <h3 className="font-medium text-gray-900 truncate">{name}</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  handleLike();
                }}
                className="p-1 h-auto"
                aria-label={isLiked ? "Remove from favorites" : "Add to favorites"}
              >
                <Heart 
                  className={`h-4 w-4 ${isLiked ? 'fill-red-500 text-red-500' : 'text-gray-400'}`} 
                />
              </Button>
            </div>
            
            {location && (
              <div className="flex items-center gap-1 mt-1">
                <MapPin className="h-3 w-3 text-gray-400" />
                <span className="text-sm text-gray-500 truncate">{location}</span>
              </div>
            )}
            
            {rating && (
              <div className="flex items-center gap-1 mt-1">
                <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                <span className="text-sm text-gray-900">{rating.toFixed(1)}</span>
                {reviewCount && (
                  <span className="text-sm text-gray-500">({reviewCount})</span>
                )}
              </div>
            )}
            
            <div className="flex flex-wrap gap-1 mt-2">
              {specialties.slice(0, 2).map((specialty, index) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  {specialty}
                </Badge>
              ))}
              {specialties.length > 2 && (
                <Badge variant="outline" className="text-xs">
                  +{specialties.length - 2} more
                </Badge>
              )}
            </div>

            {/* Response time badge */}
            <div className="mt-2">
              <CoachResponseBadge coachId={id} />
            </div>
            
            <div className="flex items-center justify-between mt-3">
              {hourlyRate && (
                <span className="text-sm font-medium text-gray-900">
                  ${hourlyRate}/hr
                </span>
              )}
              
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleFollow}
                  disabled={isFollowLoading}
                  className="text-xs"
                >
                  {isFollowing ? 'Following' : 'Follow'}
                </Button>
                <Button 
                  size="sm" 
                  onClick={handleBookingClick}
                  className="text-xs"
                >
                  Book
                </Button>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};