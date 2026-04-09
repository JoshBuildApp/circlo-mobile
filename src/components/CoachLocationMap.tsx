import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Navigation } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CoachLocationMapProps {
  location?: string;
  className?: string;
}

interface UserLocation {
  lat: number;
  lng: number;
}

export const CoachLocationMap: React.FC<CoachLocationMapProps> = ({
  location,
  className
}) => {
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [distance, setDistance] = useState<string>('');
  const [locationError, setLocationError] = useState<string>('');

  // Get user's location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
          console.warn('Location access denied:', error);
          setLocationError('Location access needed for distance calculation');
        }
      );
    }
  }, []);

  // Calculate distance when both locations are available
  useEffect(() => {
    if (userLocation && location) {
      // This would typically involve geocoding the location string to coordinates
      // For now, we'll show a placeholder
      setDistance('~15 km away');
    }
  }, [userLocation, location]);

  if (!location) {
    return null;
  }

  // Generate Google Maps Embed URL
  const mapUrl = `https://www.google.com/maps/embed/v1/place?key=${process.env.REACT_APP_GOOGLE_MAPS_API_KEY}&q=${encodeURIComponent(location)}&zoom=12`;

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardContent className="p-0">
        <div className="relative">
          {/* Map Embed */}
          <div className="h-48 bg-gray-100">
            {process.env.REACT_APP_GOOGLE_MAPS_API_KEY ? (
              <iframe
                src={mapUrl}
                className="w-full h-full border-0"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title={`Map showing ${location}`}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100">
                <div className="text-center">
                  <MapPin className="h-8 w-8 text-blue-500 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">Map view</p>
                </div>
              </div>
            )}
          </div>

          {/* Location Info Overlay */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4">
            <div className="flex items-center justify-between text-white">
              <div className="flex items-center space-x-2">
                <MapPin className="h-4 w-4" />
                <span className="text-sm font-medium">{location}</span>
              </div>
              
              {distance && (
                <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                  <Navigation className="h-3 w-3 mr-1" />
                  {distance}
                </Badge>
              )}
            </div>
          </div>
        </div>

        {locationError && (
          <div className="p-3 bg-amber-50 border-t">
            <p className="text-xs text-amber-700">{locationError}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};