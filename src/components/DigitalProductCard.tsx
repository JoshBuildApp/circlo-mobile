import { useState } from "react";
import { FileText, Video, ListChecks, ShoppingCart, Loader2, CheckCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface DigitalProduct {
  id: string;
  coach_id: string;
  title: string;
  description: string | null;
  price: number;
  file_type: "pdf" | "video" | "plan";
  file_url: string | null;
  is_active: boolean;
  created_at: string;
}

const FILE_TYPE_ICON = {
  pdf: FileText,
  video: Video,
  plan: ListChecks,
};

const FILE_TYPE_LABEL = {
  pdf: "PDF",
  video: "Video",
  plan: "Training Plan",
};

const FILE_TYPE_COLOR = {
  pdf: "bg-red-500/10 text-red-500 border-red-500/20",
  video: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  plan: "bg-green-500/10 text-green-500 border-green-500/20",
};

interface Props {
  product: DigitalProduct;
  onPurchased?: () => void;
}

const DigitalProductCard = ({ product, onPurchased }: Props) => {
  const { user } = useAuth();
  const [purchasing, setPurchasing] = useState(false);
  const [purchased, setPurchased] = useState(false);

  const Icon = FILE_TYPE_ICON[product.file_type] || FileText;

  const handlePurchase = async () => {
    if (!user) {
      toast.error("Please log in to purchase");
      return;
    }
    setPurchasing(true);
    try {
      const { error } = await (supabase.from as any)("digital_product_purchases").insert({
        product_id: product.id,
        buyer_id: user.id,
        price: product.price,
        status: "completed",
      });
      if (error) throw error;
      setPurchased(true);
      toast.success("Purchase complete! Check your downloads.");
      onPurchased?.();
    } catch (err: any) {
      toast.error(err.message || "Purchase failed");
    } finally {
      setPurchasing(false);
    }
  };

  return (
    <div className="bg-card rounded-2xl border border-border/10 p-4 space-y-3 shadow-sm hover:shadow-md transition-shadow">
      {/* Top row */}
      <div className="flex items-start gap-3">
        <div className="h-10 w-10 rounded-xl bg-secondary flex items-center justify-center flex-shrink-0">
          <Icon className="h-5 w-5 text-muted-foreground" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[13px] font-heading font-bold text-foreground line-clamp-2 leading-tight">
            {product.title}
          </p>
          <span
            className={`inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-lg border text-[9px] font-bold uppercase tracking-wide ${FILE_TYPE_COLOR[product.file_type]}`}
          >
            <Icon className="h-2.5 w-2.5" />
            {FILE_TYPE_LABEL[product.file_type]}
          </span>
        </div>
      </div>

      {/* Description */}
      {product.description && (
        <p className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed">
          {product.description}
        </p>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between pt-1">
        <p className="text-lg font-heading font-bold text-primary">₪{product.price}</p>
        <button
          onClick={handlePurchase}
          disabled={purchasing || purchased}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold active:scale-[0.97] transition-transform disabled:opacity-60"
        >
          {purchased ? (
            <>
              <CheckCircle className="h-3.5 w-3.5" />
              Purchased
            </>
          ) : purchasing ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Processing…
            </>
          ) : (
            <>
              <ShoppingCart className="h-3.5 w-3.5" />
              Purchase
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default DigitalProductCard;
