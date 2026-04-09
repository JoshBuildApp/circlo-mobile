import { useState, useMemo } from "react";
import { ShoppingBag, Tag, Sparkles, ChevronRight } from "lucide-react";
import { SafeImage } from "@/components/ui/safe-image";
import type { Product } from "@/hooks/use-products";
import ProductDetailModal from "./ProductDetailModal";
import { useAuth } from "@/contexts/AuthContext";

interface CoachStoreProps {
  products: Product[];
  coachName: string;
  coachId: string;
}

const fmtPrice = (price: number, currency: string) => {
  if (currency === "ILS") return `₪${price}`;
  if (currency === "USD") return `$${price}`;
  return `${price} ${currency}`;
};

const isNew = (createdAt: string) => {
  const diff = Date.now() - new Date(createdAt).getTime();
  return diff < 7 * 24 * 60 * 60 * 1000; // 7 days
};

const CoachStore = ({ products, coachName, coachId }: CoachStoreProps) => {
  const [selected, setSelected] = useState<Product | null>(null);
  const [filter, setFilter] = useState<string>("all");
  const { role } = useAuth();
  const isCoach = role === "coach" || role === "admin" || role === "developer";

  const categories = useMemo(() => {
    const cats = new Set(products.map((p) => p.category).filter(Boolean));
    return ["all", ...Array.from(cats)] as string[];
  }, [products]);

  const filtered = useMemo(() => {
    if (filter === "all") return products;
    return products.filter((p) => p.category === filter);
  }, [products, filter]);

  if (products.length === 0) {
    return (
      <div className="text-center py-20 px-6">
        <div className="h-20 w-20 rounded-3xl bg-secondary flex items-center justify-center mx-auto mb-4">
          <ShoppingBag className="h-9 w-9 text-muted-foreground/30" />
        </div>
        <p className="text-base font-heading font-bold text-foreground mb-1">No products yet</p>
        <p className="text-sm text-muted-foreground max-w-[240px] mx-auto">
          {isCoach ? "Add your first product from the dashboard" : "This coach hasn't added any products yet"}
        </p>
        {isCoach && (
          <a
            href="/dashboard"
            className="inline-flex items-center gap-2 mt-4 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-bold active:scale-95 transition-transform"
          >
            <Sparkles className="h-4 w-4" /> Add Product
          </a>
        )}
      </div>
    );
  }

  return (
    <>
      <div className="animate-fade-in">
        {/* Store header */}
        <div className="px-5 pt-5 pb-3">
          <h2 className="font-heading text-lg font-bold text-foreground">Shop by {coachName}</h2>
          <p className="text-xs text-muted-foreground mt-0.5">{products.length} product{products.length !== 1 ? "s" : ""} available</p>
        </div>

        {/* Category filters */}
        {categories.length > 2 && (
          <div className="flex gap-2 px-5 pb-4 overflow-x-auto hide-scrollbar">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setFilter(cat)}
                className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all active:scale-95 ${
                  filter === cat
                    ? "bg-foreground text-background"
                    : "bg-secondary text-muted-foreground"
                }`}
              >
                {cat === "all" ? "All" : cat.charAt(0).toUpperCase() + cat.slice(1)}
              </button>
            ))}
          </div>
        )}

        {/* Product grid */}
        <div className="grid grid-cols-2 gap-3 px-4 pb-8">
          {filtered.map((product) => (
            <button
              key={product.id}
              onClick={() => setSelected(product)}
              className="bg-card rounded-2xl border border-border/5 overflow-hidden text-left active:scale-[0.97] transition-all group shadow-sm hover:shadow-md"
            >
              {/* Image */}
              <div className="aspect-[4/5] bg-secondary relative overflow-hidden">
                <SafeImage
                  src={product.image_url || ""}
                  alt={product.name}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  fallbackIcon={
                    <ShoppingBag className="h-8 w-8 text-muted-foreground/20" />
                  }
                />
                {/* Badges */}
                <div className="absolute top-2 left-2 flex flex-col gap-1">
                  {isNew(product.created_at) && (
                    <span className="px-2.5 py-1 rounded-lg bg-primary text-primary-foreground text-[9px] font-bold uppercase tracking-wider shadow-sm">
                      New
                    </span>
                  )}
                </div>
                {product.stock > 0 && product.stock <= 3 && (
                  <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded-md bg-destructive/90 text-destructive-foreground text-[9px] font-bold">
                    Only {product.stock} left
                  </span>
                )}
                {product.stock === 0 && (
                  <div className="absolute inset-0 bg-background/60 backdrop-blur-[2px] flex items-center justify-center">
                    <span className="text-xs font-bold text-muted-foreground bg-background/80 px-3 py-1.5 rounded-lg">Sold Out</span>
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="p-3 space-y-1.5">
                <p className="text-[13px] font-bold text-foreground line-clamp-2 leading-tight">
                  {product.name}
                </p>
                {product.category && (
                  <div className="flex items-center gap-1">
                    <Tag className="h-2.5 w-2.5 text-muted-foreground/50" />
                    <span className="text-[10px] text-muted-foreground capitalize">{product.category}</span>
                  </div>
                )}
                <p className="text-[15px] font-heading font-bold text-primary">
                  {fmtPrice(product.price, product.currency)}
                </p>
              </div>
            </button>
          ))}
        </div>
      </div>

      <ProductDetailModal
        product={selected}
        coachName={coachName}
        onClose={() => setSelected(null)}
      />
    </>
  );
};

/* ─── Store Preview Strip (shown above tabs) ─── */
export const StorePreviewStrip = ({
  products,
  coachName,
  onViewAll,
}: {
  products: Product[];
  coachName: string;
  onViewAll: () => void;
}) => {
  const [selected, setSelected] = useState<Product | null>(null);
  const preview = products.slice(0, 4);

  if (preview.length === 0) return null;

  return (
    <>
      <div className="px-5 pb-4">
        <div className="bg-card rounded-2xl border border-border/10 overflow-hidden">
          {/* Header */}
          <button
            onClick={onViewAll}
            className="w-full flex items-center justify-between px-4 pt-4 pb-2 active:bg-secondary/30 transition-colors"
          >
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-xl bg-brand-gradient flex items-center justify-center shadow-brand-sm">
                <ShoppingBag className="h-4 w-4 text-primary-foreground" />
              </div>
              <div className="text-left">
                <p className="text-[13px] font-heading font-bold text-foreground">Shop</p>
                <p className="text-[10px] text-muted-foreground">{products.length} item{products.length !== 1 ? "s" : ""}</p>
              </div>
            </div>
            <div className="flex items-center gap-1 text-primary">
              <span className="text-[11px] font-bold">View All</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </div>
          </button>

          {/* Horizontal scroll */}
          <div className="flex gap-2.5 px-4 pb-4 overflow-x-auto hide-scrollbar">
            {preview.map((product) => (
              <button
                key={product.id}
                onClick={() => setSelected(product)}
                className="flex-shrink-0 w-[130px] text-left active:scale-[0.97] transition-transform"
              >
                <div className="aspect-square rounded-xl bg-secondary overflow-hidden relative mb-2">
                  <SafeImage
                    src={product.image_url || ""}
                    alt={product.name}
                    className="h-full w-full object-cover"
                    fallbackIcon={<ShoppingBag className="h-6 w-6 text-muted-foreground/20" />}
                  />
                  {isNew(product.created_at) && (
                    <span className="absolute top-1.5 left-1.5 px-2 py-0.5 rounded-md bg-primary text-primary-foreground text-[8px] font-bold uppercase">
                      New
                    </span>
                  )}
                  {product.stock === 0 && (
                    <div className="absolute inset-0 bg-background/50 flex items-center justify-center">
                      <span className="text-[9px] font-bold text-muted-foreground">Sold Out</span>
                    </div>
                  )}
                </div>
                <p className="text-[11px] font-semibold text-foreground line-clamp-1 leading-tight">{product.name}</p>
                <p className="text-[12px] font-heading font-bold text-primary mt-0.5">
                  {fmtPrice(product.price, product.currency)}
                </p>
              </button>
            ))}
          </div>
        </div>
      </div>

      <ProductDetailModal
        product={selected}
        coachName={coachName}
        onClose={() => setSelected(null)}
      />
    </>
  );
};

export default CoachStore;
