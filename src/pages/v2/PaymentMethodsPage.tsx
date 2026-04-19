import { useNavigate } from "react-router-dom";
import { ChevronLeft, Plus, MoreHorizontal, Check, X } from "lucide-react";
import { PhoneFrame, StatusBar, RoundButton } from "@/components/v2/shared";
import { formatPrice } from "@/lib/v2/currency";

const HISTORY = [
  { id: "h1", title: "Session with Maya R.", date: "Dec 12 · Visa ···· 4242", amount: 294, status: "Paid" as const },
  { id: "h2", title: "Maya's Circle · Member", date: "Dec 1 · Monthly · Visa ···· 4242", amount: 59, status: "Paid" as const },
  { id: "h3", title: "Session with Maya R.", date: "Nov 28 · Visa ···· 4242", amount: 294, status: "Paid" as const },
  { id: "h4", title: "Session with Daniel K.", date: "Nov 22 · Cancelled by coach", amount: 240, status: "Refunded" as const },
];

export default function PaymentMethodsPage() {
  const navigate = useNavigate();
  return (
    <PhoneFrame className="min-h-[100dvh] pb-12">
      <StatusBar />
      <header className="px-5 pt-2.5 flex items-center justify-between">
        <RoundButton ariaLabel="Back" variant="solid-navy" size="sm" onClick={() => navigate("/v2/profile/settings")}>
          <ChevronLeft size={14} />
        </RoundButton>
        <h3 className="text-[17px] font-bold">Payment methods</h3>
        <RoundButton ariaLabel="Add" variant="solid-navy" size="sm">
          <Plus size={14} strokeWidth={2.5} />
        </RoundButton>
      </header>

      <div className="px-5 pt-5">
        <div
          className="p-5 rounded-[18px] relative overflow-hidden h-[180px] flex flex-col justify-between"
          style={{ background: "linear-gradient(135deg, #1a1f71 0%, #0f1447 100%)" }}
        >
          <div className="flex justify-between items-start">
            <div>
              <div className="text-[10px] text-white/70 font-bold tracking-widest">DEFAULT</div>
              <div className="text-[11px] text-white/60 mt-1">Personal</div>
            </div>
            <div className="font-extrabold text-[22px] text-white italic tracking-tight">VISA</div>
          </div>
          <div>
            <div className="text-[20px] font-semibold text-white tracking-widest mb-3 tnum">···· ···· ···· 4242</div>
            <div className="flex justify-between items-end">
              <div>
                <div className="text-[9px] text-white/60 font-semibold tracking-widest">CARDHOLDER</div>
                <div className="text-[13px] text-white font-semibold mt-0.5">Guy Cohen</div>
              </div>
              <div>
                <div className="text-[9px] text-white/60 font-semibold tracking-widest">EXPIRES</div>
                <div className="text-[13px] text-white font-semibold mt-0.5 tnum">09/27</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="px-5 pt-5 pb-2.5 text-[10px] text-v2-muted font-bold tracking-widest uppercase">OTHER METHODS</div>
      <div className="px-5 pb-2.5">
        <div className="p-3.5 rounded-[14px] bg-navy-card flex gap-3.5 items-center">
          <div className="w-11 h-11 rounded-[10px] bg-black flex items-center justify-center text-white text-[11px] font-bold">Pay</div>
          <div className="flex-1">
            <div className="text-[14px] font-bold">Apple Pay</div>
            <div className="text-[11px] text-v2-muted mt-0.5">Connected · iPhone 15</div>
          </div>
          <button aria-label="More" className="text-v2-muted">
            <MoreHorizontal size={16} />
          </button>
        </div>
      </div>

      <div className="px-5 pb-5">
        <button className="w-full py-3.5 rounded-[14px] bg-transparent border border-dashed border-navy-line text-v2-muted text-[13px] font-semibold flex items-center justify-center gap-1.5">
          <Plus size={14} strokeWidth={2.5} />
          Add payment method
        </button>
      </div>

      <div className="px-5 pb-2.5 text-[10px] text-v2-muted font-bold tracking-widest uppercase">BILLING HISTORY</div>
      <div className="px-5 flex flex-col gap-2 mb-5">
        {HISTORY.map((h) => {
          const refunded = h.status === "Refunded";
          return (
            <div key={h.id} className="p-3.5 rounded-[14px] bg-navy-card flex gap-3.5 items-center">
              <div className={`w-10 h-10 rounded-[10px] flex items-center justify-center shrink-0 ${refunded ? "bg-danger/15 text-danger" : "bg-teal-dim text-teal"}`}>
                {refunded ? <X size={18} /> : <Check size={18} strokeWidth={2.5} />}
              </div>
              <div className="flex-1">
                <div className="text-[13px] font-bold">{h.title}</div>
                <div className="text-[11px] text-v2-muted mt-0.5">{h.date}</div>
              </div>
              <div className="text-right">
                <div className={`text-[14px] font-bold tnum ${refunded ? "text-v2-muted line-through" : ""}`}>{formatPrice(h.amount)}</div>
                <div className={`text-[10px] font-semibold ${refunded ? "text-v2-muted" : "text-teal"}`}>{h.status}</div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="px-5 pb-12">
        <button className="w-full py-3 rounded-[12px] bg-transparent text-v2-muted border border-navy-line font-semibold text-[13px]">
          View all transactions
        </button>
      </div>
    </PhoneFrame>
  );
}
