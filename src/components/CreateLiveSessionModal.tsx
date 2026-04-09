import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface CreateLiveSessionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSessionCreated: () => void;
}

export function CreateLiveSessionModal({
  open,
  onOpenChange,
  onSessionCreated
}: CreateLiveSessionModalProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [date, setDate] = useState<Date>();
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    start_time: "",
    end_time: "",
    max_participants: 10,
    price: 25,
    session_link: ""
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !date) {
      toast.error("Please fill in all required fields");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from("training_sessions")
        .insert({
          title: formData.title,
          description: formData.description,
          date: format(date, 'yyyy-MM-dd'),
          time: formData.start_time,
          time_label: formData.start_time,
          max_capacity: formData.max_participants,
          price: formData.price,
          location: formData.session_link || '',
          coach_id: user.id,
          session_type: 'group',
          status: 'open',
        } as any);

      if (error) throw error;

      toast.success("Live session created successfully!");
      onSessionCreated();
      onOpenChange(false);
      setFormData({
        title: "",
        description: "",
        start_time: "",
        end_time: "",
        max_participants: 10,
        price: 25,
        session_link: ""
      });
      setDate(undefined);
    } catch (error: any) {
      toast.error(error.message || "Failed to create session");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Create Live Session</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Session Title *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="e.g., Morning Yoga Flow"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Describe what participants will learn..."
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label>Date *</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !date && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date ? format(date, "PPP") : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={setDate}
                  disabled={(date) => date < new Date()}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start_time">Start Time *</Label>
              <Input
                id="start_time"
                type="time"
                value={formData.start_time}
                onChange={(e) => setFormData(prev => ({ ...prev, start_time: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="end_time">End Time *</Label>
              <Input
                id="end_time"
                type="time"
                value={formData.end_time}
                onChange={(e) => setFormData(prev => ({ ...prev, end_time: e.target.value }))}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="max_participants">Max Participants</Label>
              <Input
                id="max_participants"
                type="number"
                min="1"
                max="100"
                value={formData.max_participants}
                onChange={(e) => setFormData(prev => ({ ...prev, max_participants: parseInt(e.target.value) }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="price">Price ($)</Label>
              <Input
                id="price"
                type="number"
                min="0"
                step="0.01"
                value={formData.price}
                onChange={(e) => setFormData(prev => ({ ...prev, price: parseFloat(e.target.value) }))}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="session_link">Video Conference Link</Label>
            <Input
              id="session_link"
              type="url"
              value={formData.session_link}
              onChange={(e) => setFormData(prev => ({ ...prev, session_link: e.target.value }))}
              placeholder="https://zoom.us/j/... or Google Meet link"
            />
            <p className="text-xs text-muted-foreground">
              This link will be shared with participants 15 minutes before the session
            </p>
          </div>

          <div className="flex space-x-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? "Creating..." : "Create Session"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}