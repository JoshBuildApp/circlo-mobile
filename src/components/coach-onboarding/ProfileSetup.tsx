import { useState, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Camera, MapPin, Clock, DollarSign, ShieldCheck, FileCheck2, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface ProfileData {
  image_url: string;
  tagline: string;
  location: string;
  years_experience: number | null;
  price: number | null;
  session_duration: number;
  bio: string;
  insurance_doc_url: string;
  insurance_expiry_date: string;
}

interface ProfileSetupProps {
  data: ProfileData;
  onChange: (data: ProfileData) => void;
}

export function ProfileSetup({ data, onChange }: ProfileSetupProps) {
  const { user } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [insuranceUploading, setInsuranceUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const insuranceRef = useRef<HTMLInputElement>(null);

  const update = (partial: Partial<ProfileData>) => {
    onChange({ ...data, ...partial });
  };

  const handleInsuranceUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (file.size > 10 * 1024 * 1024) {
      toast.error("File too large — max 10MB");
      return;
    }

    setInsuranceUploading(true);
    const ext = file.name.split(".").pop();
    // Path scoped to user folder to satisfy the storage RLS policy
    const path = `${user.id}/insurance/${Date.now()}.${ext}`;
    const { error } = await supabase.storage
      .from("coach-videos")
      .upload(path, file, { upsert: true, contentType: file.type });

    if (error) {
      toast.error("Insurance upload failed");
      setInsuranceUploading(false);
      return;
    }

    const { data: urlData } = supabase.storage.from("coach-videos").getPublicUrl(path);
    update({ insurance_doc_url: urlData.publicUrl });
    toast.success("Insurance document uploaded");
    setInsuranceUploading(false);
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setUploading(true);
    const ext = file.name.split(".").pop();
    // Path must start with the user's UUID folder — coach-videos bucket has
    // RLS requiring `(storage.foldername(name))[1] = auth.uid()::text`.
    const path = `${user.id}/avatar-${Date.now()}.${ext}`;
    const { error } = await supabase.storage
      .from("coach-videos")
      .upload(path, file, { upsert: true });

    if (error) {
      toast.error("Upload failed");
      setUploading(false);
      return;
    }

    const { data: urlData } = supabase.storage.from("coach-videos").getPublicUrl(path);
    update({ image_url: urlData.publicUrl });
    setUploading(false);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-foreground mb-1">Complete your profile</h2>
        <p className="text-sm text-muted-foreground">
          Help trainees get to know you before they book.
        </p>
      </div>

      {/* Photo upload */}
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="relative h-20 w-20 rounded-full bg-secondary border-2 border-dashed border-border flex items-center justify-center overflow-hidden hover:border-primary/50 transition-colors flex-shrink-0"
        >
          {data.image_url ? (
            <img src={data.image_url} alt="Profile" className="h-full w-full object-cover" />
          ) : (
            <Camera className="h-6 w-6 text-muted-foreground" />
          )}
          {uploading && (
            <div className="absolute inset-0 bg-background/60 flex items-center justify-center">
              <span className="h-5 w-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          )}
        </button>
        <div>
          <p className="text-sm font-medium text-foreground">Profile photo</p>
          <p className="text-xs text-muted-foreground">Tap to upload. Square photos work best.</p>
        </div>
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
      </div>

      {/* Tagline */}
      <div className="space-y-2">
        <Label htmlFor="tagline" className="text-sm text-foreground">Tagline</Label>
        <Input
          id="tagline"
          placeholder="e.g. Certified Padel Coach — 10+ years"
          value={data.tagline}
          onChange={(e) => update({ tagline: e.target.value })}
          maxLength={80}
          className="h-12 rounded-xl bg-secondary border-border/50 focus:border-primary/50"
        />
      </div>

      {/* Bio */}
      <div className="space-y-2">
        <Label htmlFor="bio" className="text-sm text-foreground">Bio</Label>
        <Textarea
          id="bio"
          placeholder="Tell trainees about your coaching style and experience..."
          value={data.bio}
          onChange={(e) => update({ bio: e.target.value })}
          rows={3}
          className="rounded-xl bg-secondary border-border/50 focus:border-primary/50 resize-none"
        />
      </div>

      {/* Location */}
      <div className="space-y-2">
        <Label htmlFor="location" className="text-sm text-foreground flex items-center gap-1.5">
          <MapPin className="h-3.5 w-3.5" /> Location
        </Label>
        <Input
          id="location"
          placeholder="e.g. Tel Aviv, Israel"
          value={data.location}
          onChange={(e) => update({ location: e.target.value })}
          className="h-12 rounded-xl bg-secondary border-border/50 focus:border-primary/50"
        />
      </div>

      {/* Experience & Price row */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="experience" className="text-sm text-foreground flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5" /> Years of experience
          </Label>
          <Input
            id="experience"
            type="number"
            min={0}
            max={50}
            placeholder="e.g. 5"
            value={data.years_experience ?? ""}
            onChange={(e) => update({ years_experience: e.target.value ? Number(e.target.value) : null })}
            className="h-12 rounded-xl bg-secondary border-border/50 focus:border-primary/50"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="price" className="text-sm text-foreground flex items-center gap-1.5">
            <DollarSign className="h-3.5 w-3.5" /> Price / session
          </Label>
          <Input
            id="price"
            type="number"
            min={0}
            placeholder="e.g. 150"
            value={data.price ?? ""}
            onChange={(e) => update({ price: e.target.value ? Number(e.target.value) : null })}
            className="h-12 rounded-xl bg-secondary border-border/50 focus:border-primary/50"
          />
        </div>
      </div>

      {/* Session duration */}
      <div className="space-y-2">
        <Label className="text-sm text-foreground">Session duration (minutes)</Label>
        <div className="flex gap-2">
          {[30, 45, 60, 90].map((mins) => (
            <button
              key={mins}
              type="button"
              onClick={() => update({ session_duration: mins })}
              className={`flex-1 h-11 rounded-xl text-sm font-medium transition-all duration-200 active:scale-95 ${
                data.session_duration === mins
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-foreground hover:bg-secondary/80"
              }`}
            >
              {mins}m
            </button>
          ))}
        </div>
      </div>

      {/* Professional liability insurance — required for coaches on Circlo */}
      <div className="space-y-3 p-4 rounded-2xl border border-amber-500/30 bg-amber-500/5">
        <div className="flex items-start gap-2.5">
          <ShieldCheck className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-bold text-foreground">Professional liability insurance</p>
            <p className="text-xs text-muted-foreground mt-0.5 leading-snug">
              Required to take bookings. Upload proof of your active ביטוח אחריות מקצועית.
              Trainees will see a verified shield once an admin reviews your document.
            </p>
          </div>
        </div>

        <input
          ref={insuranceRef}
          type="file"
          accept="application/pdf,image/*"
          className="hidden"
          onChange={handleInsuranceUpload}
        />

        <button
          type="button"
          onClick={() => insuranceRef.current?.click()}
          disabled={insuranceUploading}
          className="w-full h-12 rounded-xl bg-secondary border border-border/50 hover:border-amber-500/50 transition-colors flex items-center justify-center gap-2 text-sm font-medium text-foreground disabled:opacity-60"
        >
          {insuranceUploading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Uploading…
            </>
          ) : data.insurance_doc_url ? (
            <>
              <FileCheck2 className="h-4 w-4 text-emerald-500" />
              Document uploaded — replace
            </>
          ) : (
            <>
              <ShieldCheck className="h-4 w-4 text-amber-500" />
              Upload insurance document (PDF or image)
            </>
          )}
        </button>

        <div className="space-y-1.5">
          <Label htmlFor="insurance_expiry" className="text-xs text-foreground">
            Policy expiry date
          </Label>
          <Input
            id="insurance_expiry"
            type="date"
            value={data.insurance_expiry_date || ""}
            onChange={(e) => update({ insurance_expiry_date: e.target.value })}
            className="h-11 rounded-xl bg-secondary border-border/50 focus:border-amber-500/50"
          />
        </div>
      </div>
    </div>
  );
}
