import { useState, useRef } from "react";
import { Plus, Trash2, Edit3, ShoppingBag, X, Upload, Image as ImageIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useCoachProducts, type Product } from "@/hooks/use-products";
import { useAuth } from "@/contexts/AuthContext";
import { SafeImage } from "@/components/ui/safe-image";
import { toast } from "sonner";

interface ProductManagerProps {
  coachProfileId: string;
}

const MAX_IMG_SIZE = 5 * 1024 * 1024; // 5MB

const ProductManager = ({ coachProfileId }: ProductManagerProps) => {
  const { user } = useAuth();
  const { products, loading, refresh } = useCoachProducts(coachProfileId);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // Form state
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState("");
  const [stock, setStock] = useState("-1");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const resetForm = () => {
    setName(""); setDescription(""); setPrice(""); setCategory("");
    setStock("-1"); setImageFile(null); setImagePreview(null);
    setEditing(null); setFormOpen(false);
  };

  const openEdit = (p: Product) => {
    setEditing(p);
    setName(p.name);
    setDescription(p.description || "");
    setPrice(String(p.price));
    setCategory(p.category || "");
    setStock(String(p.stock));
    setImagePreview(p.image_url);
    setFormOpen(true);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > MAX_IMG_SIZE) {
      toast.error("Image must be under 5MB");
      return;
    }
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleSave = async () => {
    if (!name.trim()) { toast.error("Product name is required"); return; }
    const priceNum = parseInt(price);
    if (isNaN(priceNum) || priceNum < 0) { toast.error("Enter a valid price"); return; }
    if (!user) return;

    setSaving(true);

    let imageUrl = editing?.image_url || null;

    // Upload image if new
    if (imageFile) {
      const ext = imageFile.name.split(".").pop() || "jpg";
      const path = `${user.id}/${Date.now()}.${ext}`;
      const { error: uploadErr } = await supabase.storage
        .from("product-images")
        .upload(path, imageFile, { upsert: true });
      if (uploadErr) {
        toast.error("Image upload failed");
        setSaving(false);
        return;
      }
      const { data: urlData } = supabase.storage.from("product-images").getPublicUrl(path);
      imageUrl = urlData.publicUrl;
    }

    if (editing) {
      // Update
      const { error } = await supabase
        .from("products")
        .update({
          name: name.trim(),
          description: description.trim(),
          price: priceNum,
          category: category.trim(),
          stock: parseInt(stock) || -1,
          image_url: imageUrl,
        })
        .eq("id", editing.id);
      if (error) { toast.error(error.message); setSaving(false); return; }
      toast.success("Product updated");
    } else {
      // Create
      const { error } = await supabase.from("products").insert({
        coach_id: coachProfileId,
        user_id: user.id,
        name: name.trim(),
        description: description.trim(),
        price: priceNum,
        category: category.trim(),
        stock: parseInt(stock) || -1,
        image_url: imageUrl,
      });
      if (error) { toast.error(error.message); setSaving(false); return; }
      toast.success("Product added!");
    }

    resetForm();
    refresh();
    setSaving(false);
  };

  const handleDelete = async (product: Product) => {
    setDeleting(product.id);
    // Remove image from storage
    if (product.image_url?.includes("/product-images/")) {
      const parts = product.image_url.split("/product-images/");
      if (parts[1]) {
        await supabase.storage.from("product-images").remove([decodeURIComponent(parts[1])]);
      }
    }
    const { error } = await supabase.from("products").delete().eq("id", product.id);
    if (error) toast.error(error.message);
    else toast.success("Product deleted");
    setDeleting(null);
    refresh();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-foreground">My Store</h3>
          <p className="text-[11px] text-muted-foreground">{products.length} products</p>
        </div>
        <button
          onClick={() => { resetForm(); setFormOpen(true); }}
          className="h-9 px-4 rounded-xl bg-primary text-primary-foreground text-xs font-bold flex items-center gap-1.5 active:scale-95 transition-all"
        >
          <Plus className="h-3.5 w-3.5" /> Add Product
        </button>
      </div>

      {/* Product list */}
      {loading ? (
        <div className="flex justify-center py-8">
          <div className="h-6 w-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-10 bg-card rounded-2xl border border-border/10">
          <ShoppingBag className="h-10 w-10 text-muted-foreground/20 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">No products yet</p>
          <p className="text-xs text-muted-foreground/60">Add your first product to start selling</p>
        </div>
      ) : (
        <div className="space-y-2">
          {products.map((p) => (
            <div key={p.id} className="flex items-center gap-3 bg-card rounded-2xl border border-border/10 p-3">
              <div className="h-14 w-14 rounded-xl bg-secondary overflow-hidden flex-shrink-0">
                <SafeImage
                  src={p.image_url || ""}
                  alt={p.name}
                  className="h-full w-full object-cover"
                  protect={false}
                  fallbackIcon={<ShoppingBag className="h-5 w-5 text-muted-foreground/30" />}
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-foreground truncate">{p.name}</p>
                <p className="text-xs text-primary font-bold">₪{p.price}</p>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => openEdit(p)}
                  className="p-2 rounded-lg hover:bg-secondary text-muted-foreground transition-colors"
                >
                  <Edit3 className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleDelete(p)}
                  disabled={deleting === p.id}
                  className="p-2 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors disabled:opacity-50"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Form Modal */}
      {formOpen && (
        <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm flex flex-col animate-fade-in">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border/10 safe-area-top">
            <button onClick={resetForm} className="h-10 w-10 rounded-full bg-secondary flex items-center justify-center">
              <X className="h-5 w-5 text-foreground" />
            </button>
            <h2 className="text-sm font-bold text-foreground">
              {editing ? "Edit Product" : "New Product"}
            </h2>
            <button
              onClick={handleSave}
              disabled={saving}
              className="h-10 px-4 rounded-full bg-primary text-primary-foreground text-xs font-bold disabled:opacity-50"
            >
              {saving ? "Saving…" : "Save"}
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-5 py-5 space-y-5">
            {/* Image upload */}
            <div>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
              <button
                onClick={() => fileRef.current?.click()}
                className="w-full aspect-video rounded-2xl bg-secondary border-2 border-dashed border-border/30 flex flex-col items-center justify-center gap-2 overflow-hidden relative active:scale-[0.98] transition-transform"
              >
                {imagePreview ? (
                  <SafeImage src={imagePreview} alt="" className="absolute inset-0 h-full w-full object-cover" protect={false} />
                ) : (
                  <>
                    <Upload className="h-8 w-8 text-muted-foreground/30" />
                    <span className="text-xs text-muted-foreground">Tap to upload image</span>
                  </>
                )}
              </button>
            </div>

            {/* Name */}
            <div>
              <label className="text-xs font-bold text-foreground mb-1.5 block">Product Name *</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Training T-Shirt"
                maxLength={100}
                className="w-full h-11 px-4 rounded-xl bg-secondary border border-border/10 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>

            {/* Price */}
            <div>
              <label className="text-xs font-bold text-foreground mb-1.5 block">Price (₪) *</label>
              <input
                value={price}
                onChange={(e) => setPrice(e.target.value.replace(/\D/g, ""))}
                placeholder="0"
                inputMode="numeric"
                className="w-full h-11 px-4 rounded-xl bg-secondary border border-border/10 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>

            {/* Category */}
            <div>
              <label className="text-xs font-bold text-foreground mb-1.5 block">Category</label>
              <input
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="e.g. Apparel, Equipment, Digital"
                maxLength={50}
                className="w-full h-11 px-4 rounded-xl bg-secondary border border-border/10 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>

            {/* Description */}
            <div>
              <label className="text-xs font-bold text-foreground mb-1.5 block">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe your product…"
                maxLength={500}
                rows={4}
                className="w-full px-4 py-3 rounded-xl bg-secondary border border-border/10 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
              />
            </div>

            {/* Stock */}
            <div>
              <label className="text-xs font-bold text-foreground mb-1.5 block">Stock (leave -1 for unlimited)</label>
              <input
                value={stock}
                onChange={(e) => setStock(e.target.value)}
                inputMode="numeric"
                className="w-full h-11 px-4 rounded-xl bg-secondary border border-border/10 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductManager;
