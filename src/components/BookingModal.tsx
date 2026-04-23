import { useState, useEffect, useMemo } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import {
  CalendarDays, Clock, CreditCard, Loader2, ArrowLeft,
  Check, ChevronRight, User, Zap, Sparkles, Package, AlertTriangle, ShieldAlert,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { usePaymentIntent } from "@/hooks/use-payment-intent";
import { useBookingLimits } from "@/hooks/use-rate-limits";
import {
  useAvailability,
  useBlockedSlots,
  useBookedSlots,
  getSlotsForDateFromAvailability,
  isDateAvailableFromSlots,
  getNextAvailableFromSlots,
} from "@/hooks/use-availability";
import { useCoachPackages, type CoachPackage } from "@/hooks/use-coach-packages";
import { useUserPackages, type UserPackage } from "@/hooks/use-user-packages";
import { motion, AnimatePresence } from "framer-motion";
import { validateIsraeliId, validateIsraeliMobile } from "@/lib/israeli-id";
import { useTranslation } from "react-i18next";

/**
 * Trainee Waiver version. Bump when the waiver text materially changes —
 * users with a stored acceptance of an older version will be re-prompted
 * on their next booking. Must match the version in
 * ~/circlo-legal/drafts-en/05-trainee-waiver.md.
 */
const WAIVER_VERSION = "1.2";

interface ParentalSignature {
  parent_full_name: string;
  parent_id_input: string;
  parent_id_normalized: string | null;
  parent_relationship: "parent" | "guardian";
  parent_emergency_phone_input: string;
  parent_emergency_phone_canonical: string | null;
}

const EMPTY_PARENTAL_SIGNATURE: ParentalSignature = {
  parent_full_name: "",
  parent_id_input: "",
  parent_id_normalized: null,
  parent_relationship: "parent",
  parent_emergency_phone_input: "",
  parent_emergency_phone_canonical: null,
};

type BookingMode = "single" | "buy-package" | "use-package";

type Step = 1 | 2 | 3;

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  coachId: string;
  coachProfileId?: string;
  sessionType: "individual" | "group";
  price: number;
  currency?: string;
  coachName?: string;
  coachImage?: string;
  sport?: string;
  sessionDuration?: number;
  /** Pre-selected date (optional — skips to step 2 if provided with time) */
  selectedDate?: Date | null;
  /** Pre-selected time (optional — skips to step 3 if provided with date) */
  selectedTime?: string | null;
}

const STEP_LABELS: Record<Step, string> = {
  1: "Schedule",
  2: "Available",
  3: "Confirm",
};

const slideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 80 : -80,
    opacity: 0,
  }),
  center: { x: 0, opacity: 1 },
  exit: (direction: number) => ({
    x: direction > 0 ? -80 : 80,
    opacity: 0,
  }),
};

