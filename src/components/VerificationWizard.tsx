import { useState } from "react";
import { CheckCircle, Upload, ArrowLeft, ArrowRight, Loader2, FileText, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface Props {
  coachProfileId: string;
  coachName: string;
  coachSport: string;
  onClose: () => void;
  onSubmitted: () => void;
}

const STEPS = ["Personal Info", "Professional", "Documents", "Review"];

const VerificationWizard = ({ coachProfileId, coachName, coachSport, onClose, onSubmitted }: Props) => {
  const { user } = useAuth();
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [fullName, setFullName] = useState(coachName);
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState(user?.email || "");
  const [sport, setSport] = useState(coachSport);
  const [years, setYears] = useState("");
  const [certifications, setCertifications] = useState("");
  const [description, setDescription] = useState("");
  const [links, setLinks] = useState("");
  const [files, setFiles] = useState<File[]>([]);

  const handleFileAdd = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles((prev) => [...prev, ...Array.from(e.target.files!)].slice(0, 5));
    }
  };

  const removeFile = (idx: number) => setFiles((prev) => prev.filter((_, i) => i !== idx));

  const handleSubmit = async () => {
    if (!user) return;
    setSubmitting(true);

    try {
      // Upload docs
      const docUrls: string[] = [];
      for (const file of files) {
        const path = `${user.id}/${Date.now()}_${file.name}`;
        const { error } = await supabase.storage.from("verification-docs").upload(path, file);
        if (!error) {
          docUrls.push(path);
        }
      }

      // Insert request
      const { error } = await supabase.from("verification_requests").insert({
        coach_id: coachProfileId,
        coach_name: fullName,
        phone,
        sport,
        years_experience: parseInt(years) || 0,
        certifications_text: certifications,
        experience_text: description,
        links,
        documents_urls: docUrls,
        status: "pending",
      });

      if (error) throw error;
      toast.success("Verification request submitted!");
      onSubmitted();
    } catch (err: any) {
      toast.error(err.message || "Failed to submit");
    } finally {
      setSubmitting(false);
    }
  };

  const canProceed = () => {
    if (step === 0) return fullName.trim() && email.trim();
    if (step === 1) return sport.trim() && years.trim();
    if (step === 2) return true;
    return true;
  };

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border/10">
        <button onClick={onClose} className="h-9 w-9 rounded-full bg-secondary flex items-center justify-center">
          <X className="h-4 w-4" />
        </button>
        <h2 className="text-sm font-bold text-foreground">Get Verified</h2>
        <div className="w-9" />
      </div>

      {/* Progress */}
      <div className="px-4 py-3">
        <div className="flex gap-1.5">
          {STEPS.map((_, i) => (
            <div key={i} className={`flex-1 h-1 rounded-full transition-colors ${i <= step ? "bg-primary" : "bg-secondary"}`} />
          ))}
        </div>
        <p className="text-xs text-muted-foreground mt-2">Step {step + 1} of {STEPS.length} — {STEPS[step]}</p>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 pb-4">
        {step === 0 && (
          <div className="space-y-4 pt-2">
            <h3 className="text-lg font-bold text-foreground">Personal Information</h3>
            <p className="text-xs text-muted-foreground">Tell us about yourself so we can verify your identity.</p>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-foreground mb-1 block">Full Name *</label>
                <input
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full h-11 rounded-xl bg-secondary border border-border/10 px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                  placeholder="Your full name"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-foreground mb-1 block">Phone Number</label>
                <input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full h-11 rounded-xl bg-secondary border border-border/10 px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                  placeholder="+1 234 567 890"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-foreground mb-1 block">Email *</label>
                <input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full h-11 rounded-xl bg-secondary border border-border/10 px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                  placeholder="coach@email.com"
                />
              </div>
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-4 pt-2">
            <h3 className="text-lg font-bold text-foreground">Professional Details</h3>
            <p className="text-xs text-muted-foreground">Share your coaching experience and qualifications.</p>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-foreground mb-1 block">Sport Specialization *</label>
                <input
                  value={sport}
                  onChange={(e) => setSport(e.target.value)}
                  className="w-full h-11 rounded-xl bg-secondary border border-border/10 px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                  placeholder="e.g. Padel, Tennis, Fitness"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-foreground mb-1 block">Years of Experience *</label>
                <input
                  value={years}
                  onChange={(e) => setYears(e.target.value)}
                  type="number"
                  className="w-full h-11 rounded-xl bg-secondary border border-border/10 px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                  placeholder="e.g. 5"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-foreground mb-1 block">Certifications</label>
                <textarea
                  value={certifications}
                  onChange={(e) => setCertifications(e.target.value)}
                  className="w-full min-h-[80px] rounded-xl bg-secondary border border-border/10 px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
                  placeholder="List your certifications..."
                />
              </div>
              <div>
                <label className="text-xs font-medium text-foreground mb-1 block">Short Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full min-h-[80px] rounded-xl bg-secondary border border-border/10 px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
                  placeholder="Tell us about your coaching style..."
                />
              </div>
              <div>
                <label className="text-xs font-medium text-foreground mb-1 block">Links (optional)</label>
                <input
                  value={links}
                  onChange={(e) => setLinks(e.target.value)}
                  className="w-full h-11 rounded-xl bg-secondary border border-border/10 px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                  placeholder="Website, social media, etc."
                />
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4 pt-2">
            <h3 className="text-lg font-bold text-foreground">Documents</h3>
            <p className="text-xs text-muted-foreground">Upload your ID, coaching certificates, and any supporting documents.</p>

            <label className="flex flex-col items-center justify-center gap-2 h-32 rounded-xl border-2 border-dashed border-border/30 bg-secondary/50 cursor-pointer hover:border-primary/30 transition-colors">
              <Upload className="h-6 w-6 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Tap to upload documents</span>
              <span className="text-[10px] text-muted-foreground/60">PDF, JPG, PNG — Max 5 files</span>
              <input type="file" multiple accept=".pdf,.jpg,.jpeg,.png" onChange={handleFileAdd} className="hidden" />
            </label>

            {files.length > 0 && (
              <div className="space-y-2">
                {files.map((f, i) => (
                  <div key={i} className="flex items-center gap-3 bg-card rounded-xl border border-border/10 p-3">
                    <FileText className="h-4 w-4 text-primary flex-shrink-0" />
                    <span className="text-xs text-foreground truncate flex-1">{f.name}</span>
                    <span className="text-[10px] text-muted-foreground">{(f.size / 1024).toFixed(0)}KB</span>
                    <button onClick={() => removeFile(i)} className="h-6 w-6 rounded-full bg-secondary flex items-center justify-center">
                      <X className="h-3 w-3 text-muted-foreground" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4 pt-2">
            <h3 className="text-lg font-bold text-foreground">Review & Submit</h3>
            <p className="text-xs text-muted-foreground">Please review your information before submitting.</p>

            <div className="space-y-3">
              {[
                { label: "Name", value: fullName },
                { label: "Email", value: email },
                { label: "Phone", value: phone || "—" },
                { label: "Sport", value: sport },
                { label: "Experience", value: `${years} years` },
                { label: "Certifications", value: certifications || "—" },
                { label: "Documents", value: `${files.length} file(s)` },
              ].map((item) => (
                <div key={item.label} className="flex justify-between items-start bg-card rounded-xl border border-border/10 px-4 py-3">
                  <span className="text-xs text-muted-foreground">{item.label}</span>
                  <span className="text-xs font-medium text-foreground text-right max-w-[60%]">{item.value}</span>
                </div>
              ))}
            </div>

            <div className="bg-primary/5 rounded-xl p-4 border border-primary/10">
              <p className="text-xs text-foreground font-medium">What happens next?</p>
              <p className="text-[11px] text-muted-foreground mt-1">
                Our team will review your submission within 24–48 hours. You'll receive a notification with the result.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-border/10 flex gap-3">
        {step > 0 && (
          <button
            onClick={() => setStep((s) => s - 1)}
            className="h-11 px-5 rounded-xl bg-secondary text-foreground text-sm font-semibold flex items-center gap-2 active:scale-[0.97] transition-all"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>
        )}
        <button
          onClick={step === 3 ? handleSubmit : () => setStep((s) => s + 1)}
          disabled={!canProceed() || submitting}
          className="flex-1 h-11 rounded-xl bg-primary text-primary-foreground text-sm font-bold flex items-center justify-center gap-2 active:scale-[0.97] transition-all disabled:opacity-40"
        >
          {submitting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : step === 3 ? (
            <>
              <CheckCircle className="h-4 w-4" />
              Submit Request
            </>
          ) : (
            <>
              Continue
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default VerificationWizard;
