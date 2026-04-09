import React, { useState, useEffect } from 'react';
import { MapPin, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface LocationSuggestion {
  place_id: string;
  description: string;
  structured_formatting: {
    main_text: string;
    secondary_text: string;
  };
}

interface LocationInputProps {
  value?: {
    city: string;
    state: string;
    country: string;
    lat?: number;
    lng?: number;
  };
  onChange: (location: {
    city: string;
    state: string;
    country: string;
    lat?: number;
    lng?: number;
  } | null) => void;
  placeholder?: string;
  className?: string;
}

export const LocationInput: React.FC<LocationInputProps> = ({
  value,
  onChange,
  placeholder = "Enter city or location",
  className
}) => {
  const [input, setInput] = useState('');
  const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Update input when value changes
  useEffect(() => {
    if (value) {
      setInput(`${value.city}, ${value.state}`);
    } else {
      setInput('');
    }
  }, [value]);

  const searchLocations = async (query: string) => {
    if (query.length < 3) {
      setSuggestions([]);
      return;
    }

    setIsLoading(true);
    try {
      const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
      if (!apiKey) {
        console.warn('Google Maps API key not found');
        return;
      }

      const response = await fetch(
        `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(query)}&types=(cities)&key=${apiKey}`,
        {
          headers: {
            'Content-Type': 'application/json',
          }
        }
      );

      if (response.ok) {
        const data = await response.json();
        setSuggestions(data.predictions || []);
        setShowSuggestions(true);
      }
    } catch (error) {
      console.error('Error searching locations:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getPlaceDetails = async (placeId: string) => {
    try {
      const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
      if (!apiKey) return;

      const response = await fetch(
        `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=geometry,address_components&key=${apiKey}`
      );

      if (response.ok) {
        const data = await response.json();
        const result = data.result;
        
        if (result) {
          const addressComponents = result.address_components || [];
          let city = '';
          let state = '';
          let country = '';

          addressComponents.forEach((component: any) => {
            if (component.types.includes('locality') || component.types.includes('administrative_area_level_2')) {
              city = component.long_name;
            } else if (component.types.includes('administrative_area_level_1')) {
              state = component.short_name;
            } else if (component.types.includes('country')) {
              country = component.short_name;
            }
          });

          const location = {
            city,
            state,
            country,
            lat: result.geometry?.location?.lat,
            lng: result.geometry?.location?.lng
          };

          onChange(location);
        }
      }
    } catch (error) {
      console.error('Error getting place details:', error);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInput(newValue);
    
    if (!newValue.trim()) {
      onChange(null);
      setSuggestions([]);
      setShowSuggestions(false);
    } else {
      searchLocations(newValue);
    }
  };

  const handleSuggestionClick = (suggestion: LocationSuggestion) => {
    setInput(suggestion.description);
    setShowSuggestions(false);
    setSuggestions([]);
    getPlaceDetails(suggestion.place_id);
  };

  const handleInputBlur = () => {
    // Delay hiding suggestions to allow clicking
    setTimeout(() => setShowSuggestions(false), 200);
  };

  return (
    <div className={cn("relative", className)}>
      <div className="relative">
        <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder={placeholder}
          value={input}
          onChange={handleInputChange}
          onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
          onBlur={handleInputBlur}
          className="pl-10"
        />
        {isLoading && (
          <Loader2 className="absolute right-3 top-3 h-4 w-4 animate-spin text-muted-foreground" />
        )}
      </div>

      {showSuggestions && suggestions.length > 0 && (
        <Card className="absolute top-full left-0 right-0 z-50 mt-1">
          <CardContent className="p-0">
            {suggestions.map((suggestion) => (
              <Button
                key={suggestion.place_id}
                variant="ghost"
                className="w-full justify-start h-auto p-3 rounded-none border-0"
                onClick={() => handleSuggestionClick(suggestion)}
              >
                <div className="text-left">
                  <div className="font-medium text-sm">
                    {suggestion.structured_formatting.main_text}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {suggestion.structured_formatting.secondary_text}
                  </div>
                </div>
              </Button>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
};