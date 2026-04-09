import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';
import { NotificationBatch } from '@/types/notifications';
import { Heart, MessageCircle, UserPlus, Calendar, Mail } from 'lucide-react';

interface NotificationDigestCardProps {
  batch: NotificationBatch;
  onClick?: () => void;
}

export const NotificationDigestCard = ({ batch, onClick }: NotificationDigestCardProps) => {
  const getIcon = () => {
    switch (batch.type) {
      case 'like':
        return <Heart className="h-4 w-4 text-red-500" />;
      case 'comment':
        return <MessageCircle className="h-4 w-4 text-blue-500" />;
      case 'follow':
        return <UserPlus className="h-4 w-4 text-green-500" />;
      case 'booking':
        return <Calendar className="h-4 w-4 text-purple-500" />;
      case 'message':
        return <Mail className="h-4 w-4 text-orange-500" />;
      default:
        return null;
    }
  };

  const getActionText = () => {
    const actorCount = batch.actors.length;
    const actionMap = {
      like: actorCount === 1 ? 'liked' : 'people liked',
      comment: actorCount === 1 ? 'commented on' : 'people commented on',
      follow: actorCount === 1 ? 'started following you' : 'people started following you',
      booking: actorCount === 1 ? 'booked a session' : 'people booked sessions',
      message: actorCount === 1 ? 'sent you a message' : 'people sent you messages'
    };
    
    return actionMap[batch.type] || 'interacted';
  };

  const renderActors = () => {
    const { actors } = batch;
    const displayCount = Math.min(actors.length, 3);
    const remainingCount = actors.length - displayCount;

    return (
      <div className="flex items-center gap-1">
        <div className="flex -space-x-2">
          {actors.slice(0, displayCount).map((actor, index) => (
            <Avatar key={actor.id} className="h-6 w-6 border-2 border-background">
              <AvatarImage src={actor.avatar} alt={actor.name} />
              <AvatarFallback className="text-xs">
                {actor.name.charAt(0)}
              </AvatarFallback>
            </Avatar>
          ))}
        </div>
        
        {remainingCount > 0 && (
          <Badge variant="secondary" className="text-xs ml-2">
            +{remainingCount}
          </Badge>
        )}
      </div>
    );
  };

  const getDescription = () => {
    const actorCount = batch.actors.length;
    
    if (actorCount === 1) {
      return `${batch.actors[0].name} ${getActionText()}${batch.target_title ? ` "${batch.target_title}"` : ''}`;
    } else if (actorCount === 2) {
      return `${batch.actors[0].name} and ${batch.actors[1].name} ${getActionText()}${batch.target_title ? ` "${batch.target_title}"` : ''}`;
    } else {
      return `${batch.actors[0].name} and ${actorCount - 1} others ${getActionText()}${batch.target_title ? ` "${batch.target_title}"` : ''}`;
    }
  };

  return (
    <Card 
      className="cursor-pointer hover:bg-accent/50 transition-colors"
      onClick={onClick}
    >
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          {getIcon()}
          <span className="flex-1">{getDescription()}</span>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="pt-0">
        <div className="flex items-center justify-between">
          {renderActors()}
          <span className="text-xs text-muted-foreground">
            {formatDistanceToNow(new Date(batch.updated_at), { addSuffix: true })}
          </span>
        </div>
      </CardContent>
    </Card>
  );
};