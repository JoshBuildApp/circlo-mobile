import { useState } from "react";
import { Package, Check, Zap, Clock, ChevronRight, Sparkles } from "lucide-react";
import { useCoachPackages, CoachPackage } from "@/hooks/use-coach-packages";
import { useUserPackages, UserPackage } from "@/hooks/use-user-packages";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface CoachPackagesSectionProps {
  coachId: string;
  coachName: string;
  onBookWithPackage?: () => void;
}

export default function CoachPackagesSection({
  coachId,
  coachName,
  onBookWithPackage,
}: CoachPackagesSectionProps) {
  const { user } = useAuth();
  const { packages, loading } = useCoachPackages(coachId);
  const { packages: ownedPackages, loading: ownedLoading, purchasePackage } = useUserPackages(coachId);
  const [purchasing, setPurchasing] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);

  if (loading || packages.length === 0) return null;

  const preview = expanded ? packages : packages.slice(0, 2);
  const hasMore = packages.length > 2;

  const handlePurchase = async (pkg: CoachPackage) => {
    if (!user) {
      toast.error("Log in to purchase packages");
      return;
    }
    setPurchasing(pkg.id);
    const result = await purchasePackage(pkg.id, coachId, pkg.session_count, pkg.validity_days);
    setPurchasing(null);
    if (result) {
      toast.success(`${pkg.name} purchased!`);
    } else {
      toast.error("Purchase failed — please try again");
    }
  };

  const perSession = (pkg: CoachPackage) =>
    Math.round(pkg.price / pkg.session_count);

  return (
    <div className="px-5 pb-4">
      <div className="bg-card rounded-2xl border border-border/10 overflow-hidden">
        {/* Header */}
        <div className="flex items-center gap-2.5 px-4 pt-4 pb-2">
          <div className="h-8 w-8 rounded-xl bg-brand-gradient flex items-center justify-center shadow-brand-sm">
            <Package className="h-4 w-4 text-primary-foreground" />
          </div>
          <div>
            <p className="text-[13px] font-heading font-bold text-foreground">Training Packages</p>
            <p className="text-[10px] text-muted-foreground">
              Save with bundles by {coachName}
            </p>
          </div>
        </div>

        {/* Owned packages banner */}
        {!ownedLoading && ownedPackages.length > 0 && (
          <div className="mx-4 mb-2">
            {ownedPackages.map((op: UserPackage) => (
              <button
                key={op.id}
                onClick={onBookWithPackage}
                className="w-full flex items-center gap-3 p-3 rounded-xl bg-primary/10 border border-primary/20 mb-1.5 last:mb-0 active:scale-[0.98] transition-transform text-left"
              >
                <div className="h-9 w-9 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0">
                  <Check className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-foreground truncate">
                    {op.package_name || "Package"}
                  </p>
                  <p className="text-[10px] text-primary font-semibold">
                    {op.sessions_total - op.sessions_used} of {op.sessions_total} sessions left
                  </p>
                </div>
                <ChevronRight className="h-4 w-4 text-primary/60 flex-shrink-0" />
              </button>
            ))}
          </div>
        )}

        {/* Package cards */}
        <div className="px-4 pb-4 space-y-2">
          {preview.map((pkg, i) => {
            const isBest = packages.length > 1 && i === packages.length - 1 && expanded;
            return (
              <div
                key={pkg.id}
                className={cn(
                  "relative rounded-xl border p-3.5 transition-all",
                  isBest
                    ? "border-primary/30 bg-primary/5"
                    : "border-border/10 bg-background/50"
                )}
              >
                {isBest && (
                  <div className="absolute -top-2.5 right-3 flex items-center gap-1 bg-brand-gradient text-primary-foreground text-[9px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full shadow-brand-sm">
                    <Sparkles className="h-3 w-3" /> Best Value
                  </div>
                )}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-heading font-bold text-foreground">{pkg.name}</p>
                    {pkg.description && (
                      <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2">
                        {pkg.description}
                      </p>
                    )}
                    <div className="flex items-center gap-3 mt-2">
                      <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                        <Zap className="h-3 w-3" />
                        {pkg.session_count} session{pkg.session_count !== 1 ? "s" : ""}
                      </span>
                      <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {pkg.validity_days} days
                      </span>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="font-heading text-lg font-bold gradient-text">
                      ₪{pkg.price}
                    </p>
                    {pkg.session_count > 1 && (
                      <p className="text-[10px] text-muted-foreground">
                        ₪{perSession(pkg)}/session
                      </p>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => handlePurchase(pkg)}
                  disabled={purchasing === pkg.id}
                  className={cn(
                    "w-full mt-3 py-2.5 rounded-xl text-xs font-bold transition-all active:scale-[0.97]",
                    isBest
                      ? "bg-brand-gradient text-primary-foreground shadow-brand-sm"
                      : "bg-secondary text-foreground hover:bg-secondary/80"
                  )}
                >
                  {purchasing === pkg.id ? "Processing..." : `Get ${pkg.name}`}
                </button>
              </div>
            );
          })}

          {hasMore && !expanded && (
            <button
              onClick={() => setExpanded(true)}
              className="w-full flex items-center justify-center gap-1.5 py-2 text-xs font-semibold text-primary active:opacity-70 transition-opacity"
            >
              View all {packages.length} packages
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
