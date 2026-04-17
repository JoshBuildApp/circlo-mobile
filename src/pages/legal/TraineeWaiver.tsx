import { useNavigate } from "react-router-dom";
import { ChevronLeft, AlertTriangle, ShieldAlert } from "lucide-react";

const TraineeWaiver = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="px-4 pt-4 pb-3 flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="h-9 w-9 rounded-xl bg-secondary flex items-center justify-center active:scale-95 transition-transform"
          aria-label="Back"
        >
          <ChevronLeft className="h-4 w-4 text-foreground" />
        </button>
        <h1 className="text-lg font-bold text-foreground">Trainee Waiver</h1>
      </div>

      <div className="px-4 space-y-6">
        <div className="flex items-start gap-3 p-4 rounded-2xl bg-amber-500/5 border border-amber-500/20">
          <AlertTriangle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-foreground">Placeholder — draft in progress</p>
            <p className="text-xs text-muted-foreground mt-1">
              The final Trainee Waiver is being prepared by legal counsel. This page is a stub
              so the route renders; it is not the binding waiver.
            </p>
          </div>
        </div>

        <div className="rounded-2xl border border-border/10 bg-card p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <ShieldAlert className="h-5 w-5 text-primary" />
            </div>
            <p className="text-sm font-bold text-foreground">What this document will cover</p>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Acknowledgement that physical training carries inherent risk, that coaches operate
            independently of Circlo, and that participants are responsible for ensuring they are
            medically fit to train. Will cover assumption of risk, medical disclosure, and
            Circlo's role as a connector rather than a service provider.
          </p>
        </div>

        <p className="text-[10px] text-muted-foreground/60 text-center px-4">
          Questions? Contact support@circloclub.com
        </p>
      </div>
    </div>
  );
};

export default TraineeWaiver;
