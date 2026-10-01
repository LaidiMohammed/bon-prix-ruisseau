"use client";

import { useRef, useState } from "react";
import { ImagePlus, Link2, Save, X } from "lucide-react";
import { CATEGORIES, type Product } from "@/lib/mock-data";

const inputCls =
  "w-full rounded-2xl border border-white/12 bg-ink px-4 py-2.5 text-sm outline-none focus:border-signal";

// Downscale device photos so they fit in localStorage (max 900px, JPEG).
function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("read"));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("decode"));
      img.onload = () => {
        const max = 900;
        const scale = Math.min(1, max / Math.max(img.width, img.height));
        const w = Math.round(img.width * scale);
        const h = Math.round(img.height * scale);
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        canvas.getContext("2d")?.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL("image/jpeg", 0.82));
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}

export default function ProductForm({
  initial,
  onSave,
  onCancel,
}: {
  initial?: Product;
  onSave: (p: Product) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [nameAr, setNameAr] = useState(initial?.nameAr ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [descriptionAr, setDescriptionAr] = useState(initial?.descriptionAr ?? "");
  const [price, setPrice] = useState(String(initial?.price ?? ""));
  const [oldPrice, setOldPrice] = useState(
    initial?.oldPrice ? String(initial.oldPrice) : ""
  );
  const [category, setCategory] = useState(
    initial?.category ?? (CATEGORIES[1] as string)
  );
  const [sizes, setSizes] = useState((initial?.sizes ?? ["S", "M", "L", "XL"]).join(", "));
  const [image, setImage] = useState(initial?.image ?? "");
  const [tag, setTag] = useState(initial?.tag ?? "");
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const pickFile = async (f: File | undefined) => {
    if (!f) return;
    try {
      setImage(await fileToDataUrl(f));
    } catch {
      setError("Photo illisible — essaie une autre image");
    }
  };

  const save = () => {
    const p = Number(price);
    if (name.trim().length < 2) return setError("Nom du produit requis");
    if (!Number.isFinite(p) || p <= 0) return setError("Prix invalide (ex: 3200)");
    if (!image) return setError("Ajoute une photo (appareil ou lien)");
    const old = Number(oldPrice);
    onSave({
      id: initial?.id ?? `p-${Date.now()}`,
      name: name.trim(),
      nameAr: nameAr.trim(),
      category,
      price: Math.round(p),
      oldPrice: oldPrice.trim() !== "" && Number.isFinite(old) && old > p ? Math.round(old) : undefined,
      sizes: sizes.split(",").map((s) => s.trim()).filter(Boolean),
      image,
      tag: tag.trim() || undefined,
      rating: initial?.rating ?? 5,
      description: description.trim(),
      descriptionAr: descriptionAr.trim(),
    });
  };

  return (
    <div className="rounded-[1.75rem] border border-signal/40 bg-coal p-5 sm:p-6">
      <div className="flex items-center gap-4">
        {image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={image} alt="" className="h-24 w-20 rounded-2xl border border-white/15 object-cover" />
        ) : (
          <div className="grid h-24 w-20 place-items-center rounded-2xl border border-dashed border-white/25 bg-white/5 text-cream/40">
            <ImagePlus size={26} />
          </div>
        )}
        <div className="flex-1">
          <p className="text-xs font-black tracking-widest text-cream/60 uppercase">Photo produit</p>
          <div className="mt-2 flex flex-wrap gap-2">
            <button
              onClick={() => fileRef.current?.click()}
              className="flex items-center gap-1.5 rounded-full bg-signal px-4 py-2 text-xs font-black uppercase"
            >
              <ImagePlus size={14} /> Appareil photo
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => pickFile(e.target.files?.[0])}
            />
          </div>
          <div className="mt-2 flex items-center gap-1.5">
            <Link2 size={13} className="shrink-0 text-cream/40" />
            <input
              value={image.startsWith("data:") ? "" : image}
              onChange={(e) => setImage(e.target.value)}
              placeholder="…ou colle un lien image (https://)"
              className="w-full rounded-xl border border-white/12 bg-ink px-3 py-1.5 text-xs outline-none focus:border-signal"
            />
          </div>
        </div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1 block text-[11px] font-black tracking-widest text-cream/60 uppercase">Nom (FR) *</span>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Maillot Liverpool Domicile 26/27" className={inputCls} />
        </label>
        <label className="block">
          <span className="mb-1 block text-[11px] font-black tracking-widest text-cream/60 uppercase">Nom (AR)</span>
          <input value={nameAr} onChange={(e) => setNameAr(e.target.value)} placeholder="قميص ليفربول" className={inputCls} />
        </label>
        <label className="block sm:col-span-2">
          <span className="mb-1 block text-[11px] font-black tracking-widest text-cream/60 uppercase">Bio / description (FR)</span>
          <input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Tissu respirant, écusson brodé…" className={inputCls} />
        </label>
        <label className="block sm:col-span-2">
          <span className="mb-1 block text-[11px] font-black tracking-widest text-cream/60 uppercase">Bio (AR)</span>
          <input value={descriptionAr} onChange={(e) => setDescriptionAr(e.target.value)} placeholder="وصف قصير…" className={inputCls} />
        </label>
        <label className="block">
          <span className="mb-1 block text-[11px] font-black tracking-widest text-cream/60 uppercase">Prix (DA) *</span>
          <input value={price} onChange={(e) => setPrice(e.target.value)} placeholder="3200" inputMode="numeric" className={inputCls} />
        </label>
        <label className="block">
          <span className="mb-1 block text-[11px] font-black tracking-widest text-cream/60 uppercase">Ancien prix (promo, optionnel)</span>
          <input value={oldPrice} onChange={(e) => setOldPrice(e.target.value)} placeholder="3800" inputMode="numeric" className={inputCls} />
        </label>
        <label className="block">
          <span className="mb-1 block text-[11px] font-black tracking-widest text-cream/60 uppercase">Catégorie</span>
          <select value={category} onChange={(e) => setCategory(e.target.value)} className={inputCls}>
            {CATEGORIES.filter((c) => c !== "Tous").map((c) => (
              <option key={c} value={c} className="bg-coal">{c}</option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="mb-1 block text-[11px] font-black tracking-widest text-cream/60 uppercase">Tailles (séparées par ,)</span>
          <input value={sizes} onChange={(e) => setSizes(e.target.value)} placeholder="S, M, L, XL, XXL" className={inputCls} />
        </label>
        <label className="block sm:col-span-2">
          <span className="mb-1 block text-[11px] font-black tracking-widest text-cream/60 uppercase">Étiquette (Best-seller, Nouveau, Promo… — vide = aucune)</span>
          <input value={tag} onChange={(e) => setTag(e.target.value)} placeholder="Nouveau" className={inputCls} />
        </label>
      </div>

      {error && <p className="mt-3 rounded-2xl bg-signal/15 px-4 py-2.5 text-center text-sm font-bold text-red-300">{error}</p>}

      <div className="mt-4 flex gap-2">
        <button onClick={save} className="flex flex-1 items-center justify-center gap-2 rounded-full bg-signal py-3 text-sm font-black uppercase">
          <Save size={16} /> {initial ? "Mettre à jour" : "Ajouter le produit"}
        </button>
        <button onClick={onCancel} className="flex items-center gap-1.5 rounded-full border border-white/20 px-5 py-3 text-sm font-bold hover:bg-white/10">
          <X size={16} /> Annuler
        </button>
      </div>
    </div>
  );
}
