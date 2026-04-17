import React, { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Play, Pause, Download, Image as ImageIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { openExternal } from '@/lib/platform';

interface ChatMessageProps {
  id: string;
  content: string;
  sender_id: string;
  created_at: string;
  sender_name?: string;
  sender_avatar?: string;
  is_own_message?: boolean;
  message_type?: 'text' | 'image' | 'voice';
  file_url?: string;
}

export const ChatMessage = ({
  content,
  sender_id,
  created_at,
  sender_name = 'User',
  sender_avatar,
  is_own_message = false,
  message_type = 'text',
  file_url
}: ChatMessageProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);

  const handlePlayVoice = () => {
    if (!file_url) return;

    if (audioElement) {
      if (isPlaying) {
        audioElement.pause();
        setIsPlaying(false);
      } else {
        audioElement.play();
        setIsPlaying(true);
      }
    } else {
      const audio = new Audio(file_url);
      audio.onended = () => setIsPlaying(false);
      audio.onpause = () => setIsPlaying(false);
      audio.onplay = () => setIsPlaying(true);
      audio.onerror = () => {
        console.error('Error playing audio');
        setIsPlaying(false);
      };
      
      setAudioElement(audio);
      audio.play();
      setIsPlaying(true);
    }
  };

  const handleDownloadVoice = () => {
    if (file_url) {
      const link = document.createElement('a');
      link.href = file_url;
      link.download = `voice_message_${Date.now()}.wav`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const renderMessageContent = () => {
    switch (message_type) {
      case 'image':
        return (
          <div className="relative max-w-xs">
            {imageLoading && !imageError && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded-lg">
                <ImageIcon className="h-8 w-8 text-gray-400 animate-pulse" />
              </div>
            )}
            {imageError ? (
              <div className="flex items-center justify-center bg-gray-100 rounded-lg p-8">
                <ImageIcon className="h-8 w-8 text-gray-400" />
                <span className="ml-2 text-sm text-gray-500">Image unavailable</span>
              </div>
            ) : (
              <img
                src={file_url}
                alt="Shared image"
                className={cn(
                  "rounded-lg max-w-full h-auto cursor-pointer transition-opacity",
                  imageLoading && "opacity-0"
                )}
                onLoad={() => setImageLoading(false)}
                onError={() => {
                  setImageLoading(false);
                  setImageError(true);
                }}
                onClick={() => openExternal(file_url)}
              />
            )}
            {content && (
              <p className="mt-2 text-sm">{content}</p>
            )}
          </div>
        );

      case 'voice':
        return (
          <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-3 max-w-xs">
            <Button
              size="sm"
              variant="ghost"
              className="p-1 h-8 w-8"
              onClick={handlePlayVoice}
            >
              {isPlaying ? (
                <Pause className="h-4 w-4" />
              ) : (
                <Play className="h-4 w-4" />
              )}
            </Button>
            <div className="flex-1">
              <div className="flex items-center gap-1">
                {[...Array(20)].map((_, i) => (
                  <div
                    key={i}
                    className={cn(
                      "w-1 bg-blue-500 rounded-full transition-all",
                      isPlaying ? "h-4 animate-pulse" : "h-2"
                    )}
                  />
                ))}
              </div>
            </div>
            <Button
              size="sm"
              variant="ghost"
              className="p-1 h-8 w-8"
              onClick={handleDownloadVoice}
            >
              <Download className="h-3 w-3" />
            </Button>
          </div>
        );

      default:
        return <p className="text-sm">{content}</p>;
    }
  };

  return (
    <div className={cn(
      "flex gap-3 mb-4",
      is_own_message && "flex-row-reverse"
    )}>
      <Avatar className="h-8 w-8 shrink-0">
        <AvatarImage src={sender_avatar} />
        <AvatarFallback className="text-xs">
          {sender_name.charAt(0).toUpperCase()}
        </AvatarFallback>
      </Avatar>
      
      <div className={cn(
        "flex flex-col max-w-[70%]",
        is_own_message && "items-end"
      )}>
        <div className={cn(
          "rounded-lg px-3 py-2",
          is_own_message 
            ? "bg-blue-500 text-white" 
            : "bg-gray-100 text-gray-900"
        )}>
          {renderMessageContent()}
        </div>
        
        <span className="text-xs text-gray-500 mt-1 px-1">
          {formatDistanceToNow(new Date(created_at), { addSuffix: true })}
        </span>
      </div>
    </div>
  );
};