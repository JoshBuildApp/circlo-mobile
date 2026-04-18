import { useNavigate } from "react-router-dom";
import { isV2Enabled, setV2Enabled } from "@/lib/v2/featureFlag";
import { PhoneFrame, StatusBar } from "@/components/v2/shared";

export default function EnableV2() {
  const navigate = useNavigate();
  const on = isV2Enabled();
  return (
    <PhoneFrame className="min-h-[100dvh]">
      <StatusBar />
      <main className="flex-1 px-6 pt-12 pb-24 flex flex-col gap-8">
        <header>
          <span className="inline-block px-3 py-1 rounded-full bg-orange-dim text-orange text-[11px] font-bold tracking-wider">
            BETA · COMING SOON
          </span>
          <h1 className="mt-5 text-[34px] font-extrabold leading-tight tracking-tight">
            Circlo <span className="text-teal">v2</span>
          </h1>
          <p className="mt-2 text-[14px] text-v2-muted leading-relaxed">
            A full redesign of the Circlo mobile experience — new profile, booking
            flow, Bob AI for coaches, calendar, training plans, and more.
          </p>
        </header>

        <section className="rounded-[16px] bg-navy-card p-4 space-y-3">
          <div className="text-[10px] text-v2-muted font-bold tracking-wider uppercase">Status</div>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[15px] font-bold text-offwhite">v2 interface</div>
              <div className="text-[12px] text-v2-muted mt-0.5">
                {on ? "On — you'll see v2 routes at /v2/*" : "Off — /v2/* routes redirect here"}
              </div>
            </div>
            <button
              onClick={() => setV2Enabled(!on)}
              className={`px-4 py-2 rounded-[12px] font-bold text-[13px] transition-colors ${
                on ? "bg-danger text-white" : "bg-teal text-navy-deep"
              }`}
            >
              {on ? "Turn off" : "Turn on"}
            </button>
          </div>
        </section>

        <section className="rounded-[16px] bg-navy-card p-4">
          <div className="text-[10px] text-v2-muted font-bold tracking-wider uppercase mb-3">What's inside</div>
          <ul className="space-y-2 text-[13px] leading-relaxed text-offwhite">
            <li>• Home · Discover · Coach profiles (4 tabs)</li>
            <li>• Booking flow (5 steps + success)</li>
            <li>• Messaging with coaches and circles</li>
            <li>• Bob AI dashboard for coaches (Pro only)</li>
            <li>• Calendar with training plans</li>
            <li>• Content library + live viewer</li>
          </ul>
        </section>

        {on && (
          <button
            onClick={() => navigate("/v2/home")}
            className="w-full py-4 rounded-[16px] bg-teal text-navy-deep font-extrabold text-[15px]"
          >
            Enter v2 →
          </button>
        )}

        <button
          onClick={() => navigate("/home")}
          className="text-[13px] text-v2-muted text-center"
        >
          Back to Circlo v1
        </button>
      </main>
    </PhoneFrame>
  );
}
