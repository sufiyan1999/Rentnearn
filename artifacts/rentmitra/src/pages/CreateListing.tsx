import { useState, useRef, useEffect } from "react";
import { useLocation, useRoute } from "wouter";
import { useCreateListing, useGetListing, getGetListingQueryKey, useUpdateListing, ListingInput, ListingInputCondition } from "@workspace/api-client-react";
import { Button, Input, Label, Textarea } from "@/components/ui/ui-core";
import { CATEGORIES, STATES, CITIES_BY_STATE } from "@/lib/constants";
import { checkRestrictedContent, PROHIBITED_CATEGORIES } from "@/lib/restrictedItems";
import { toast } from "sonner";
import { ImagePlus, X, MapPin, ShieldAlert, ChevronDown, ChevronUp } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

export default function CreateListing() {
  const [, setLocation] = useLocation();
  const [, params] = useRoute("/listings/:id/edit");
  const { token, isAuthenticated } = useAuth();
  const createMutation = useCreateListing();
  const updateMutation = useUpdateListing();
  
  const isEdit = !!params?.id;
  const listingId = isEdit ? Number(params.id) : null;

  const { data: existingListing } = useGetListing(listingId!, {
    query: {
      enabled: !!listingId,
      queryKey: getGetListingQueryKey(listingId!)
    }
  });

  useEffect(() => {
    if (!isAuthenticated) {
      setLocation("/login");
    }
  }, [isAuthenticated, setLocation]);

  const [step, setStep] = useState(1);
  const [policyExpanded, setPolicyExpanded] = useState(false);
  const [formData, setFormData] = useState<ListingInput>({
    title: "",
    description: "",
    category: "others",
    condition: "good" as ListingInputCondition,
    dailyPrice: null,
    weeklyPrice: null,
    monthlyPrice: null,
    city: "",
    state: "",
    area: "",
    pincode: "",
  });

  const initializedForId = useRef<number | null>(null);

  useEffect(() => {
    if (existingListing && isEdit && initializedForId.current !== existingListing.id) {
      initializedForId.current = existingListing.id;
      setFormData({
        title: existingListing.title || "",
        description: existingListing.description || "",
        category: existingListing.category || "others",
        condition: (existingListing.condition as ListingInputCondition) || "good",
        dailyPrice: existingListing.rentalPrice?.daily || null,
        weeklyPrice: existingListing.rentalPrice?.weekly || null,
        monthlyPrice: existingListing.rentalPrice?.monthly || null,
        city: existingListing.city || "",
        state: existingListing.state || "",
        area: (existingListing as any).area || "",
        pincode: existingListing.pincode || "",
      });
      if (existingListing.images) {
        setImagePreviews(existingListing.images);
        // We won't try to edit existing images in this simple version, just append new ones
      }
    }
  }, [existingListing, isEdit]);

  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageAdd = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      setImages(prev => [...prev, ...files]);
      
      const newPreviews = files.map(file => URL.createObjectURL(file));
      setImagePreviews(prev => [...prev, ...newPreviews]);
    }
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => {
      const newPreviews = [...prev];
      URL.revokeObjectURL(newPreviews[index]);
      newPreviews.splice(index, 1);
      return newPreviews;
    });
  };

  const uploadImages = async (listingId: number) => {
    if (images.length === 0) return;
    
    const fd = new FormData();
    images.forEach(img => fd.append("images", img));

    try {
      const res = await fetch(`/api/listings/${listingId}/images`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`
        },
        body: fd
      });
      if (!res.ok) throw new Error("Image upload failed");
    } catch (err) {
      console.error(err);
      toast.error("Failed to upload some images");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (step === 1) {
      // Client-side restricted content check before advancing
      const check = checkRestrictedContent(formData.title, formData.description);
      if (check.restricted) {
        toast.error(`Prohibited item detected: ${check.label}. This category is not allowed on RentNEarn as per Indian law.`);
        return;
      }
    }
    if (step < 3) {
      setStep(s => s + 1);
      return;
    }

    if (isEdit && listingId) {
      updateMutation.mutate({ id: listingId, data: formData }, {
        onSuccess: async () => {
          if (images.length > 0) await uploadImages(listingId);
          toast.success("Listing updated successfully!");
          setLocation(`/listings/${listingId}`);
        },
        onError: (err: any) => {
          toast.error(err?.response?.data?.error || "Failed to update listing");
        }
      });
    } else {
      createMutation.mutate({ data: formData }, {
        onSuccess: async (data) => {
          if (images.length > 0) {
            await uploadImages(data.id);
          }
          toast.success("Listing created successfully!");
          setLocation(`/profile`); 
        },
        onError: (err: any) => {
          toast.error(err?.response?.data?.error || "Failed to create listing");
        }
      });
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">{isEdit ? "Edit your listing" : "List your item"}</h1>
        <div className="flex gap-2 mt-4">
          {[1, 2, 3].map(i => (
            <div key={i} className={`h-2 flex-1 rounded-full ${i <= step ? 'bg-primary' : 'bg-secondary'}`} />
          ))}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-background border-2 border-input rounded-3xl p-6 md:p-8 shadow-sm">
        
        {/* Step 1: Basics */}
        {step === 1 && (
          <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4">
            <h2 className="text-xl font-bold border-b pb-2">Basic Details</h2>

            {/* Prohibited items notice */}
            <div className="rounded-2xl border border-amber-200 bg-amber-50 dark:border-amber-800/60 dark:bg-amber-950/30 overflow-hidden">
              <button
                type="button"
                onClick={() => setPolicyExpanded(p => !p)}
                className="w-full flex items-center gap-3 px-4 py-3 text-left"
              >
                <ShieldAlert className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                <span className="text-sm font-semibold text-amber-800 dark:text-amber-300 flex-1">
                  Prohibited items — not allowed on RentNEarn
                </span>
                {policyExpanded
                  ? <ChevronUp className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                  : <ChevronDown className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                }
              </button>
              {policyExpanded && (
                <div className="px-4 pb-4">
                  <p className="text-xs text-amber-700 dark:text-amber-400 mb-2">
                    The following are banned as per Indian law (Arms Act, NDPS Act, IPC, Wildlife Protection Act, etc.):
                  </p>
                  <ul className="space-y-1">
                    {PROHIBITED_CATEGORIES.map(cat => (
                      <li key={cat} className="flex items-start gap-2 text-xs text-amber-800 dark:text-amber-300">
                        <span className="mt-0.5 text-amber-500">✕</span>
                        {cat}
                      </li>
                    ))}
                  </ul>
                  <p className="text-xs text-amber-600 dark:text-amber-500 mt-3">
                    Listings violating this policy will be removed and may be reported to authorities.{" "}
                    <a href="/prohibited-items" target="_blank" className="underline font-semibold hover:text-amber-800">
                      Full policy →
                    </a>
                  </p>
                </div>
              )}
            </div>
            
            <div className="space-y-2">
              <Label>Title</Label>
              <Input 
                required 
                minLength={5}
                placeholder="e.g. Sony DSLR Camera + 2 Lenses"
                value={formData.title}
                onChange={e => setFormData(p => ({ ...p, title: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label>Category</Label>
              <select 
                className="w-full p-3 border-2 border-input rounded-xl bg-background text-sm font-medium"
                value={formData.category}
                onChange={e => setFormData(p => ({ ...p, category: e.target.value }))}
                required
              >
                {CATEGORIES.map(c => <option key={c.slug} value={c.slug}>{c.name}</option>)}
              </select>
            </div>

            <div className="space-y-2">
              <Label>Condition</Label>
              <select 
                className="w-full p-3 border-2 border-input rounded-xl bg-background text-sm font-medium"
                value={formData.condition}
                onChange={e => setFormData(p => ({ ...p, condition: e.target.value as ListingInputCondition }))}
                required
              >
                <option value="new">Brand New</option>
                <option value="like_new">Like New</option>
                <option value="good">Good</option>
                <option value="fair">Fair</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea 
                placeholder="Describe your item, what's included, and any rules."
                value={formData.description || ""}
                onChange={e => setFormData(p => ({ ...p, description: e.target.value }))}
                rows={4}
              />
            </div>
          </div>
        )}

        {/* Step 2: Pricing & Photos */}
        {step === 2 && (
          <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4">
            <h2 className="text-xl font-bold border-b pb-2">Pricing & Photos</h2>
            
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Daily (₹)</Label>
                <Input 
                  type="number" 
                  min={0}
                  value={formData.dailyPrice || ""}
                  onChange={e => setFormData(p => ({ ...p, dailyPrice: Number(e.target.value) || null }))}
                  placeholder="500"
                />
              </div>
              <div className="space-y-2">
                <Label>Weekly (₹)</Label>
                <Input 
                  type="number" 
                  min={0}
                  value={formData.weeklyPrice || ""}
                  onChange={e => setFormData(p => ({ ...p, weeklyPrice: Number(e.target.value) || null }))}
                  placeholder="3000"
                />
              </div>
              <div className="space-y-2">
                <Label>Monthly (₹)</Label>
                <Input 
                  type="number" 
                  min={0}
                  value={formData.monthlyPrice || ""}
                  onChange={e => setFormData(p => ({ ...p, monthlyPrice: Number(e.target.value) || null }))}
                  placeholder="10000"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Photos</Label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-2">
                {imagePreviews.map((src, i) => (
                  <div key={i} className="relative aspect-square rounded-xl overflow-hidden bg-secondary border border-border">
                    <img src={src} alt="preview" className="w-full h-full object-cover" />
                    <button 
                      type="button"
                      onClick={() => removeImage(i)}
                      className="absolute top-1 right-1 w-6 h-6 bg-black/50 text-white rounded-full flex items-center justify-center"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                
                {imagePreviews.length < 5 && (
                  <button 
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="aspect-square rounded-xl border-2 border-dashed border-input hover:border-primary bg-secondary flex flex-col items-center justify-center text-muted-foreground hover:text-primary transition-colors"
                  >
                    <ImagePlus className="w-8 h-8 mb-2" />
                    <span className="text-xs font-bold">Add Photo</span>
                  </button>
                )}
              </div>
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                multiple 
                accept="image/png, image/jpeg, image/webp" 
                onChange={handleImageAdd}
              />
            </div>
          </div>
        )}

        {/* Step 3: Location */}
        {step === 3 && (
          <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4">
            <h2 className="text-xl font-bold border-b pb-2 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-primary" /> Location
            </h2>
            
            <div className="space-y-2">
              <Label>State</Label>
              <select 
                className="w-full p-3 border-2 border-input rounded-xl bg-background text-sm font-medium"
                value={formData.state}
                onChange={e => setFormData(p => ({ ...p, state: e.target.value, city: "" }))}
                required
              >
                <option value="">Select State</option>
                {STATES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            <div className="space-y-2">
              <Label>City</Label>
              {formData.state && CITIES_BY_STATE[formData.state] ? (
                <select
                  className="w-full p-3 border-2 border-input rounded-xl bg-background text-sm font-medium"
                  value={formData.city}
                  onChange={e => setFormData(p => ({ ...p, city: e.target.value }))}
                  required
                >
                  <option value="">Select City</option>
                  {CITIES_BY_STATE[formData.state].map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              ) : (
                <Input 
                  required 
                  value={formData.city}
                  onChange={e => setFormData(p => ({ ...p, city: e.target.value }))}
                  placeholder="e.g. Mumbai"
                />
              )}
            </div>

            <div className="space-y-2">
              <Label>Area / Locality <span className="text-destructive">*</span></Label>
              <Input
                required
                value={formData.area ?? ""}
                onChange={e => setFormData(p => ({ ...p, area: e.target.value }))}
                placeholder="e.g. Bandra West, Koramangala, Connaught Place"
              />
              <p className="text-xs text-muted-foreground">
                Helps renters find listings near their neighbourhood.
              </p>
            </div>

            <div className="space-y-2">
              <Label>Pincode</Label>
              <Input 
                required 
                maxLength={6}
                value={formData.pincode || ""}
                onChange={e => setFormData(p => ({ ...p, pincode: e.target.value }))}
                placeholder="400001"
              />
            </div>
            
            <div className="bg-secondary p-4 rounded-xl text-sm text-muted-foreground mt-4">
              Your exact location will not be shown publicly. It's only used to help renters find items nearby.
            </div>
          </div>
        )}

        <div className="flex gap-4 mt-10">
          {step > 1 && (
            <Button type="button" variant="outline" onClick={() => setStep(s => s - 1)} className="flex-1">
              Back
            </Button>
          )}
          <Button type="submit" className="flex-1" isLoading={createMutation.isPending}>
            {step === 3 ? "Publish Listing" : "Next"}
          </Button>
        </div>

      </form>
    </div>
  );
}
