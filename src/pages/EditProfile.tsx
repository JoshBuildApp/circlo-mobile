import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Camera,
  Check,
  Globe,
  Instagram,
  Loader2,
  Phone,
  ImageIcon,
  ShieldCheck,
  FileCheck2,
} from "lucide-react";
import PageHeader from "@/components/PageHeader";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const SPORTS = [
  "Padel",
  "Tennis",
  "Fitness",
  "Basketball",
  "Football",
  "Swimming",
  "Yoga",
  "Running",
  "Boxing",
  "CrossFit",
  "Other",
];

interface CoachData {
  id: string;
  coach_name: string;
  sport: string;
  bio: string | null;
  tagline: string | null;
  image_url: string | null;
  cover_media: string | null;
  price: number | null;
  years_experience: number | null;
  specialties: string[] | null;
  location: string | null;
  training_style: string | null;
  ideal_for: string | null;
  languages: string[] | null;
  response_time: string | null;
}

const SectionTitle = ({ children }: { children: React.ReactNode }) => (
  <h2 className="font-heading text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">
    {children}
  </h2>
);

const FieldCard = ({ children }: { children: React.ReactNode }) => (
  <div className="rounded-2xl border border-border/10 bg-card p-4 space-y-4">
    {children}
  </div>
);

const EditProfile = () => {
  const navigate = useNavigate();
  const { user, profile, refreshProfile } = useAuth();
  const avatarRef = useRef<HTMLInputElement>(null);
  const coverRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [coverUploading, setCoverUploading] = useState(false);

  // Shared fields
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  // Coach-specific
  const [isCoach, setIsCoach] = useState(false);
  const [coachData, setCoachData] = useState<CoachData | null>(null);
  const [coachName, setCoachName] = useState("");
  const [sport, setSport] = useState("");
  const [tagline, setTagline] = useState("");
  const [coachBio, setCoachBio] = useState("");
  const [price, setPrice] = useState("");
  const [experience, setExperience] = useState("");
  const [specialties, setSpecialties] = useState("");
  const [location, setLocation] = useState("");
  const [trainingStyle, setTrainingStyle] = useState("");
  const [idealFor, setIdealFor] = useState("");
  const [languagesStr, setLanguagesStr] = useState("");
  const [responseTime, setResponseTime] = useState("");
  const [coverUrl, setCoverUrl] = useState<string | null>(null);

  // Links (coach)
  const [instagram, setInstagram] = useState("");
  const [website, setWebsite] = useState("");
  const [phone, setPhone] = useState("");

  // Insurance (coach)
  const [insuranceDocUrl, setInsuranceDocUrl] = useState("");
  const [insuranceExpiry, setInsuranceExpiry] = useState("");
  const [insuranceVerifiedAt, setInsuranceVerifiedAt] = useState<string | null>(null);
  const [insuranceUploading, setInsuranceUploading] = useState(false);
  const insuranceRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      setLoading(true);

      // Load profile
      const { data: prof } = await supabase
        .from("profiles")
        .select("username, bio, avatar_url")
        .eq("user_id", user.id)
        .maybeSingle();

      if (prof) {
        setUsername(prof.username ?? "");
        setBio(prof.bio ?? "");
        setAvatarUrl(prof.avatar_url ?? null);
      }

      // Load coach profile if exists
      const { data: coach } = await supabase
        .from("coach_profiles")
        .select("id, coach_name, sport, bio, tagline, image_url, cover_media, price, years_experience, specialties, location, payment_phone, training_style, ideal_for, languages, response_time, insurance_doc_url, insurance_expiry_date, insurance_verified_at")
        .eq("user_id", user.id)
        .maybeSingle();

      if (coach) {
        setIsCoach(true);
        const c = coach as any;
        setCoachData(c);
        setCoachName(c.coach_name ?? "");
        setSport(c.sport ?? "");
        setCoachBio(c.bio ?? "");
        setTagline(c.tagline ?? "");
        setPrice(c.price?.toString() ?? "");
        setExperience(c.years_experience?.toString() ?? "");
        setSpecialties((c.specialties ?? []).join(", "));
        setLocation(c.location ?? "");
        setCoverUrl(c.cover_media ?? null);
        setPhone(c.payment_phone ?? "");
        setTrainingStyle(c.training_style ?? "");
        setIdealFor(c.ideal_for ?? "");
        setLanguagesStr((c.languages ?? []).join(", "));
        setResponseTime(c.response_time ?? "");
        setInsuranceDocUrl(c.insurance_doc_url ?? "");
        setInsuranceExpiry(c.insurance_expiry_date ?? "");
        setInsuranceVerifiedAt(c.insurance_verified_at ?? null);
        if (c.image_url) setAvatarUrl(c.image_url);
      }

      setLoading(false);
    };
    load();
  }, [user]);

  const uploadImage = async (file: File, folder: string): Promise<string | null> => {
    const ext = file.name.split(".").pop();
    const path = `${folder}/${user!.id}-${Date.now()}.${ext}`;
    const { error } = await supabase.storage
      .from("coach-videos")
      .upload(path, file, { upsert: true });
    if (error) {
      toast.error("Upload failed");
      return null;
    }
    const { data } = supabase.storage.from("coach-videos").getPublicUrl(path);
    return data.publicUrl;
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setAvatarUploading(true);
    const url = await uploadImage(file, "avatars");
    if (url) {
      setAvatarUrl(url);
      toast.success("Photo updated");
    }
    setAvatarUploading(false);
  };

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setCoverUploading(true);
    const url = await uploadImage(file, "covers");
    if (url) {
      setCoverUrl(url);
      toast.success("Cover updated");
    }
    setCoverUploading(false);
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
    setInsuranceDocUrl(urlData.publicUrl);
    // New upload requires re-verification
    setInsuranceVerifiedAt(null);
    toast.success("Insurance document uploaded — pending admin review");
    setInsuranceUploading(false);
  };

  const handleSave = async () => {
    if (!user) return;
    if (!username.trim()) {
      toast.error("Name is required");
      return;
    }

    setSaving(true);

    // Update profile table
    const profileUpdate: Record<string, string> = {
      username: username.trim(),
      bio: bio.trim(),
    };
    if (avatarUrl && !isCoach) profileUpdate.avatar_url = avatarUrl;

    const { error: profErr } = await supabase
      .from("profiles")
      .update(profileUpdate)
      .eq("user_id", user.id);

    if (profErr) {
      toast.error("Failed to save profile");
      setSaving(false);
      return;
    }

    // Update coach profile if coach
    if (isCoach && coachData) {
      const specialtiesArr = specialties
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);

      const coachUpdate: Record<string, string | number | string[] | null> = {
        coach_name: coachName.trim() || username.trim(),
        sport: sport || "Other",
        bio: coachBio.trim(),
        tagline: tagline.trim(),
        price: parseInt(price) || 50,
        years_experience: parseInt(experience) || 0,
        specialties: specialtiesArr,
        location: location.trim(),
        payment_phone: phone.trim(),
        training_style: trainingStyle.trim(),
        ideal_for: idealFor.trim(),
        languages: languagesStr.split(",").map((s) => s.trim()).filter(Boolean),
        response_time: responseTime.trim() || "Under 1 hour",
        insurance_doc_url: insuranceDocUrl || null,
        insurance_expiry_date: insuranceExpiry || null,
      };
      if (avatarUrl) coachUpdate.image_url = avatarUrl;
      if (coverUrl) coachUpdate.cover_media = coverUrl;

      const { data: savedCoach, error: coachErr } = await supabase
        .from("coach_profiles")
        .update(coachUpdate)
        .eq("id", coachData.id)
        .select()
        .single();

      if (coachErr) {
        console.error("Coach save error:", coachErr);
        toast.error("Failed to save coach details");
        setSaving(false);
        return;
      }
    }

    await refreshProfile();
    toast.success("Profile updated successfully");
    setSaving(false);
    // Navigate back with state flag so profile pages know to re-fetch
    navigate(-1);
    // Dispatch after a tick so the target page is mounted
    setTimeout(() => window.dispatchEvent(new CustomEvent("profile-updated")), 100);
  };

  if (!user) {
    navigate("/login");
    return null;
  }

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 text-primary animate-spin" />
      </div>
    );
  }

  const initial = (isCoach ? coachName : username)?.charAt(0)?.toUpperCase() ?? "?";
  const displayAvatar = avatarUrl;

  return (
    <div className="h-full overflow-y-auto bg-background pb-28">
      {/* Hidden file inputs */}
      <input ref={avatarRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
      <input ref={coverRef} type="file" accept="image/*" className="hidden" onChange={handleCoverUpload} />
      <input ref={insuranceRef} type="file" accept="application/pdf,image/*" className="hidden" onChange={handleInsuranceUpload} />

      <PageHeader
        title="Edit Profile"
        showBack
        sticky
        centerTitle
        className="px-4 py-3"
      />

      {/* Cover banner */}
      {isCoach && (
        <button
          onClick={() => coverRef.current?.click()}
          className="relative w-full h-36 bg-secondary overflow-hidden group"
        >
          {coverUrl ? (
            <img src={coverUrl} alt="Cover" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-muted-foreground">
              <ImageIcon className="h-8 w-8" />
              <span className="text-xs font-medium">Add Cover Photo</span>
            </div>
          )}
          <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 group-active:opacity-100 transition-opacity">
            <Camera className="h-6 w-6 text-white" />
          </div>
          {coverUploading && (
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
              <Loader2 className="h-6 w-6 text-white animate-spin" />
            </div>
          )}
        </button>
      )}

      {/* Avatar - prominent section */}
      <div className={`flex flex-col items-center ${isCoach ? "-mt-12" : "mt-4"} mb-6`}>
        <button
          onClick={() => avatarRef.current?.click()}
          className="relative h-28 w-28 rounded-[32px] overflow-hidden bg-secondary border-4 border-background shadow-xl group"
        >
          {displayAvatar ? (
            <img src={displayAvatar} alt="Avatar" className="h-full w-full object-cover" />
          ) : (
            <div className="h-full w-full flex items-center justify-center text-primary font-heading text-4xl font-bold bg-primary/10">
              {initial}
            </div>
          )}
          <div className="absolute inset-0 bg-black/30 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 group-active:opacity-100 transition-opacity rounded-[32px]">
            <Camera className="h-7 w-7 text-white" />
            <span className="text-white text-[10px] font-semibold mt-1">Change</span>
          </div>
          {avatarUploading && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <Loader2 className="h-6 w-6 text-white animate-spin" />
            </div>
          )}
        </button>
        <button
          onClick={() => avatarRef.current?.click()}
          className="mt-3 text-primary text-sm font-semibold active:scale-95 transition-transform"
        >
          Change Photo
        </button>
      </div>

      {/* Form sections */}
      <div className="px-5 space-y-6">
        {/* Basic Info */}
        <div>
          <SectionTitle>Basic Info</SectionTitle>
          <FieldCard>
            <div className="space-y-1.5">
              <Label htmlFor="name">{isCoach ? "Coach Name" : "Display Name"}</Label>
              <Input
                id="name"
                value={isCoach ? coachName : username}
                onChange={(e) => isCoach ? setCoachName(e.target.value) : setUsername(e.target.value)}
                placeholder="Your name"
                className="rounded-xl bg-secondary/50 border-0 focus-visible:ring-primary/30"
              />
            </div>
            {!isCoach && (
              <div className="space-y-1.5">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="@username"
                  className="rounded-xl bg-secondary/50 border-0 focus-visible:ring-primary/30"
                />
              </div>
            )}
            <div className="space-y-1.5">
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                value={isCoach ? coachBio : bio}
                onChange={(e) => isCoach ? setCoachBio(e.target.value) : setBio(e.target.value)}
                placeholder="Tell the community about yourself..."
                rows={3}
                className="rounded-xl bg-secondary/50 border-0 focus-visible:ring-primary/30 resize-none"
              />
            </div>
            {isCoach && (
              <div className="space-y-1.5">
                <Label htmlFor="tagline">Tagline</Label>
                <Input
                  id="tagline"
                  value={tagline}
                  onChange={(e) => setTagline(e.target.value)}
                  placeholder="Short catchy tagline"
                  maxLength={80}
                  className="rounded-xl bg-secondary/50 border-0 focus-visible:ring-primary/30"
                />
              </div>
            )}
          </FieldCard>
        </div>

        {/* Sport / Category */}
        <div>
          <SectionTitle>Sport / Category</SectionTitle>
          <FieldCard>
            <div className="space-y-1.5">
              <Label>Sport</Label>
              <Select value={sport || (profile?.interests?.[0] ?? "")} onValueChange={setSport}>
                <SelectTrigger className="rounded-xl bg-secondary/50 border-0 focus:ring-primary/30">
                  <SelectValue placeholder="Select sport" />
                </SelectTrigger>
                <SelectContent>
                  {SPORTS.map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {isCoach && (
              <div className="space-y-1.5">
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="City, Country"
                  className="rounded-xl bg-secondary/50 border-0 focus-visible:ring-primary/30"
                />
              </div>
            )}
          </FieldCard>
        </div>

        {/* Coach-specific fields */}
        {isCoach && (
          <div>
            <SectionTitle>Coaching Details</SectionTitle>
            <FieldCard>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="price">Price / Session (₪)</Label>
                  <Input
                    id="price"
                    type="number"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="50"
                    className="rounded-xl bg-secondary/50 border-0 focus-visible:ring-primary/30"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="experience">Experience (years)</Label>
                  <Input
                    id="experience"
                    type="number"
                    value={experience}
                    onChange={(e) => setExperience(e.target.value)}
                    placeholder="3"
                    className="rounded-xl bg-secondary/50 border-0 focus-visible:ring-primary/30"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="specialties">Specialties</Label>
                <Input
                  id="specialties"
                  value={specialties}
                  onChange={(e) => setSpecialties(e.target.value)}
                  placeholder="1-on-1, Group, Beginners"
                  className="rounded-xl bg-secondary/50 border-0 focus-visible:ring-primary/30"
                />
                <p className="text-[11px] text-muted-foreground">Separate with commas</p>
              </div>
            </FieldCard>
          </div>
        )}

        {/* Training Details (coach) */}
        {isCoach && (
          <div>
            <SectionTitle>Training Details</SectionTitle>
            <FieldCard>
              <div className="space-y-1.5">
                <Label htmlFor="trainingStyle">Training Style</Label>
                <Textarea
                  id="trainingStyle"
                  value={trainingStyle}
                  onChange={(e) => setTrainingStyle(e.target.value)}
                  placeholder="Describe your coaching approach..."
                  rows={3}
                  className="rounded-xl bg-secondary/50 border-0 focus-visible:ring-primary/30 resize-none"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="idealFor">Ideal For</Label>
                <Textarea
                  id="idealFor"
                  value={idealFor}
                  onChange={(e) => setIdealFor(e.target.value)}
                  placeholder="Who benefits most from your training?"
                  rows={2}
                  className="rounded-xl bg-secondary/50 border-0 focus-visible:ring-primary/30 resize-none"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="languages">Languages</Label>
                <Input
                  id="languages"
                  value={languagesStr}
                  onChange={(e) => setLanguagesStr(e.target.value)}
                  placeholder="English, Hebrew, Arabic"
                  className="rounded-xl bg-secondary/50 border-0 focus-visible:ring-primary/30"
                />
                <p className="text-[11px] text-muted-foreground">Separate with commas</p>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="responseTime">Response Time</Label>
                <Input
                  id="responseTime"
                  value={responseTime}
                  onChange={(e) => setResponseTime(e.target.value)}
                  placeholder="Under 1 hour"
                  className="rounded-xl bg-secondary/50 border-0 focus-visible:ring-primary/30"
                />
              </div>
            </FieldCard>
          </div>
        )}

        {/* Insurance */}
        {isCoach && (
          <div>
            <SectionTitle>Liability Insurance</SectionTitle>
            <FieldCard>
              <div className="flex items-start gap-2.5">
                <ShieldCheck className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">
                    Professional liability insurance
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-0.5 leading-snug">
                    Required to take bookings on Circlo. Upload proof of your active
                    ביטוח אחריות מקצועית. An admin reviews each upload before the
                    Verified badge appears on your profile.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => insuranceRef.current?.click()}
                disabled={insuranceUploading}
                className="w-full h-12 rounded-xl bg-secondary/50 border border-border/50 hover:border-amber-500/50 transition-colors flex items-center justify-center gap-2 text-sm font-medium text-foreground disabled:opacity-60"
              >
                {insuranceUploading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Uploading…
                  </>
                ) : insuranceDocUrl ? (
                  <>
                    <FileCheck2 className="h-4 w-4 text-emerald-500" />
                    Document on file — replace
                  </>
                ) : (
                  <>
                    <ShieldCheck className="h-4 w-4 text-amber-500" />
                    Upload insurance document
                  </>
                )}
              </button>

              <div className="space-y-1.5">
                <Label htmlFor="insurance_expiry">Policy expiry date</Label>
                <Input
                  id="insurance_expiry"
                  type="date"
                  value={insuranceExpiry}
                  onChange={(e) => setInsuranceExpiry(e.target.value)}
                  className="rounded-xl bg-secondary/50 border-0 focus-visible:ring-amber-500/30"
                />
              </div>

              {insuranceDocUrl && (
                <div
                  className={`flex items-center gap-2 text-[11px] font-medium px-3 py-2 rounded-lg ${
                    insuranceVerifiedAt
                      ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                      : "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                  }`}
                >
                  {insuranceVerifiedAt ? (
                    <>
                      <Check className="h-3.5 w-3.5" />
                      Verified by Circlo on {new Date(insuranceVerifiedAt).toLocaleDateString()}
                    </>
                  ) : (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      Pending admin review
                    </>
                  )}
                </div>
              )}
            </FieldCard>
          </div>
        )}

        {/* Links */}
        {isCoach && (
          <div>
            <SectionTitle>Links</SectionTitle>
            <FieldCard>
              <div className="space-y-1.5">
                <Label className="flex items-center gap-1.5"><Instagram className="h-3.5 w-3.5" />Instagram</Label>
                <Input
                  value={instagram}
                  onChange={(e) => setInstagram(e.target.value)}
                  placeholder="@your_handle"
                  className="rounded-xl bg-secondary/50 border-0 focus-visible:ring-primary/30"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="flex items-center gap-1.5"><Globe className="h-3.5 w-3.5" />Website</Label>
                <Input
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  placeholder="https://your-site.com"
                  className="rounded-xl bg-secondary/50 border-0 focus-visible:ring-primary/30"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="flex items-center gap-1.5"><Phone className="h-3.5 w-3.5" />Phone</Label>
                <Input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+972..."
                  className="rounded-xl bg-secondary/50 border-0 focus-visible:ring-primary/30"
                />
              </div>
            </FieldCard>
          </div>
        )}
      </div>

      {/* Sticky save button */}
      <div className="fixed bottom-0 left-0 right-0 z-30 px-5 pb-6 pt-3 bg-gradient-to-t from-background via-background to-transparent">
        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full h-14 rounded-2xl bg-brand-gradient text-primary-foreground font-heading font-bold text-base shadow-brand-sm active:scale-[0.97] transition-all disabled:opacity-60 flex items-center justify-center gap-2"
        >
          {saving ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <>
              <Check className="h-5 w-5" />
              Save Changes
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default EditProfile;
