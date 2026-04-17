import { useState, useEffect, useRef } from "react";
import { CreditCard, Upload, Trash2, Save, CheckCircle2, ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface PaymentSettingsProps {
  coachProfileId: string;
}

const PaymentSettings = ({ coachProfileId }: PaymentSettingsProps) => {
  const [bitQrUrl, setBitQrUrl] = useState("");
  const [payOnArrival, setPayOnArrival] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from("coach_profiles")
        .select("bit_qr_url, pay_on_arrival" as any)
        .eq("id", coachProfileId)
        .maybeSingle();
      if (data) {
        const d = data as any;
        setBitQrUrl(d.bit_qr_url || "");
        setPayOnArrival(d.pay_on_arrival || false);
      }
    };
    load();
  }, [coachProfileId]);

  const handleUploadQr = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be under 5MB");
      return;
    }

    setUploading(true);
    const ext = file.name.split(".").pop();
    const path = `${coachProfileId}/qr-code.${ext}`;

    const { error } = await supabase.storage
      .from("payment-qr")
      .upload(path, file, { upsert: true, contentType: file.type });

    if (error) {
      toast.error("Upload failed");
      setUploading(false);
      return;
    }

    const { data: urlData } = supabase.storage.from("payment-qr").getPublicUrl(path);
    setBitQrUrl(urlData.publicUrl + "?t=" + Date.now());
    setUploading(false);
    toast.success("QR code uploaded");
  };

  const handleRemoveQr = () => {
    setBitQrUrl("");
  };

  const handleSave = async () => {
    if (!bitQrUrl && !payOnArrival) {
      toast.error("Please add at least one payment method");
      return;
    }
    setSaving(true);
    await (supabase
      .from("coach_profiles")
      .update({
        bit_qr_url: bitQrUrl,
        pay_on_arrival: payOnArrival,
      } as any)
      .eq("id", coachProfileId) as any);
    setSaving(false);
    setSaved(true);
    toast.success("Payment settings saved");
    setTimeout(() => setSaved(false), 2000);
  };

  const hasAnyMethod = !!bitQrUrl || payOnArrival;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center gap-2.5">
        <div className="h-9 w-9 rounded-xl bg-accent/10 flex items-center justify-center">
          <CreditCard className="h-[18px] w-[18px] text-accent" />
        </div>
        <div>
          <h2 className="font-heading text-lg font-bold text-foreground">Payment Settings</h2>
          <p className="text-[11px] text-muted-foreground">Choose how trainees pay you</p>
        </div>
      </div>

      {/* Validation warning */}
      {!hasAnyMethod && (
        <div className="bg-destructive/5 border border-destructive/20 rounded-xl p-4">
          <p className="text-xs font-semibold text-destructive">⚠️ Please add at least one payment method</p>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            Users won't be able to pay you until you enable Bit QR or Pay on Arrival.
          </p>
        </div>
      )}

      {/* ── Section 1: Bit QR Code ── */}
      <div className="rounded-2xl border border-border/50 bg-card p-4 space-y-3">
        <div className="flex items-center gap-2">
          <img
            src="https://upload.wikimedia.org/wikipedia/he/thumb/3/36/Bit_Logo.svg/1200px-Bit_Logo.svg.png"
            alt="Bit"
            className="h-5 w-5 rounded"
          />
          <h3 className="text-sm font-bold text-foreground">Bit Payment (QR Code)</h3>
        </div>

        {bitQrUrl ? (
          <div className="space-y-2">
            <div className="relative rounded-xl overflow-hidden border border-border/30 bg-secondary/50">
              <img
                src={bitQrUrl}
                alt="Bit QR Code"
                className="w-full max-h-56 object-contain p-3"
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1 rounded-xl text-xs"
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
              >
                <Upload className="h-3.5 w-3.5 mr-1" />
                Replace
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="rounded-xl text-xs text-destructive hover:text-destructive"
                onClick={handleRemoveQr}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="w-full rounded-xl border-2 border-dashed border-border/60 bg-secondary/30 hover:bg-secondary/60 transition-colors py-8 flex flex-col items-center gap-2"
          >
            {uploading ? (
              <div className="h-6 w-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            ) : (
              <ImageIcon className="h-8 w-8 text-muted-foreground/60" />
            )}
            <span className="text-xs font-medium text-muted-foreground">
              {uploading ? "Uploading..." : "Upload QR Code"}
            </span>
          </button>
        )}

        <p className="text-[10px] text-muted-foreground">
          Users will scan this QR code using the Bit app to pay you
        </p>

        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleUploadQr}
        />
      </div>

      {/* ── Section 2: Pay on Arrival ── */}
      <div className="rounded-2xl border border-border/50 bg-card p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-foreground">Pay on Arrival</h3>
            <p className="text-[10px] text-muted-foreground mt-0.5">PayBox / Cash at session</p>
          </div>
          <Switch checked={payOnArrival} onCheckedChange={setPayOnArrival} />
        </div>

        {payOnArrival && (
          <div className="bg-primary/5 border border-primary/20 rounded-xl p-3">
            <p className="text-xs font-semibold text-primary">✅ Pay on Arrival is enabled</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Users will pay you directly at the session via PayBox or Cash
            </p>
          </div>
        )}
      </div>

      {/* Save */}
      <Button
        onClick={handleSave}
        disabled={saving}
        className="w-full rounded-2xl h-12 text-sm font-heading font-bold bg-brand-gradient border-0 hover:brightness-110 transition-all active:scale-[0.98] shadow-brand-sm text-white"
      >
        {saving ? (
          <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
        ) : saved ? (
          <span className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4" /> Saved!</span>
        ) : (
          <span className="flex items-center gap-2"><Save className="h-4 w-4" /> Save Payment Settings</span>
        )}
      </Button>
    </div>
  );
};

export default PaymentSettings;
