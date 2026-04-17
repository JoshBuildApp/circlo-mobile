import { useState, useEffect, useRef } from "react";
import { Plus, Upload, Loader2, FileText, Video, ListChecks, Trash2, Package } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import DigitalProductCard, { type DigitalProduct } from "./DigitalProductCard";

interface Props {
  coachProfileId: string;
  isOwner?: boolean;
}

const FILE_TYPE_OPTIONS: { value: "pdf" | "video" | "plan"; label: string; icon: React.ElementType }[] = [
  { value: "pdf", label: "PDF", icon: FileText },
  { value: "video", label: "Video", icon: Video },
  { value: "plan", label: "Training Plan", icon: ListChecks },
];

const DigitalProductsSection = ({ coachProfileId, isOwner = false }: Props) => {
  const { user } = useAuth();
  const [products, setProducts] = useState<DigitalProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [fileType, setFileType] = useState<"pdf" | "video" | "plan">("pdf");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const fetchProducts = async () => {
    setLoading(true);
    const { data } = await (supabase.from as any)("digital_products")
      .select("*")
      .eq("coach_id", coachProfileId)
      .eq("is_active", true)
      .order("created_at", { ascending: false });
    setProducts((data as unknown as DigitalProduct[]) || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchProducts();
  }, [coachProfileId]);

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setPrice("");
    setFileType("pdf");
    setSelectedFile(null);
    setShowForm(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !title || !price) return;

    setUploading(true);
    try {
      let fileUrl: string | null = null;

      // Upload file to storage
      if (selectedFile) {
        const ext = selectedFile.name.split(".").pop();
        const path = `${coachProfileId}/${Date.now()}.${ext}`;
        const { error: uploadErr } = await supabase.storage
          .from("digital-products")
          .upload(path, selectedFile, { upsert: true });
        if (uploadErr) throw uploadErr;

        const { data: urlData } = supabase.storage
          .from("digital-products")
          .getPublicUrl(path);
        fileUrl = urlData.publicUrl;
      }

      // Insert product record
      const { error } = await (supabase.from as any)("digital_products").insert({
        coach_id: coachProfileId,
        title,
        description: description || null,
        price: parseInt(price, 10),
        file_type: fileType,
        file_url: fileUrl,
        is_active: true,
      });

      if (error) throw error;

      toast.success("Digital product added!");
      resetForm();
      fetchProducts();
    } catch (err: any) {
      toast.error(err.message || "Failed to add product");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (productId: string) => {
    const { error } = await (supabase.from as any)("digital_products")
      .update({ is_active: false })
      .eq("id", productId);
    if (!error) {
      toast.success("Product removed");
      setProducts((prev) => prev.filter((p) => p.id !== productId));
    }
  };

  return (
    <div className="space-y-4">
      {/* Section header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-xl bg-primary/10 flex items-center justify-center">
            <Package className="h-4 w-4 text-primary" />
          </div>
          <div>
            <p className="text-sm font-heading font-bold text-foreground">Digital Products</p>
            <p className="text-[10px] text-muted-foreground">{products.length} item{products.length !== 1 ? "s" : ""}</p>
          </div>
        </div>
        {isOwner && (
          <button
            onClick={() => setShowForm((v) => !v)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary text-primary-foreground text-xs font-bold active:scale-[0.97] transition-transform"
          >
            <Plus className="h-3.5 w-3.5" />
            Add Product
          </button>
        )}
      </div>

      {/* Add product form */}
      {isOwner && showForm && (
        <form
          onSubmit={handleSubmit}
          className="bg-card rounded-2xl border border-border/10 p-4 space-y-3"
        >
          <p className="text-xs font-heading font-bold text-foreground">New Digital Product</p>

          <input
            type="text"
            placeholder="Title *"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            className="w-full bg-secondary rounded-xl px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 outline-none border border-border/5 focus:border-primary/30 transition-colors"
          />

          <textarea
            placeholder="Description (optional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            className="w-full bg-secondary rounded-xl px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 outline-none border border-border/5 focus:border-primary/30 transition-colors resize-none"
          />

          <div className="flex gap-2">
            <div className="relative flex-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">₪</span>
              <input
                type="number"
                placeholder="Price"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                required
                min="0"
                className="w-full bg-secondary rounded-xl pl-7 pr-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 outline-none border border-border/5 focus:border-primary/30 transition-colors"
              />
            </div>

            <div className="flex gap-1">
              {FILE_TYPE_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setFileType(opt.value)}
                  className={`px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${
                    fileType === opt.value
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-muted-foreground"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* File upload */}
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="w-full flex items-center gap-2 py-2.5 rounded-xl border border-dashed border-border/30 text-xs text-muted-foreground hover:border-primary/30 hover:text-primary transition-colors"
          >
            <Upload className="h-3.5 w-3.5" />
            {selectedFile ? selectedFile.name : "Upload file (optional)"}
          </button>
          <input
            ref={fileRef}
            type="file"
            className="hidden"
            accept=".pdf,.mp4,.mov,.png,.jpg,.zip"
            onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
          />

          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={resetForm}
              className="flex-1 py-2.5 rounded-xl bg-secondary text-muted-foreground text-xs font-bold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={uploading || !title || !price}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-primary text-primary-foreground text-xs font-bold disabled:opacity-60"
            >
              {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
              {uploading ? "Saving…" : "Add Product"}
            </button>
          </div>
        </form>
      )}

      {/* Product list */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="h-28 rounded-2xl bg-secondary animate-pulse" />
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-10 px-6 bg-card rounded-2xl border border-border/10">
          <Package className="h-8 w-8 text-muted-foreground/20 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">
            {isOwner ? "Add your first digital product" : "No digital products available"}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {products.map((product) => (
            <div key={product.id} className="relative">
              <DigitalProductCard product={product} onPurchased={fetchProducts} />
              {isOwner && (
                <button
                  onClick={() => handleDelete(product.id)}
                  className="absolute top-3 right-3 h-7 w-7 rounded-lg bg-destructive/10 flex items-center justify-center text-destructive hover:bg-destructive/20 transition-colors"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DigitalProductsSection;
