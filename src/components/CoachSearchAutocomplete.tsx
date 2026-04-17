import { useState, useRef, useEffect, useCallback } from 'react';
import { Search, User, Star, MapPin, X, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { resolveCoachImage } from '@/lib/coach-placeholders';

interface CoachSearchResult {
  id: string;
  coach_name: string;
  sport: string;
  image_url: string | null;
  rating: number | null;
  location: string | null;
  is_verified: boolean;
  is_pro: boolean;
  similarity_score: number;
}

interface CoachSearchAutocompleteProps {
  placeholder?: string;
  className?: string;
  onCoachSelect?: (coachId: string) => void;
  onSearchSubmit?: (query: string) => void;
  onFocusChange?: (focused: boolean) => void;
  compact?: boolean;
}

export function CoachSearchAutocomplete({
  placeholder = "Search coaches, sports...",
  className,
  onCoachSelect,
  onSearchSubmit,
  onFocusChange,
  compact = false,
}: CoachSearchAutocompleteProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<CoachSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();
  const navigate = useNavigate();

  const searchCoaches = useCallback(async (term: string) => {
    if (term.length < 2) {
      setResults([]);
      return;
    }

    setLoading(true);
    const { data, error } = await (supabase as any)
      .rpc("search_coaches", { search_term: term.trim() });

    if (!error && data) {
      const filtered = (data as CoachSearchResult[])
        .filter((c) => !(c as any).is_fake)
        .slice(0, 8);
      setResults(filtered);
    } else {
      setResults([]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    clearTimeout(debounceRef.current);
    if (searchQuery.length >= 2) {
      debounceRef.current = setTimeout(() => {
        searchCoaches(searchQuery);
      }, 200);
    } else {
      setResults([]);
    }
    return () => clearTimeout(debounceRef.current);
  }, [searchQuery, searchCoaches]);

  useEffect(() => {
    setIsOpen(results.length > 0 || (loading && searchQuery.length >= 2));
    if (results.length === 0) setFocusedIndex(-1);
  }, [results, loading, searchQuery]);

  const handleCoachSelect = (coach: CoachSearchResult) => {
    if (onCoachSelect) {
      onCoachSelect(coach.id);
    } else {
      navigate(`/coach/${coach.id}`);
    }
    setSearchQuery('');
    setResults([]);
    setIsOpen(false);
    inputRef.current?.blur();
  };

  const handleSubmit = () => {
    if (searchQuery.trim()) {
      if (onSearchSubmit) {
        onSearchSubmit(searchQuery.trim());
      } else {
        navigate(`/discover?q=${encodeURIComponent(searchQuery.trim())}`);
      }
      setIsOpen(false);
      inputRef.current?.blur();
    }
  };

  const handleClear = () => {
    setSearchQuery('');
    setResults([]);
    inputRef.current?.focus();
  };

  const handleFocus = () => {
    if (results.length > 0) setIsOpen(true);
    onFocusChange?.(true);
  };

  const handleBlur = () => {
    setTimeout(() => {
      setIsOpen(false);
      setFocusedIndex(-1);
    }, 150);
    onFocusChange?.(false);
  };

  return (
    <div className={cn("relative w-full", className)}>
      <div className="relative">
        <Search className={cn(
          "absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/50",
          compact ? "h-3.5 w-3.5" : "h-4 w-4"
        )} />
        <Input
          ref={inputRef}
          type="text"
          placeholder={placeholder}
          value={searchQuery}
          onChange={(e) => { setSearchQuery(e.target.value); setFocusedIndex(-1); }}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              if (focusedIndex >= 0 && results[focusedIndex]) {
                handleCoachSelect(results[focusedIndex]);
              } else {
                handleSubmit();
              }
              return;
            }
            if (e.key === 'Escape') {
              setIsOpen(false);
              setFocusedIndex(-1);
              inputRef.current?.blur();
              return;
            }
            if (!isOpen || results.length === 0) return;
            if (e.key === 'ArrowDown') {
              e.preventDefault();
              setFocusedIndex(prev => prev < results.length - 1 ? prev + 1 : 0);
            } else if (e.key === 'ArrowUp') {
              e.preventDefault();
              setFocusedIndex(prev => prev > 0 ? prev - 1 : results.length - 1);
            }
          }}
          className={cn(
            "pr-9",
            compact ? "h-9 pl-8 text-[13px] rounded-xl" : "pl-10 h-10 rounded-xl"
          )}
        />
        {loading && searchQuery.length >= 2 && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50 animate-spin" />
        )}
        {!loading && searchQuery && (
          <button
            onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 rounded-full bg-muted-foreground/20 flex items-center justify-center hover:bg-muted-foreground/30 transition-colors"
            aria-label="Clear search"
          >
            <X className="h-3 w-3 text-muted-foreground" />
          </button>
        )}
      </div>

      {isOpen && (
        <div ref={resultsRef} className="absolute top-full left-0 right-0 z-50 mt-1.5 bg-card border border-border/30 rounded-xl shadow-xl max-h-[360px] overflow-y-auto">
          {loading && results.length === 0 ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin mx-auto mb-1" />
              Searching...
            </div>
          ) : results.length > 0 ? (
            <div className="py-1">
              {results.map((coach, index) => (
                <div
                  key={coach.id}
                  className={cn(
                    "px-3 py-2.5 cursor-pointer transition-colors hover:bg-secondary/60",
                    focusedIndex === index && "bg-secondary/60"
                  )}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => handleCoachSelect(coach)}
                  onMouseEnter={() => setFocusedIndex(index)}
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="h-9 w-9 ring-1 ring-border/20">
                      <AvatarImage src={resolveCoachImage(coach.image_url, coach.id)} />
                      <AvatarFallback><User className="h-4 w-4" /></AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-medium text-sm truncate text-foreground">{coach.coach_name}</span>
                        {coach.is_verified && (
                          <span className="text-primary text-xs">✓</span>
                        )}
                        {coach.is_pro && (
                          <Badge variant="secondary" className="text-[9px] px-1 py-0 h-4 bg-amber-500/10 text-amber-600 border-0">PRO</Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4">{coach.sport}</Badge>
                        {coach.rating && (
                          <span className="flex items-center gap-0.5 text-[11px] text-muted-foreground">
                            <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                            {Number(coach.rating).toFixed(1)}
                          </span>
                        )}
                        {coach.location && (
                          <span className="flex items-center gap-0.5 text-[11px] text-muted-foreground truncate">
                            <MapPin className="h-3 w-3 flex-shrink-0" />
                            {coach.location}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              {searchQuery.trim() && (
                <button
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={handleSubmit}
                  className="w-full px-4 py-2.5 text-left text-sm text-primary font-medium hover:bg-secondary/40 transition-colors border-t border-border/10 flex items-center gap-2"
                >
                  <Search className="h-3.5 w-3.5" />
                  See all results for "{searchQuery}"
                </button>
              )}
            </div>
          ) : searchQuery.length >= 2 ? (
            <div className="p-4 text-center">
              <p className="text-sm text-muted-foreground">No coaches found</p>
              {searchQuery.trim() && (
                <button
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={handleSubmit}
                  className="mt-2 text-sm text-primary font-medium hover:underline"
                >
                  Search all content for "{searchQuery}"
                </button>
              )}
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
