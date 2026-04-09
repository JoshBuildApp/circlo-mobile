import { useState, useEffect, useRef } from "react";
import { X, ShoppingBag, Tag, MessageCircle, Share2, ChevronDown } from "lucide-react";
import { SafeImage } from "@/components/ui/safe-image";
import type { Product } from "@/hooks/use-products";
import { toast } from "sonner";

interface ProductDetailModalProps {
  product: Product | null;
  coachName: string;
  onClose: () => void;
}

const fmtPrice = (price: number, currency: string) => {
  if (currency === "ILS") return `₪${price}`;
  if (currency === "USD") return `$${price}`;
  return `${price} ${currency}`;
};

const ProductDetailModal = ({ product, coachName, onClose }: ProductDetailModalProps) => {
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [translateY, setTranslateY] = useState(0);
  const contentRef = useRef<HTMLDivElement>(null);

  // Lock body scroll
  useEffect(() => {
    if (product) {
      document.body.style.overflow = "hidden";
      setTranslateY(0);
    }
    return () => { document.body.style.overflow = ""; };
  }, [product]);

  if (!product) return null;

  const handleShare = () => {
    const url = window.location.href;
    if (navigator.share) {
      navigator.share({ title: product.name, text: `${product.name} by ${coachName}`, url }).catch(() => {});
    } else {
      navigator.clipboard.writeText(url);
      toast.success("Link copied!");
    }
  };

  const handleContact = () => {
    toast.info("Contact the coach to purchase this product");
  };

  // Swipe down to close
  const onTouchStart = (e: React.TouchEvent) => {
    if (contentRef.current && contentRef.current.scrollTop <= 0) {
      setTouchStart(e.touches[0].clientY);
    }
  };
  const onTouchMove = (e: React.TouchEvent) => {
    if (touchStart === null) return;
    const diff = e.touches[0].clientY - touchStart;
    if (diff > 0) setTranslateY(diff);
  };
  const onTouchEnd = () => {
    if (translateY > 120) onClose();
    else setTranslateY(0);
    setTouchStart(null);
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-background animate-fade-in flex flex-col"
      style={{
        transform: `translateY(${translateY}px)`,
        opacity: translateY > 80 ? 1 - (translateY - 80) / 120 : 1,
        transition: touchStart !== null ? "none" : "transform 0.3s ease, opacity 0.3s ease",
      }}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 safe-area-top flex-shrink-0">
        <button
          onClick={onClose}
          className="h-10 w-10 rounded-full bg-secondary flex items-center justify-center active:scale-95 transition-transform"
        >
          <X className="h-5 w-5 text-foreground" />
        </button>
        <div className="flex items-center gap-1 text-muted-foreground">
          <ChevronDown className="h-3.5 w-3.5" />
          <span className="text-[10px] font-medium">Swipe down to close</span>
        </div>
        <button
          onClick={handleShare}
          className="h-10 w-10 rounded-full bg-secondary flex items-center justify-center active:scale-95 transition-transform"
        >
          <Share2 className="h-4.5 w-4.5 text-foreground" />
        </button>
      </div>

      {/* Scrollable content */}
      <div ref={contentRef} className="flex-1 overflow-y-auto">
        {/* Hero image */}
        <div className="aspect-[4/5] bg-secondary relative mx-4 rounded-3xl overflow-hidden">
          <SafeImage
            src={product.image_url || ""}
            alt={product.name}
            className="h-full w-full object-cover"
            fallbackIcon={
              <ShoppingBag className="h-20 w-20 text-muted-foreground/15" />
            }
          />
          {product.stock === 0 && (
            <div className="absolute inset-0 bg-background/50 backdrop-blur-sm flex items-center justify-center">
              <span className="text-lg font-bold text-muted-foreground bg-background/80 px-6 py-3 rounded-2xl">Sold Out</span>
            </div>
          )}
        </div>

        {/* Product info */}
        <div className="px-5 pt-5 pb-8 space-y-5">
          {/* Price + name */}
          <div>
            <p className="text-3xl font-heading font-bold text-primary leading-none">
              {fmtPrice(product.price, product.currency)}
            </p>
            <h3 className="text-xl font-heading font-bold text-foreground leading-snug mt-2">{product.name}</h3>
            <p className="text-sm text-muted-foreground mt-1">by {coachName}</p>
          </div>

          {/* Category + stock */}
          <div className="flex items-center gap-3">
            {product.category && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-secondary">
                <Tag className="h-3 w-3 text-muted-foreground" />
                <span className="text-[11px] text-muted-foreground font-medium capitalize">{product.category}</span>
              </div>
            )}
            {product.stock >= 0 && product.stock !== -1 && (
              <span className={`text-[11px] font-medium ${product.stock <= 3 && product.stock > 0 ? "text-destructive" : "text-muted-foreground"}`}>
                {product.stock > 0 ? `${product.stock} in stock` : "Currently unavailable"}
              </span>
            )}
          </div>

          {/* Description */}
          {product.description && (
            <div className="bg-card rounded-2xl border border-border/10 p-4">
              <p className="text-xs font-bold text-foreground mb-2">Description</p>
              <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                {product.description}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Sticky CTA */}
      <div className="px-5 py-4 border-t border-border/10 bg-background safe-area-bottom flex-shrink-0">
        <button
          onClick={handleContact}
          disabled={product.stock === 0}
          className="w-full h-14 rounded-2xl bg-brand-gradient text-primary-foreground font-heading font-bold text-[15px] flex items-center justify-center gap-2.5 active:scale-[0.97] transition-all shadow-brand-sm disabled:opacity-50 disabled:pointer-events-none"
        >
          <MessageCircle className="h-5 w-5" />
          Contact Coach to Buy
        </button>
      </div>
    </div>
  );
};

export default ProductDetailModal;
