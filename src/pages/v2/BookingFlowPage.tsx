import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { User, Users, Video, Check, MapPin, Home, Lock, Edit3, ChevronRight, Calendar, Plus } from "lucide-react";
import { PhoneFrame, StatusBar, Avatar, Chip } from "@/components/v2/shared";
import { StepShell } from "@/components/v2/booking/StepShell";
import { useCoach, useCreateBooking } from "@/hooks/v2/useMocks";
import { fetchCoachSlots, fetchTakenSlots } from "@/hooks/v2/useSupabaseQueries";
import { toast } from "sonner";
import { formatPrice } from "@/lib/v2/currency";
import { cn } from "@/lib/utils";
import type { SessionFormat } from "@/types/v2";
import { useHaptics } from "@/native/useNative";

type Step = 1 | 2 | 3 | 4 | 5;
type Period = "all" | "morning" | "afternoon" | "evening";

interface FormatOption {
  key: SessionFormat;
  label: string;
  desc: string;
  duration: number;
  price: number;
  popular?: boolean;
  icon: typeof User;
  iconClass: string;
}

const FORMATS: FormatOption[] = [
  { key: "one-on-one", label: "1-on-1 private", desc: "60 min · full court · video recap included. Maximum focus on your game.", duration: 60, price: 280, popular: true, icon: User, iconClass: "bg-orange text-white" },
  { key: "group", label: "Group · 2–4 players", desc: "Bring friends or match with members · 90 min · split the court · great for match-play practice.", duration: 90, price: 140, icon: Users, iconClass: "bg-teal text-navy-deep" },
  { key: "video-review", label: "Video review · async", desc: "Upload video, get feedback in 48h.", duration: 0, price: 180, icon: Video, iconClass: "bg-navy-card-2 text-offwhite" },
];

const FALLBACK_SLOTS = ["08:00", "09:00", "11:00", "14:00", "16:00", "18:00", "19:00", "21:00"];