export const BookingModal = ({
  isOpen,
  onClose,
  coachId,
  coachProfileId,
  sessionType,
  price,
  currency = "USD",
  coachName = "Coach",
  coachImage,
  sport,
  sessionDuration = 60,
  selectedDate: preSelectedDate,
  selectedTime: preSelectedTime,
}: BookingModalProps) => {
  const [step, setStep] = useState<Step>(1);
  const [direction, setDirection] = useState(1);
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [time, setTime] = useState<string | undefined>(undefined);
  const [timeLabel, setTimeLabel] = useState("");
  const [notes, setNotes] = useState("");
  const [waiverAccepted, setWaiverAccepted] = useState(false);
  const [profileAge, setProfileAge] = useState<number | null>(null);
  const [profileLoaded, setProfileLoaded] = useState(false);
  const [parentalSignature, setParentalSignature] = useState<ParentalSignature>(EMPTY_PARENTAL_SIGNATURE);
  const [isBooking, setIsBooking] = useState(false);
  const [bookingMode, setBookingMode] = useState<BookingMode>("single");
  const [selectedPackage, setSelectedPackage] = useState<CoachPackage | null>(null);
  const [selectedUserPackage, setSelectedUserPackage] = useState<UserPackage | null>(null);
  const { toast } = useToast();
  const { startPayment, loading: paymentLoading } = usePaymentIntent();
  const bookingLimits = useBookingLimits();
  const { packages: coachPackages } = useCoachPackages(coachId);
  const { packages: userPackages, purchasePackage, useSession } = useUserPackages(coachId);

  // Resolve coach profile ID for availability lookup
  const [resolvedProfileId, setResolvedProfileId] = useState<string | undefined>(coachProfileId);
  useEffect(() => {
    if (coachProfileId) {
      setResolvedProfileId(coachProfileId);
      return;
    }
    if (!coachId) return;
    const lookup = async () => {
      const { data } = await supabase
        .from("coach_profiles")
        .select("id")
        .eq("id", coachId)
        .maybeSingle();
      if (data) setResolvedProfileId(data.id);
    };
    lookup();
  }, [coachId, coachProfileId]);

  const { slots: availabilitySlots } = useAvailability(resolvedProfileId);
  const { blocked } = useBlockedSlots(resolvedProfileId);
  const { bookedMap } = useBookedSlots(coachId);

  // Time slots for selected date
  const dateStr = date ? date.toISOString().split("T")[0] : "";
  const bookedForDate = dateStr ? bookedMap[dateStr] || [] : [];
  const { slots: timeSlots, bookedSlots } = useMemo(() => {
    if (!date) return { slots: [], bookedSlots: [] };
    return getSlotsForDateFromAvailability(availabilitySlots, date, bookedForDate, blocked);
  }, [availabilitySlots, date, bookedForDate, blocked]);

  const availableSlots = timeSlots.filter((s) => !bookedSlots.includes(s.time));

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      // If pre-selected date+time, jump to confirm
      if (preSelectedDate && preSelectedTime) {
        setDate(preSelectedDate);
        setTime(preSelectedTime);
        const h = parseInt(preSelectedTime.split(":")[0], 10);
        const ampm = h >= 12 ? "PM" : "AM";
        const displayH = h % 12 || 12;
        setTimeLabel(`${displayH}:00 ${ampm}`);
        setStep(3);
        setDirection(1);
      } else if (preSelectedDate) {
        setDate(preSelectedDate);
        setStep(2);
        setDirection(1);
      } else {
        setStep(1);
        setDirection(1);
      }
      setNotes("");
      setWaiverAccepted(false);
      setIsBooking(false);
    } else {
      setDate(undefined);
      setTime(undefined);
      setTimeLabel("");
      setNotes("");
      setWaiverAccepted(false);
      setStep(1);
      setDirection(1);
      setIsBooking(false);
      setBookingMode("single");
      setSelectedPackage(null);
      setSelectedUserPackage(null);
    }
  }, [isOpen, preSelectedDate, preSelectedTime]);

  // Fetch the trainee's age on modal open so we know whether to require a
  // parental signature on the waiver (under-18 = parent must sign).
  // See Trainee Waiver §7 + Privacy Policy §11.
  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || cancelled) return;
      const { data } = await supabase
        .from("profiles")
        .select("age")
        .eq("user_id", user.id)
        .maybeSingle();
      if (cancelled) return;
      setProfileAge((data?.age as number | null) ?? null);
      setProfileLoaded(true);
    })();
    return () => { cancelled = true; };
  }, [isOpen]);

  // Reset waiver state on close.
  useEffect(() => {
    if (!isOpen) {
      setWaiverAccepted(false);
      setParentalSignature(EMPTY_PARENTAL_SIGNATURE);
    }
  }, [isOpen]);

  const isMinor = profileLoaded && profileAge !== null && profileAge < 18;
  const ageUnknown = profileLoaded && profileAge === null;

  // For minors, parental signature must be complete before the waiver
  // checkbox can be enabled. For 18+, the checkbox is enough.
  const parentalSignatureValid =
    !isMinor ||
    (parentalSignature.parent_full_name.trim().length >= 2 &&
      parentalSignature.parent_id_normalized !== null &&
      parentalSignature.parent_emergency_phone_canonical !== null);

  // Helpers to validate-as-typed.
  const handleParentIdChange = (value: string) => {
    const result = validateIsraeliId(value);
    setParentalSignature((p) => ({
      ...p,
      parent_id_input: value,
      parent_id_normalized: result.valid ? result.normalized : null,
    }));
  };
  const handleParentPhoneChange = (value: string) => {
    const result = validateIsraeliMobile(value);
    setParentalSignature((p) => ({
      ...p,
      parent_emergency_phone_input: value,
      parent_emergency_phone_canonical: result.valid ? result.canonical : null,
    }));
  };

  const goTo = (nextStep: Step) => {
    setDirection(nextStep > step ? 1 : -1);
    setStep(nextStep);
  };

  const handleDateSelect = (d: Date | undefined) => {
    if (!d) return;
    setDate(d);
    setTime(undefined);
    setTimeLabel("");
    goTo(2);
  };

  const handleTimeSelect = (t: string, label: string) => {
    setTime(t);
    setTimeLabel(label);
    goTo(3);
  };

  const handleQuickBook = () => {
    const next = getNextAvailableFromSlots(availabilitySlots, bookedMap, blocked);
    if (next) {
      setDate(next.date);
      setTime(next.time);
      setTimeLabel(next.label);
      goTo(3);
    }
  };

  const effectivePrice = bookingMode === "buy-package" && selectedPackage
    ? selectedPackage.price
    : bookingMode === "use-package"
      ? 0
      : price;

  const effectiveCurrency = bookingMode === "buy-package" && selectedPackage
    ? selectedPackage.currency
    : currency;

  const hasPackageOptions = coachPackages.length > 0 || userPackages.length > 0;

  const handleConfirmAndPay = async () => {
    if (!date || !time) return;

    if (!waiverAccepted) {
      toast({
        title: "Please accept the waiver",
        description: "You must acknowledge the activity-risk waiver before booking.",
        variant: "destructive",
      });
      return;
    }

    // Check booking limits
    if (!bookingLimits.canBook) {
      toast({ title: "Booking Limit Reached", description: `You have ${bookingLimits.cap} pending requests — wait for a response or cancel one.`, variant: "destructive" });
      return;
    }

    // Check duplicate pending with same coach
    const hasDuplicate = await bookingLimits.hasPendingWithCoach(coachId);
    if (hasDuplicate) {
      toast({ title: "Duplicate Request", description: "You already have a pending request with this coach.", variant: "destructive" });
      return;
    }

    if (bookingMode === "buy-package" && !selectedPackage) {
      toast({ title: "Select a Package", description: "Please choose a package to purchase.", variant: "destructive" });
      return;
    }
    if (bookingMode === "use-package" && !selectedUserPackage) {
      toast({ title: "Select a Package", description: "Please choose a package to use.", variant: "destructive" });
      return;
    }

    try {
      setIsBooking(true);
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        toast({ title: "Authentication Required", description: "Please log in to book a session.", variant: "destructive" });
        return;
      }

      let userPackageId: string | null = null;

      // If buying a new package, create the user_package first
      if (bookingMode === "buy-package" && selectedPackage) {
        const purchased = await purchasePackage(
          selectedPackage.id,
          coachId,
          selectedPackage.session_count,
          selectedPackage.validity_days
        );
        if (!purchased) {
          toast({ title: "Purchase Failed", description: "Could not purchase the package. Please try again.", variant: "destructive" });
          return;
        }
        userPackageId = purchased.id;
        await useSession(purchased.id);
      }

      // If using an existing package, decrement a session
      if (bookingMode === "use-package" && selectedUserPackage) {
        userPackageId = selectedUserPackage.id;
        const used = await useSession(selectedUserPackage.id);
        if (!used) {
          toast({ title: "Error", description: "Could not use package session. Please try again.", variant: "destructive" });
          return;
        }
      }

      const bookingPrice = bookingMode === "use-package"
        ? 0
        : bookingMode === "buy-package" && selectedPackage
          ? selectedPackage.price / selectedPackage.session_count
          : price;

      // Record waiver acceptance to the immutable audit trail BEFORE creating
      // the booking, so the legal evidence exists even if the booking insert
      // later fails. We re-record on every booking — old rows are kept for
      // version-bump tracking.
      const waiverAcceptedAtIso = new Date().toISOString();
      const parentSignaturePayload = isMinor
        ? {
            parent_full_name: parentalSignature.parent_full_name.trim(),
            parent_id_normalized: parentalSignature.parent_id_normalized,
            parent_relationship: parentalSignature.parent_relationship,
            parent_emergency_phone: parentalSignature.parent_emergency_phone_canonical,
            minor_age_at_acceptance: profileAge,
          }
        : null;

      const { error: waiverInsertError } = await supabase
        .from("waiver_acceptances")
        .insert({
          user_id: user.id,
          waiver_version: WAIVER_VERSION,
          accepted_at: waiverAcceptedAtIso,
          user_agent: typeof navigator !== "undefined" ? navigator.userAgent : null,
          parent_signature: parentSignaturePayload,
        } as any);

      if (waiverInsertError) {
        console.error("[booking] waiver_acceptances insert failed", waiverInsertError);
      }

      const bookingInsert: Record<string, unknown> = {
        user_id: user.id,
        coach_id: coachId,
        coach_name: coachId,
        date: format(date, "yyyy-MM-dd"),
        time: time,
        time_label: timeLabel || time,
        status: bookingMode === "use-package" ? "confirmed" : "pending",
        training_type: sessionType,
        price: bookingPrice,
        payment_method: bookingMode === "use-package" ? "package" : "bit",
        waiver_accepted_at: waiverAcceptedAtIso,
      };
      if (userPackageId) {
        bookingInsert.package_id = userPackageId;
      }

      const { data: booking, error: bookingError } = await supabase
        .from("bookings")
        .insert(bookingInsert as any)
        .select("id")
        .single();

      if (bookingError) throw bookingError;

      // Notify coach of new booking (fire-and-forget)
      const athleteDisplayName = user.email?.split("@")[0] || "An athlete";
      supabase.functions.invoke("send-push", {
        body: {
          user_id: coachId,
          title: "New booking! 📅",
          body: `${athleteDisplayName} booked a session with you`,
          url: "/coach-dashboard",
        },
      }).catch(() => {});

      // Package bookings with existing credits skip payment
      if (bookingMode === "use-package") {
        toast({
          title: "Session Booked!",
          description: `Used 1 session from your package. ${selectedUserPackage!.sessions_total - selectedUserPackage!.sessions_used - 1} remaining.`,
        });
        onClose();
        return;
      }

      // Initiate payment via Make.com + Grow. The edge function generates
      // an idempotency key, creates a payment_intents row, and redirects
      // the browser to the Grow-hosted checkout URL returned by Make.com.
      await startPayment(booking.id);
    } catch (error) {
      console.error("Booking error:", error);
      toast({ title: "Booking Failed", description: "There was an error. Please try again.", variant: "destructive" });
    } finally {
      setIsBooking(false);
    }
  };

  const formatPrice = (amount: number, curr: string) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: curr }).format(amount);

  const isProcessing = isBooking || paymentLoading;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[440px] max-h-[92vh] overflow-y-auto p-0 gap-0 rounded-2xl border-border/30 bg-background">
        {/* ─── Kinetic Header ─── */}
        <div className="relative px-6 pt-7 pb-5">
          {step > 1 && (
            <button
              type="button"
              onClick={() => goTo((step - 1) as Step)}
              className="absolute left-4 top-5 h-8 w-8 rounded-full bg-card border border-border/40 flex items-center justify-center hover:bg-muted/40 transition-colors active:scale-95"
              aria-label="Back"
            >
              <ArrowLeft className="h-4 w-4 text-muted-foreground" />
            </button>
          )}

          {/* Big heading row: title + STEP X OF 3 */}
          <div className="flex justify-between items-end mb-3">
            <h2 className="font-black text-3xl tracking-tighter leading-none text-foreground">
              {STEP_LABELS[step]}
            </h2>
            <span className="text-[10px] font-black uppercase tracking-[0.25em] text-[#46f1c5]">
              Step {step} of 3
            </span>
          </div>

          {/* 3-segment kinetic progress bar */}
          <div className="flex gap-2">
            {([1, 2, 3] as Step[]).map((s) => (
              <div
                key={s}
                className={cn(
                  "h-1 flex-1 rounded-full transition-all duration-300",
                  s <= step ? "bg-gradient-kinetic" : "bg-muted/60"
                )}
              />
            ))}
          </div>
        </div>

        {/* ─── Content ─── */}
        <div className="px-5 pb-5 min-h-[320px]">
          <AnimatePresence mode="wait" custom={direction}>
            {/* ═══ STEP 1 — Session Type + Date ═══ */}
            {step === 1 && (
              <motion.div
                key="step-1"
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.2, ease: "easeInOut" }}
              >
                {/* Session Type pills */}
                <label className="text-[10px] font-black uppercase tracking-[0.25em] text-muted-foreground mb-3 block">
                  Session Type
                </label>
                <div className="grid grid-cols-3 gap-3 mb-8">
                  {([
                    { key: "individual", label: "Solo" },
                    { key: "group", label: "Duo" },
                    { key: "group", label: "Group" },
                  ] as const).map((opt, i) => {
                    const active = sessionType === opt.key && (opt.label === "Solo" ? true : i > 0);
                    return (
                      <button
                        key={opt.label}
                        type="button"
                        disabled
                        className={cn(
                          "h-12 px-2 rounded-full font-bold text-sm transition-all",
                          active
                            ? "bg-gradient-kinetic text-white shadow-[0_10px_20px_rgba(0,212,170,0.2)]"
                            : "bg-card border border-border/40 text-muted-foreground"
                        )}
                      >
                        {opt.label}
                      </button>
                    );
                  })}
                </div>

                {/* Quick Book */}
                <button
                  type="button"
                  onClick={handleQuickBook}
                  className="w-full flex items-center gap-3 p-3.5 rounded-lg bg-gradient-kinetic text-white shadow-[0_10px_30px_rgba(0,212,170,0.25)] hover:brightness-110 transition-all active:scale-[0.98] mb-6"
                >
                  <div className="h-10 w-10 rounded-lg bg-white/20 flex items-center justify-center flex-shrink-0">
                    <Zap className="h-5 w-5 text-white" fill="currentColor" strokeWidth={0} />
                  </div>
                  <div className="text-left flex-1">
                    <p className="text-sm font-black uppercase tracking-wider">Quick Book</p>
                    <p className="text-[11px] text-white/80">Next available slot</p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-white/70" />
                </button>

                <p className="text-[10px] font-black uppercase tracking-[0.25em] text-muted-foreground mb-3">
                  Or pick a date
                </p>

                <div className="flex justify-center rounded-lg bg-card border border-border/40 p-2">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={handleDateSelect}
                    disabled={(d) => !isDateAvailableFromSlots(availabilitySlots, d)}
                    className="p-3 pointer-events-auto"
                  />
                </div>
              </motion.div>
            )}

            {/* ═══ STEP 2 — Pick Time + Total Preview ═══ */}
            {step === 2 && (
              <motion.div
                key="step-2"
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.2, ease: "easeInOut" }}
              >
                {/* Selected date chip */}
                {date && (
                  <div className="mb-6">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#46f1c5]/10 border border-[#46f1c5]/30 text-[#46f1c5] text-xs font-black uppercase tracking-[0.15em]">
                      <CalendarDays className="h-3.5 w-3.5" />
                      {format(date, "EEEE, MMM d")}
                    </div>
                  </div>
                )}

                {availableSlots.length === 0 ? (
                  <div className="text-center py-10 bg-card border border-border/40 rounded-lg">
                    <Clock className="h-8 w-8 text-muted-foreground/40 mx-auto mb-3" />
                    <p className="text-sm font-bold text-foreground mb-1">No available slots</p>
                    <p className="text-xs text-muted-foreground mb-4">
                      Try a different date
                    </p>
                    <Button variant="outline" size="sm" onClick={() => goTo(1)}>
                      <ArrowLeft className="h-3.5 w-3.5 mr-1.5" />
                      Pick another date
                    </Button>
                  </div>
                ) : (
                  <>
                    <label className="text-[10px] font-black uppercase tracking-[0.25em] text-muted-foreground mb-3 block">
                      Available Slots
                    </label>

                    <div className="grid grid-cols-3 gap-3 mb-8">
                      {timeSlots.map((slot) => {
                        const isBooked = bookedSlots.includes(slot.time);
                        const isSelected = time === slot.time;
                        return (
                          <button
                            key={slot.time}
                            disabled={isBooked}
                            onClick={() => handleTimeSelect(slot.time, slot.label)}
                            className={cn(
                              "h-12 rounded-lg text-sm font-bold transition-all duration-200",
                              isBooked
                                ? "bg-card border border-border/40 text-muted-foreground/40 cursor-not-allowed line-through"
                                : isSelected
                                  ? "bg-[#46f1c5]/10 border-2 border-[#46f1c5] text-[#46f1c5]"
                                  : "bg-card text-foreground border border-transparent hover:border-[#46f1c5]/30 active:scale-95"
                            )}
                          >
                            {slot.time}
                          </button>
                        );
                      })}
                    </div>

                    {/* Total Investment preview */}
                    <div className="relative bg-card border border-border/40 p-5 rounded-lg overflow-hidden mb-2">
                      <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-kinetic blur-3xl opacity-10 pointer-events-none" />
                      <div className="relative z-10 flex justify-between items-center">
                        <div>
                          <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.25em] mb-1">
                            Total Investment
                          </p>
                          <h4 className="text-3xl font-black text-[#46f1c5] tracking-tighter">
                            {formatPrice(price, currency)}
                          </h4>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-foreground capitalize">
                            {sessionType === "individual" ? "Solo Session" : "Group Session"}
                          </p>
                          <p className="text-[10px] text-muted-foreground">
                            {sessionDuration} mins{sport ? ` · ${sport}` : ""}
                          </p>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </motion.div>
            )}

            {/* ═══ STEP 3 — Confirm + Pay ═══ */}
            {step === 3 && (
              <motion.div
                key="step-3"
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.2, ease: "easeInOut" }}
              >
                {/* Coach mini card */}
                <div className="flex items-center gap-3 p-3 rounded-2xl bg-secondary/50 mb-4">
                  {coachImage ? (
                    <img
                      src={coachImage}
                      alt={coachName}
                      className="h-12 w-12 rounded-xl object-cover"
                    />
                  ) : (
                    <div className="h-12 w-12 rounded-xl bg-brand-gradient flex items-center justify-center">
                      <User className="h-5 w-5 text-white" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-heading font-bold text-sm truncate">{coachName}</p>
                    {sport && (
                      <p className="text-[11px] text-muted-foreground capitalize">{sport}</p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="font-heading font-bold text-base gradient-text">
                      {bookingMode === "use-package"
                        ? "Included"
                        : formatPrice(effectivePrice, effectiveCurrency)}
                    </p>
                    <p className="text-[10px] text-muted-foreground">{sessionDuration}min</p>
                  </div>
                </div>

                {/* Session summary */}
                <div className="space-y-2.5 mb-4">
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-secondary/30">
                    <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <CalendarDays className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold">{date ? format(date, "EEEE, MMMM d, yyyy") : ""}</p>
                      <p className="text-[10px] text-muted-foreground">Date</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3 rounded-xl bg-secondary/30">
                    <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Clock className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold">{timeLabel || time}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {sessionType === "individual" ? "Individual" : "Group"} Session · {sessionDuration}min
                      </p>
                    </div>
                  </div>
                </div>

                {/* Package selection */}
                {hasPackageOptions && (
                  <div className="mb-4 space-y-2">
                    <p className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">
                      Booking type
                    </p>

                    {/* Single session */}
                    <button
                      type="button"
                      onClick={() => { setBookingMode("single"); setSelectedPackage(null); setSelectedUserPackage(null); }}
                      className={cn(
                        "w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-all",
                        bookingMode === "single"
                          ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                          : "border-border/30 hover:border-primary/30"
                      )}
                    >
                      <div className={cn(
                        "h-5 w-5 rounded-full border-2 flex items-center justify-center flex-shrink-0",
                        bookingMode === "single" ? "border-primary bg-primary" : "border-muted-foreground/30"
                      )}>
                        {bookingMode === "single" && <Check className="h-3 w-3 text-white" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold">Single Session</p>
                        <p className="text-[10px] text-muted-foreground">{formatPrice(price, currency)}</p>
                      </div>
                    </button>

                    {/* Owned packages */}
                    {userPackages.map((up) => (
                      <button
                        key={up.id}
                        type="button"
                        onClick={() => { setBookingMode("use-package"); setSelectedUserPackage(up); setSelectedPackage(null); }}
                        className={cn(
                          "w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-all",
                          bookingMode === "use-package" && selectedUserPackage?.id === up.id
                            ? "border-green-500 bg-green-500/5 ring-1 ring-green-500/20"
                            : "border-border/30 hover:border-green-500/30"
                        )}
                      >
                        <div className={cn(
                          "h-5 w-5 rounded-full border-2 flex items-center justify-center flex-shrink-0",
                          bookingMode === "use-package" && selectedUserPackage?.id === up.id
                            ? "border-green-500 bg-green-500"
                            : "border-muted-foreground/30"
                        )}>
                          {bookingMode === "use-package" && selectedUserPackage?.id === up.id && (
                            <Check className="h-3 w-3 text-white" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <Package className="h-3 w-3 text-green-600" />
                            <p className="text-xs font-semibold">{up.package_name || "Package"}</p>
                          </div>
                          <p className="text-[10px] text-green-600 font-medium">
                            {up.sessions_total - up.sessions_used}/{up.sessions_total} sessions left · Expires {format(new Date(up.expires_at), "MMM d")}
                          </p>
                        </div>
                        <span className="text-[10px] font-bold text-green-600 bg-green-100 dark:bg-green-900/30 px-2 py-0.5 rounded-full flex-shrink-0">
                          Free
                        </span>
                      </button>
                    ))}

                    {/* Buy new package */}
                    {coachPackages.map((pkg) => (
                      <button
                        key={pkg.id}
                        type="button"
                        onClick={() => { setBookingMode("buy-package"); setSelectedPackage(pkg); setSelectedUserPackage(null); }}
                        className={cn(
                          "w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-all",
                          bookingMode === "buy-package" && selectedPackage?.id === pkg.id
                            ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                            : "border-border/30 hover:border-primary/30"
                        )}
                      >
                        <div className={cn(
                          "h-5 w-5 rounded-full border-2 flex items-center justify-center flex-shrink-0",
                          bookingMode === "buy-package" && selectedPackage?.id === pkg.id
                            ? "border-primary bg-primary"
                            : "border-muted-foreground/30"
                        )}>
                          {bookingMode === "buy-package" && selectedPackage?.id === pkg.id && (
                            <Check className="h-3 w-3 text-white" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <Package className="h-3 w-3 text-primary" />
                            <p className="text-xs font-semibold">{pkg.name}</p>
                          </div>
                          <p className="text-[10px] text-muted-foreground">
                            {pkg.session_count} sessions · {pkg.validity_days} days
                          </p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="text-xs font-bold">{formatPrice(pkg.price, pkg.currency)}</p>
                          <p className="text-[10px] text-muted-foreground">
                            {formatPrice(pkg.price / pkg.session_count, pkg.currency)}/ea
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {/* Notes */}
                <div className="mb-4">
                  <label htmlFor="booking-notes" className="block text-[10px] uppercase tracking-wider font-semibold text-muted-foreground mb-1.5">
                    Notes for coach (optional)
                  </label>
                  <Textarea
                    id="booking-notes"
                    placeholder="Goals, focus areas, injuries to be aware of…"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={2}
                    className="rounded-xl border-border/30 bg-secondary/30 text-xs resize-none"
                  />
                </div>

                {/* Booking limit indicator */}
                {!bookingLimits.loading && (
                  <div className="flex items-center justify-between text-[10px] text-muted-foreground mb-2">
                    <span>{bookingLimits.pendingCount} / {bookingLimits.cap} pending slots used</span>
                    {!bookingLimits.canBook && (
                      <span className="text-destructive font-medium flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3" /> Limit reached
                      </span>
                    )}
                  </div>
                )}

                {/* Parental signature panel (under-18 trainees only) */}
                {(isMinor || ageUnknown) && (
                  <div className={cn(
                    "w-full p-3 rounded-xl border mb-3 space-y-2",
                    parentalSignatureValid
                      ? "border-primary/60 bg-primary/5"
                      : "border-amber-500/40 bg-amber-500/5"
                  )}>
                    <div className="flex items-center gap-1.5">
                      <ShieldAlert className="h-3 w-3 text-amber-500" />
                      <p className="text-[11px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                        Parental signature required
                      </p>
                    </div>
                    <p className="text-[11px] leading-snug text-muted-foreground">
                      {ageUnknown
                        ? "We don't have your age on file. If you are under 18, a parent or legal guardian must complete the fields below before booking."
                        : "Trainee is under 18 — Hebrew law requires a parent or legal guardian to sign the waiver."}
                    </p>
                    <input
                      type="text"
                      placeholder="Parent / guardian full name"
                      value={parentalSignature.parent_full_name}
                      onChange={(e) => setParentalSignature((p) => ({ ...p, parent_full_name: e.target.value }))}
                      className="w-full h-9 rounded-md border border-border bg-background px-2 text-[12px]"
                      aria-label="Parent or guardian full name"
                    />
                    <input
                      type="text"
                      inputMode="numeric"
                      dir="ltr"
                      placeholder="Teudat Zehut (9 digits)"
                      maxLength={9}
                      value={parentalSignature.parent_id_input}
                      onChange={(e) => handleParentIdChange(e.target.value)}
                      className={cn(
                        "w-full h-9 rounded-md border bg-background px-2 text-[12px] font-mono",
                        parentalSignature.parent_id_input.length > 0 && parentalSignature.parent_id_normalized === null
                          ? "border-destructive"
                          : "border-border"
                      )}
                      aria-label="Israeli ID (Teudat Zehut), 9 digits"
                      aria-invalid={parentalSignature.parent_id_input.length > 0 && parentalSignature.parent_id_normalized === null}
                    />
                    <select
                      value={parentalSignature.parent_relationship}
                      onChange={(e) => setParentalSignature((p) => ({ ...p, parent_relationship: e.target.value as "parent" | "guardian" }))}
                      className="w-full h-9 rounded-md border border-border bg-background px-2 text-[12px]"
                      aria-label="Relationship to minor"
                    >
                      <option value="parent">Parent</option>
                      <option value="guardian">Legal Guardian</option>
                    </select>
                    <input
                      type="tel"
                      inputMode="tel"
                      dir="ltr"
                      placeholder="Emergency contact phone (e.g. 054-551-6974)"
                      value={parentalSignature.parent_emergency_phone_input}
                      onChange={(e) => handleParentPhoneChange(e.target.value)}
                      className={cn(
                        "w-full h-9 rounded-md border bg-background px-2 text-[12px]",
                        parentalSignature.parent_emergency_phone_input.length > 0 && parentalSignature.parent_emergency_phone_canonical === null
                          ? "border-destructive"
                          : "border-border"
                      )}
                      aria-label="Israeli mobile phone for emergency contact"
                      aria-invalid={parentalSignature.parent_emergency_phone_input.length > 0 && parentalSignature.parent_emergency_phone_canonical === null}
                    />
                    <p className="text-[10px] text-muted-foreground/70 leading-snug">
                      Your ID is stored encrypted, used only as evidence of this signature, and never shared with anyone.
                    </p>
                  </div>
                )}

                {/* Activity-risk waiver — required */}
                <button
                  type="button"
                  onClick={() => parentalSignatureValid && setWaiverAccepted((v) => !v)}
                  disabled={!parentalSignatureValid}
                  className={cn(
                    "w-full flex items-start gap-3 p-3 rounded-xl border text-left transition-all mb-3",
                    waiverAccepted
                      ? "border-primary/60 bg-primary/5"
                      : parentalSignatureValid
                        ? "border-amber-500/40 bg-amber-500/5 hover:border-amber-500/60"
                        : "border-border/40 bg-muted/30 cursor-not-allowed opacity-60"
                  )}
                >
                  <div
                    className={cn(
                      "h-5 w-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 mt-0.5",
                      waiverAccepted
                        ? "border-primary bg-primary"
                        : "border-amber-500/60"
                    )}
                  >
                    {waiverAccepted && <Check className="h-3 w-3 text-white" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <ShieldAlert className="h-3 w-3 text-amber-500" />
                      <p className="text-[11px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                        Activity-risk waiver
                      </p>
                    </div>
                    <p className="text-[11px] leading-snug text-muted-foreground">
                      I understand physical activity carries risk of injury. I release Circlo and
                      the coach from claims arising from this session. Circlo is a platform that
                      connects athletes with independent coaches — it does not provide coaching
                      services itself.
                    </p>
                  </div>
                </button>

                {/* Confirm booking — kinetic pill */}
                <button
                  onClick={handleConfirmAndPay}
                  disabled={isProcessing || !bookingLimits.canBook || !waiverAccepted || !parentalSignatureValid}
                  className="w-full h-14 rounded-full bg-gradient-kinetic text-white font-black text-sm tracking-[0.15em] uppercase shadow-[0_15px_30px_rgba(0,212,170,0.3)] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none inline-flex items-center justify-center gap-2"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Processing…
                    </>
                  ) : bookingMode === "use-package" ? (
                    <>
                      <Package className="h-4 w-4" />
                      Book with Package
                    </>
                  ) : bookingMode === "buy-package" ? (
                    <>
                      <Sparkles className="h-4 w-4" />
                      Buy & Book · {formatPrice(effectivePrice, effectiveCurrency)}
                    </>
                  ) : (
                    <>Confirm booking · {formatPrice(price, currency)}</>
                  )}
                </button>

                <p className="text-center text-[10px] text-muted-foreground/50 mt-2">
                  {bookingMode === "use-package"
                    ? "Session will be deducted from your package"
                    : "You'll be redirected to complete payment"}
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </DialogContent>
    </Dialog>
  );
};