export default function BookingFlowPage() {
  const navigate = useNavigate();
  const { coachId } = useParams<{ coachId: string }>();
  const [params] = useSearchParams();
  const initialDate = params.get("date");
  const [step, setStep] = useState<Step>(initialDate ? 2 : 1);
  const [format, setFormat] = useState<FormatOption>(FORMATS[0]);
  const [date, setDate] = useState<Date>(initialDate ? new Date(initialDate) : nextWeekday(2));
  const [slot, setSlot] = useState<string>("18:00");
  const [period, setPeriod] = useState<Period>("all");
  const [location, setLocation] = useState<"home" | "park" | "private">("home");
  const [note, setNote] = useState("");

  const { data: coach } = useCoach(coachId);
  const createBookingMutation = useCreateBooking();
  const [availableSlots, setAvailableSlots] = useState<string[]>(FALLBACK_SLOTS);
  const [takenSlots, setTakenSlots] = useState<Set<string>>(new Set());
  const [monthCursor, setMonthCursor] = useState(date);
  const { tap } = useHaptics();

  // Refresh available + taken slots whenever coach or date changes.
  useEffect(() => {
    if (!coachId) return;
    let cancelled = false;
    const dateStr = date.toISOString().slice(0, 10);
    const weekday = date.getDay();
    void (async () => {
      const [available, taken] = await Promise.all([
        fetchCoachSlots(coachId, weekday),
        fetchTakenSlots(coachId, dateStr),
      ]);
      if (cancelled) return;
      setAvailableSlots(available.length > 0 ? available : FALLBACK_SLOTS);
      setTakenSlots(taken);
    })();
    return () => {
      cancelled = true;
    };
  }, [coachId, date]);

  // Keep month-cursor lined up with selected date when user navigates back.
  useEffect(() => setMonthCursor(date), [date]);

  const totalsILS = useMemo(() => {
    const base = format.price;
    const fee = Math.round(base * 0.05);
    const surcharge = location === "park" ? 40 : location === "private" ? 80 : 0;
    return { base, fee, surcharge, total: base + fee + surcharge };
  }, [format, location]);

  const submitBooking = async () => {
    if (!coachId || !coach) {
      toast.error("Missing coach. Please go back and try again.");
      return;
    }
    if (createBookingMutation.isPending) return;
    const dateStr = date.toISOString().slice(0, 10);
    try {
      const session = await createBookingMutation.mutateAsync({
        coachId,
        coachName: coach.name,
        date: dateStr,
        time: slot,
        durationMin: format.duration,
        priceILS: totalsILS.base + totalsILS.surcharge,
        feeILS: totalsILS.fee,
        format: format.key,
        note: note || undefined,
        location:
          location === "home"
            ? "Jaffa Padel Club"
            : location === "park"
              ? "Hayarkon Park"
              : "Private — your court",
      });
      toast.success("Booking sent — coach will confirm.");
      navigate(`/v2/book/${session.id}/success`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't create the booking. Try again.");
    }
  };

  const goNext = () => {
    tap("light");
    if (step < 5) setStep((s) => (s + 1) as Step);
    else void submitBooking();
  };
  const goBack = () => {
    tap("light");
    if (step > 1) setStep((s) => (s - 1) as Step);
    else navigate(-1);
  };

  return (
    <PhoneFrame className="min-h-[100dvh]">
      <StatusBar />
      {step === 1 && (
        <StepShell
          step={1}
          totalSteps={5}
          topBarCenter={
            <>
              <Avatar size={26} gradient={coach?.avatarGradient} />
              Booking {coach?.firstName ?? "Coach"}
            </>
          }
          onBack={goBack}
          stepLabel="STEP 1 OF 5"
          title="Choose a format"
          sub={`How do you want to train with ${coach?.firstName ?? "your coach"}?`}
          bottomBar={
            <button onClick={goNext} className="w-full py-4 rounded-[16px] bg-orange text-white font-bold text-[15px]">
              Continue
            </button>
          }
        >
          <div className="px-5 flex flex-col gap-3">
            {FORMATS.map((f) => {
              const Icon = f.icon;
              const selected = f.key === format.key;
              return (
                <button
                  key={f.key}
                  onClick={() => { tap("light"); setFormat(f); }}
                  data-grad={selected ? "orange-soft" : undefined}
                  className={cn(
                    "p-4 min-h-[64px] rounded-[16px] border flex gap-3.5 text-left transition-colors",
                    selected ? "border-orange" : "border-transparent bg-navy-card"
                  )}
                >
                  <div className={cn("w-11 h-11 rounded-[12px] flex items-center justify-center shrink-0", f.iconClass)}>
                    <Icon size={20} />
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-start gap-2.5">
                      <h4 className="font-bold text-[16px]">{f.label}</h4>
                      {f.popular && <Chip variant="orange" className="text-[10px]">Most popular</Chip>}
                    </div>
                    <div className="text-[12px] text-v2-muted mt-1 leading-snug">{f.desc}</div>
                    <div className="flex justify-between items-center mt-2.5">
                      <div className="text-[12px] text-v2-muted">{f.duration ? `${f.duration} min · ${formatPrice(f.price)}` : "Frame-by-frame notes"}</div>
                      <div className="text-[18px] font-extrabold tracking-tight tnum">{formatPrice(f.price)}</div>
                    </div>
                  </div>
                  {selected && (
                    <div className="w-[22px] h-[22px] rounded-full bg-orange text-white flex items-center justify-center shrink-0 mt-0.5">
                      <Check size={13} strokeWidth={3} />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </StepShell>
      )}

      {step === 2 && (
        <StepShell
          step={2}
          totalSteps={5}
          topBarCenter={<><span className="w-5 h-5 rounded-full bg-teal" />{format.label.split(" · ")[0]} · {format.duration} min</>}
          onBack={goBack}
          stepLabel="STEP 2 OF 5"
          title="Pick a time"
          bottomBar={
            <button onClick={goNext} className="w-full py-4 rounded-[16px] bg-orange text-white font-bold text-[15px]">
              Continue to confirm
            </button>
          }
        >
          <div className="flex justify-between items-center px-5 pb-3">
            <h3 className="text-[16px] font-bold">{monthCursor.toLocaleDateString("en-US", { month: "long", year: "numeric" })}</h3>
            <div className="flex gap-1.5">
              <button
                onClick={() => {
                  tap("light");
                  const d = new Date(monthCursor);
                  d.setDate(d.getDate() - 7);
                  setMonthCursor(d);
                }}
                className="w-11 h-11 rounded-md bg-navy-card text-offwhite flex items-center justify-center"
                aria-label="Previous week"
              >
                ‹
              </button>
              <button
                onClick={() => {
                  tap("light");
                  const d = new Date(monthCursor);
                  d.setDate(d.getDate() + 7);
                  setMonthCursor(d);
                }}
                className="w-11 h-11 rounded-md bg-navy-card text-offwhite flex items-center justify-center"
                aria-label="Next week"
              >
                ›
              </button>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-2 px-5 pb-4">
            {Array.from({ length: 4 }).map((_, i) => {
              const d = new Date(monthCursor);
              d.setDate(d.getDate() - 1 + i);
              const selected = d.toDateString() === date.toDateString();
              return (
                <button
                  key={i}
                  onClick={() => { tap("light"); setDate(d); }}
                  className={cn(
                    "p-3.5 rounded-[14px] text-center min-h-[64px]",
                    selected ? "bg-orange text-white" : "bg-navy-card text-offwhite"
                  )}
                >
                  <div className={cn("text-[10px] font-bold tracking-wider", selected ? "text-white" : "text-v2-muted")}>
                    {d.toLocaleDateString("en-US", { weekday: "short" }).toUpperCase()}
                  </div>
                  <div className="text-[20px] font-extrabold tnum mt-1">{d.getDate()}</div>
                </button>
              );
            })}
          </div>

          <div className="flex justify-between items-center px-5 pb-2">
            <h4 className="text-[14px] font-bold">{date.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })}</h4>
            <div className="text-[11px] text-v2-muted">
              {Math.max(0, availableSlots.length - takenSlots.size)} slots available
            </div>
          </div>

          <div className="flex gap-2 px-5 pb-3.5">
            {(["all", "morning", "afternoon", "evening"] as const).map((p) => (
              <button
                key={p}
                onClick={() => { tap("light"); setPeriod(p); }}
                className={cn(
                  "px-3.5 py-2 min-h-[44px] rounded-full font-semibold text-[13px] capitalize",
                  period === p ? "bg-teal text-navy-deep" : "bg-navy-card text-offwhite"
                )}
              >
                {p}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-3 gap-2 px-5">
            {availableSlots.filter((t) => {
              const h = parseInt(t);
              if (period === "morning") return h < 12;
              if (period === "afternoon") return h >= 12 && h < 17;
              if (period === "evening") return h >= 17;
              return true;
            }).map((t) => {
              const taken = takenSlots.has(t);
              const sel = slot === t && !taken;
              return (
                <button
                  key={t}
                  onClick={() => { tap("light"); !taken && setSlot(t); }}
                  disabled={taken}
                  className={cn(
                    "p-3.5 rounded-[12px] text-center min-h-[64px]",
                    sel && "bg-orange text-white",
                    !sel && !taken && "bg-navy-card",
                    taken && "bg-navy-card opacity-40 cursor-not-allowed line-through"
                  )}
                >
                  <div className="text-[15px] font-bold tnum">{t}</div>
                  <div className={cn("text-[10px] mt-0.5", sel ? "text-white/85" : "text-v2-muted")}>
                    {taken ? "taken" : sel ? "selected" : `${format.duration} min`}
                  </div>
                </button>
              );
            })}
          </div>
        </StepShell>
      )}

      {step === 3 && (
        <StepShell
          step={3}
          totalSteps={5}
          topBarCenter={<><span className="w-5 h-5 rounded-full bg-teal" />{date.toLocaleDateString("en-US", { weekday: "short" })} · {slot} · {format.duration} min</>}
          onBack={goBack}
          stepLabel="STEP 3 OF 5"
          title="Pick a location"
          sub={`${coach?.firstName ?? "Your coach"} has 3 courts available.`}
          bottomBar={
            <button onClick={goNext} className="w-full py-4 rounded-[16px] bg-orange text-white font-bold text-[15px]">
              Continue to review
            </button>
          }
        >
          <div className="px-5 flex flex-col gap-3">
            <LocationOption
              selected={location === "home"}
              onClick={() => { tap("light"); setLocation("home"); }}
              icon={MapPin}
              iconClass="bg-orange text-white"
              title="Jaffa Padel Club"
              tag="Coach's home court"
              desc="Nachlat Binyamin 12, Tel Aviv · Covered courts · Parking + showers"
              meta="→ 2.1 km · 12 min drive"
              metaTone="teal"
              extra="INCLUDED"
            />
            <LocationOption
              selected={location === "park"}
              onClick={() => { tap("light"); setLocation("park"); }}
              icon={MapPin}
              iconClass="bg-teal text-navy-deep"
              title="Hayarkon Park Courts"
              desc="Rokach Blvd, Tel Aviv · Outdoor · Public park"
              meta="→ 4.8 km · 18 min drive"
              metaTone="teal"
              extra={`+ ${formatPrice(40)}`}
              extraTone="orange"
            />
            <LocationOption
              selected={location === "private"}
              onClick={() => { tap("light"); setLocation("private"); }}
              icon={Home}
              iconClass="bg-navy-card-2 text-offwhite"
              title="Private — your court"
              desc="Have a court? Coach travels to you within 15 km of Tel Aviv."
              meta="Enter address after booking"
              metaTone="muted"
              extra={`+ ${formatPrice(80)} travel`}
              extraTone="orange"
            />
          </div>
        </StepShell>
      )}

      {step === 4 && (
        <StepShell
          step={4}
          totalSteps={5}
          topBarCenter={<>Almost there</>}
          onBack={goBack}
          stepLabel="STEP 4 OF 5"
          title="Review & confirm"
          bottomBar={
            <div className="flex items-center gap-2.5">
              <div className="flex-1">
                <div className="text-[10px] text-v2-muted font-bold tracking-wider">TOTAL</div>
                <div className="text-[18px] font-extrabold tracking-tight tnum">{formatPrice(totalsILS.total)}</div>
              </div>
              <button onClick={goNext} className="px-6 py-3.5 rounded-[14px] bg-orange text-white font-bold text-[14px]">
                Continue to pay ›
              </button>
            </div>
          }
        >
          <div className="px-5 flex flex-col gap-3.5">
            <div className="p-4 rounded-[18px] bg-navy-card flex gap-3.5 items-center">
              <Avatar size={56} gradient={coach?.avatarGradient ?? "teal-gold"} />
              <div className="flex-1">
                <div className="text-[16px] font-bold">{coach?.name}</div>
                <div className="text-[12px] text-v2-muted mt-0.5">{coach?.tagline}</div>
                <div className="flex gap-1.5 mt-1.5">
                  <Chip variant="teal" className="text-[10px]">✓ Verified</Chip>
                  <Chip variant="orange" className="text-[10px]">Top 1%</Chip>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-[16px] bg-navy-card">
              <div className="text-[10px] text-v2-muted font-bold tracking-wider uppercase mb-3">SESSION DETAILS</div>
              <DetailRow icon={User} iconClass="bg-orange-dim text-orange" label="FORMAT" value={`${format.label.split(" · ")[0]} · ${format.duration} min`} />
              <DetailRow icon={Calendar} iconClass="bg-teal-dim text-teal" label="DATE & TIME" value={`${date.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })} · ${slot}`} action="Edit" onAction={() => setStep(2)} />
              <DetailRow icon={MapPin} iconClass="bg-teal-dim text-teal" label="LOCATION" value={location === "home" ? "Jaffa Padel Club" : location === "park" ? "Hayarkon Park" : "Private — your court"} sub="2.1 km" />
            </div>

            <div className="p-4 rounded-[16px] bg-navy-card">
              <div className="text-[10px] text-v2-muted font-bold tracking-wider uppercase mb-2.5">
                NOTE TO COACH <span className="font-medium normal-case text-v2-muted-2">· optional</span>
              </div>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Anything to share? (goals, injuries, what to work on...)"
                className="w-full bg-navy-card-2 border-none rounded-[10px] p-3 text-offwhite text-[13px] resize-none outline-none min-h-[70px]"
              />
            </div>

            <div className="p-4 rounded-[16px] bg-navy-card">
              <div className="text-[10px] text-v2-muted font-bold tracking-wider uppercase mb-3">PRICE BREAKDOWN</div>
              <PriceRow label={`${format.label.split(" · ")[0]} · ${format.duration} min`} value={formatPrice(totalsILS.base)} />
              <PriceRow label="Court rental" value="Included" valueClass="text-teal" />
              {totalsILS.surcharge > 0 && <PriceRow label="Travel / venue" value={formatPrice(totalsILS.surcharge)} />}
              <PriceRow label="Circlo fee" value={formatPrice(totalsILS.fee)} />
              <div className="h-px bg-navy-line my-2" />
              <PriceRow label="Total" value={formatPrice(totalsILS.total)} large />
              <div className="mt-3 px-3 py-2.5 rounded-[10px] bg-teal-dim flex gap-2 items-center">
                <Check size={14} className="text-teal" />
                <div className="text-[12px] text-teal font-semibold">Free cancellation up to 12h before</div>
              </div>
            </div>
          </div>
        </StepShell>
      )}

      {step === 5 && (
        <StepShell
          step={5}
          totalSteps={5}
          topBarCenter={<><Lock size={14} className="text-teal" /> Secure payment</>}
          onBack={goBack}
          stepLabel="STEP 5 OF 5"
          title="Payment"
          sub={`You won't be charged until ${coach?.firstName ?? "your coach"} confirms.`}
          bottomBar={
            <>
              <button
                onClick={goNext}
                disabled={createBookingMutation.isPending}
                className="w-full py-4 rounded-[16px] bg-orange text-white font-bold text-[15px] flex items-center justify-center gap-2 disabled:opacity-60"
              >
                <Lock size={16} strokeWidth={2.5} />
                {createBookingMutation.isPending
                  ? "Sending booking…"
                  : `Pay ${formatPrice(totalsILS.total)} and book`}
              </button>
              <div className="text-center text-[11px] text-v2-muted-2 mt-1.5">
                By booking, you agree to Circlo's Terms &amp; Cancellation Policy
              </div>
            </>
          }
        >
          <div className="px-5 pt-1 text-[10px] text-v2-muted font-bold tracking-wider uppercase pb-2.5">PAYMENT METHOD</div>
          <div className="px-5 flex flex-col gap-2">
            <div className="p-4 rounded-[16px] bg-navy-card border-2 border-orange flex items-center gap-3.5">
              <div data-grad="visa-card" className="w-11 h-8 rounded-md flex items-center justify-center text-white text-[11px] font-extrabold italic">VISA</div>
              <div className="flex-1">
                <div className="text-[14px] font-bold">Visa ···· 4242</div>
                <div className="text-[11px] text-v2-muted mt-0.5">Expires 09/27 · Default</div>
              </div>
              <div className="w-[22px] h-[22px] rounded-full bg-orange text-white flex items-center justify-center">
                <Check size={13} strokeWidth={3} />
              </div>
            </div>
            <div className="p-4 rounded-[16px] bg-navy-card flex items-center gap-3.5">
              <div className="w-11 h-8 rounded-md bg-black flex items-center justify-center text-white text-[11px] font-bold">Pay</div>
              <div className="flex-1">
                <div className="text-[14px] font-bold">Apple Pay</div>
                <div className="text-[11px] text-v2-muted mt-0.5">Tap to use · no setup</div>
              </div>
            </div>
            <button className="w-full py-3.5 min-h-[44px] rounded-[14px] bg-transparent border border-dashed border-navy-line text-v2-muted text-[13px] font-semibold flex items-center justify-center gap-1.5">
              <Plus size={14} /> Add new card
            </button>
          </div>

          <div className="px-5 pb-3.5">
            <div className="p-4 rounded-[16px] bg-navy-card">
              <div className="text-[10px] text-v2-muted font-bold tracking-wider uppercase mb-3">ORDER SUMMARY</div>
              <PriceRow label={`Session with ${coach?.firstName}`} value={formatPrice(totalsILS.base)} />
              {totalsILS.surcharge > 0 && <PriceRow label="Travel" value={formatPrice(totalsILS.surcharge)} />}
              <PriceRow label="Circlo fee" value={formatPrice(totalsILS.fee)} />
              <div className="h-px bg-navy-line my-1.5" />
              <PriceRow label="Total" value={formatPrice(totalsILS.total)} large />
            </div>
          </div>

          <div className="px-5 mb-24">
            <div className="px-3.5 py-3 rounded-[12px] bg-navy-card-2 flex gap-2.5 items-start">
              <Lock size={16} className="text-teal shrink-0 mt-0.5" />
              <div className="text-[12px] text-v2-muted leading-relaxed">
                Payment is held securely and only released after your session.{" "}
                <span className="text-offwhite font-semibold">Full refund if your coach cancels or no-shows.</span>
              </div>
            </div>
          </div>
        </StepShell>
      )}
    </PhoneFrame>
  );
}

function nextWeekday(weekday: number) {
  const d = new Date();
  while (d.getDay() !== weekday) d.setDate(d.getDate() + 1);
  return d;
}

function PriceRow({ label, value, large, valueClass }: { label: string; value: string; large?: boolean; valueClass?: string }) {
  return (
    <div className="flex justify-between py-1.5">
      <span className={cn(large ? "text-[16px] font-bold text-offwhite" : "text-[13px] text-v2-muted")}>{label}</span>
      <span className={cn(large ? "text-[16px] font-extrabold text-offwhite" : "text-[13px] font-semibold text-offwhite", "tnum", valueClass)}>{value}</span>
    </div>
  );
}

function DetailRow({
  icon: Icon,
  iconClass,
  label,
  value,
  sub,
  action,
  onAction,
}: {
  icon: typeof User;
  iconClass: string;
  label: string;
  value: string;
  sub?: string;
  action?: string;
  onAction?: () => void;
}) {
  return (
    <div className="flex gap-3 py-2.5 border-b border-navy-line last:border-b-0">
      <div className={cn("w-8 h-8 rounded-md flex items-center justify-center shrink-0", iconClass)}>
        <Icon size={16} />
      </div>
      <div className="flex-1">
        <div className="text-[10px] text-v2-muted font-bold tracking-wider">{label}</div>
        <div className="text-[14px] font-semibold mt-0.5">{value}</div>
        {sub && <div className="text-[11px] text-v2-muted mt-0.5">{sub}</div>}
      </div>
      {action && (
        <button onClick={onAction} className="text-teal text-[12px] font-bold self-center flex items-center gap-1 min-w-[44px] min-h-[44px] justify-end">
          <Edit3 size={12} /> {action}
        </button>
      )}
    </div>
  );
}

function LocationOption({
  selected,
  onClick,
  icon: Icon,
  iconClass,
  title,
  tag,
  desc,
  meta,
  metaTone,
  extra,
  extraTone,
}: {
  selected: boolean;
  onClick: () => void;
  icon: typeof MapPin;
  iconClass: string;
  title: string;
  tag?: string;
  desc: string;
  meta: string;
  metaTone: "teal" | "muted";
  extra: string;
  extraTone?: "orange";
}) {
  return (
    <button
      onClick={onClick}
      data-grad={selected ? "orange-soft" : undefined}
      className={cn(
        "p-4 rounded-[16px] border flex gap-3.5 text-left transition-colors",
        selected ? "border-orange" : "border-transparent bg-navy-card"
      )}
    >
      <div className={cn("w-11 h-11 rounded-[12px] flex items-center justify-center shrink-0", iconClass)}>
        <Icon size={20} />
      </div>
      <div className="flex-1">
        <div className="flex justify-between items-start gap-2.5">
          <h4 className="font-bold text-[16px]">{title}</h4>
          {tag && <Chip variant="orange" className="text-[10px]">{tag}</Chip>}
        </div>
        <div className="text-[12px] text-v2-muted mt-1 leading-snug">{desc}</div>
        <div className="flex justify-between items-center mt-2.5">
          <div className="text-[12px]">
            <span className={metaTone === "teal" ? "text-teal font-bold" : "text-v2-muted"}>{meta}</span>
          </div>
          <div className={cn("text-[13px] font-bold", extraTone === "orange" ? "text-orange" : "text-v2-muted")}>{extra}</div>
        </div>
      </div>
      {selected && (
        <ChevronRight size={20} className="text-orange shrink-0 self-center" />
      )}
    </button>
  );
}
