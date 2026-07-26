import { useRoute, useLocation } from "wouter";
import { SITE_URL, toAbsoluteUrl } from "@/lib/siteUrl";
import { useGetListing, getGetListingQueryKey, useGetListingQr, getGetListingQrQueryKey, useApproveListing, useRejectListing } from "@workspace/api-client-react";
import { SeoHead } from "@/components/SeoHead";
import { Helmet } from "react-helmet-async";
import { Button } from "@/components/ui/ui-core";
import { ArrowLeft, MapPin, Share2, MessageCircle, AlertTriangle, ShieldCheck, QrCode, Star, Calendar, Tag, Check, X, Clock, Copy, Link2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useState } from "react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useQueryClient } from "@tanstack/react-query";

export default function ListingDetails() {
  const [, params] = useRoute("/listings/:id");
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const id = Number(params?.id);
  const qc = useQueryClient();

  const [activeImage, setActiveImage] = useState(0);
  const [showQr, setShowQr] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [copied, setCopied] = useState(false);

  const { data: listing, isLoading, error } = useGetListing(id, {
    query: { enabled: !!id, queryKey: getGetListingQueryKey(id) },
  });
  const { data: qrData } = useGetListingQr(id, {
    query: { enabled: !!id, queryKey: getGetListingQrQueryKey(id) },
  });

  const approveMutation = useApproveListing();
  const rejectMutation = useRejectListing();

  const handleAdminApprove = () => {
    approveMutation.mutate({ id }, {
      onSuccess: () => {
        toast.success("Listing approved");
        qc.invalidateQueries({ queryKey: getGetListingQueryKey(id) });
      },
      onError: () => toast.error("Failed to approve listing"),
    });
  };

  const handleAdminReject = () => {
    const reason = prompt("Enter rejection reason:");
    if (!reason) return;
    rejectMutation.mutate({ id, data: { reason } }, {
      onSuccess: () => {
        toast.success("Listing rejected");
        qc.invalidateQueries({ queryKey: getGetListingQueryKey(id) });
      },
      onError: () => toast.error("Failed to reject listing"),
    });
  };

  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-8 grid md:grid-cols-2 gap-8">
        <div className="aspect-square skeleton rounded-3xl" />
        <div className="flex flex-col gap-4 pt-2">
          <div className="h-5 skeleton rounded-xl w-1/3" />
          <div className="h-9 skeleton rounded-xl w-4/5" />
          <div className="h-4 skeleton rounded-xl w-1/2" />
          <div className="h-24 skeleton rounded-2xl mt-4" />
          <div className="h-4 skeleton rounded-xl w-full mt-2" />
          <div className="h-4 skeleton rounded-xl w-5/6" />
          <div className="h-4 skeleton rounded-xl w-4/6" />
        </div>
      </div>
    );
  }

  if (error || !listing) {
    return (
      <div className="h-[80vh] flex flex-col items-center justify-center text-center px-4">
        <div className="w-20 h-20 rounded-3xl bg-destructive/10 flex items-center justify-center mb-5">
          <AlertTriangle className="w-9 h-9 text-destructive" />
        </div>
        <h1 className="text-2xl font-bold mb-2">Listing not found</h1>
        <p className="text-muted-foreground mb-6 text-sm">This item may have been removed or is no longer available.</p>
        <Button onClick={() => setLocation("/")}>Go Home</Button>
      </div>
    );
  }

  const images = listing.images?.length ? listing.images : ["https://placehold.co/800x800/f0f0f0/bbb?text=No+Image"];
  const isOwner = user?.id === listing.ownerId;

  // Canonical share URL — always the production domain, never a .replit.dev preview URL
  const shareUrl = `${SITE_URL}/listings/${listing.id}`;
  const shareText = `Check out "${listing.title}" for rent in ${listing.city} on RentNEarn!\n${shareUrl}`;
  const shareTweet = `Check out "${listing.title}" for rent in ${listing.city} on RentNEarn!`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    toast.success("Link copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  const openSharePlatform = (url: string) => window.open(url, "_blank", "noopener,noreferrer");

  const handleWhatsApp = () => {
    if (!listing.owner?.phone) { toast.error("Owner phone number not available"); return; }
    const msg = encodeURIComponent(`Hi, I saw your listing for "${listing.title}" on RentNEarn. Is it available?`);
    window.open(`https://wa.me/91${listing.owner.phone}?text=${msg}`, "_blank");
  };

  const seoTitle = `${listing.title} for Rent in ${listing.city}`;
  const seoDescription =
    listing.description
      ? `${listing.description.slice(0, 140)} · Starting ₹${listing.rentalPrice?.daily ?? "—"}/day on RentNEarn.`
      : `Rent ${listing.title} in ${listing.city}, ${listing.state}. Starting from ₹${listing.rentalPrice?.daily ?? "—"}/day — contact owner directly via WhatsApp on RentNEarn.`;
  // OG image must be absolute — toAbsoluteUrl handles relative /api/storage/... paths
  const seoImage = listing.images?.[0] ? toAbsoluteUrl(listing.images[0]) : undefined;

  const productSchema = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: listing.title,
    description: listing.description ?? seoDescription,
    ...(seoImage && { image: [seoImage] }),
    offers: {
      "@type": "Offer",
      priceCurrency: "INR",
      ...(listing.rentalPrice?.daily && { price: listing.rentalPrice.daily }),
      priceSpecification: listing.rentalPrice?.daily
        ? {
            "@type": "UnitPriceSpecification",
            price: listing.rentalPrice.daily,
            priceCurrency: "INR",
            unitText: "DAY",
          }
        : undefined,
      availability: "https://schema.org/InStock",
      seller: listing.owner
        ? {
            "@type": listing.owner.userType === "business" ? "Organization" : "Person",
            name: listing.owner.name,
          }
        : undefined,
    },
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: `${SITE_URL}/` },
      {
        "@type": "ListItem",
        position: 2,
        name: listing.category,
        item: `${SITE_URL}/search?category=${encodeURIComponent(listing.category)}`,
      },
      { "@type": "ListItem", position: 3, name: listing.title },
    ],
  };

  const isAdmin = user?.userType === "admin";

  return (
    <div className="pb-32 md:pb-8">
      {/* ── Admin review banner ── */}
      {isAdmin && listing.status !== "approved" && (
        <div className={cn(
          "sticky top-16 z-40 flex items-center justify-between gap-4 px-4 py-3 text-sm font-semibold",
          listing.status === "pending" ? "bg-amber-500 text-white" : "bg-red-500 text-white"
        )}>
          <div className="flex items-center gap-2">
            {listing.status === "pending"
              ? <Clock className="w-4 h-4 shrink-0" />
              : <X className="w-4 h-4 shrink-0" />}
            <span>
              {listing.status === "pending"
                ? "This listing is pending review — not visible to the public."
                : "This listing has been rejected — not visible to the public."}
            </span>
          </div>
          {listing.status === "pending" && (
            <div className="flex items-center gap-2 shrink-0">
              <Button
                size="sm"
                variant="outline"
                className="bg-white text-green-700 border-white hover:bg-green-50 h-7 px-3"
                onClick={handleAdminApprove}
                disabled={approveMutation.isPending}
              >
                <Check className="w-3.5 h-3.5 mr-1" /> Approve
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="bg-white text-red-700 border-white hover:bg-red-50 h-7 px-3"
                onClick={handleAdminReject}
                disabled={rejectMutation.isPending}
              >
                <X className="w-3.5 h-3.5 mr-1" /> Reject
              </Button>
            </div>
          )}
        </div>
      )}
      <SeoHead
        title={seoTitle}
        description={seoDescription}
        image={seoImage}
        canonical={`/listings/${listing.id}`}
        type="product"
      />
      <Helmet>
        <script type="application/ld+json">{JSON.stringify(productSchema)}</script>
        <script type="application/ld+json">{JSON.stringify(breadcrumbSchema)}</script>
      </Helmet>
      {/* Mobile floating header */}
      <div className="md:hidden fixed top-0 inset-x-0 z-50 flex items-center justify-between p-4 pointer-events-none">
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => setLocation(-1 as any)}
          className="w-10 h-10 bg-white dark:bg-zinc-800 rounded-full flex items-center justify-center pointer-events-auto shadow-lg border border-black/10 dark:border-white/10"
        >
          <ArrowLeft className="w-5 h-5 text-zinc-800 dark:text-zinc-100" />
        </motion.button>
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => setShowShare(true)}
          className="w-10 h-10 bg-white dark:bg-zinc-800 rounded-full flex items-center justify-center pointer-events-auto shadow-lg border border-black/10 dark:border-white/10"
        >
          <Share2 className="w-4 h-4 text-zinc-800 dark:text-zinc-100" />
        </motion.button>
      </div>

      {/* Gallery */}
      <div className="relative w-full bg-black overflow-hidden" style={{ maxHeight: "88vw", minHeight: 260 }}>
        <div className="relative w-full h-full flex items-center justify-center" style={{ maxHeight: "88vw", minHeight: 260 }}>
          {/* Blurred background fill — masks letterbox areas for any orientation */}
          <AnimatePresence mode="wait">
            <motion.div
              key={`bg-${activeImage}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="absolute inset-0"
              style={{
                backgroundImage: `url(${images[activeImage]})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
                filter: "blur(24px) brightness(0.45) saturate(1.4)",
                transform: "scale(1.12)",
              }}
            />
          </AnimatePresence>

          {/* Foreground image — full image visible, no cropping */}
          <AnimatePresence mode="wait">
            <motion.img
              key={activeImage}
              src={images[activeImage]}
              alt={listing.title}
              initial={{ opacity: 0, scale: 1.03 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="relative z-10 w-full h-full object-contain"
              style={{ maxHeight: "88vw", minHeight: 260 }}
              onError={(e) => {
                const img = e.currentTarget;
                img.onerror = null; // prevent infinite loop
                img.src = `https://placehold.co/800x600/1f1f1f/666666?text=${encodeURIComponent(listing.title)}`;
              }}
            />
          </AnimatePresence>
        </div>

        {listing.isFeatured && (
          <div className="absolute top-4 left-4 z-20 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold text-amber-900 shadow-sm"
            style={{ background: "linear-gradient(135deg,#fde68a,#fbbf24)" }}>
            <Star className="w-3 h-3 fill-amber-700 text-amber-700" /> FEATURED
          </div>
        )}
        {images.length > 1 && (
          <div className="absolute bottom-4 left-0 right-0 z-20 flex justify-center gap-1.5">
            {images.map((_, i) => (
              <button key={i} onClick={() => setActiveImage(i)}
                className={cn("h-1.5 rounded-full transition-all duration-300", i === activeImage ? "bg-white w-5" : "bg-white/50 w-1.5")} />
            ))}
          </div>
        )}
      </div>

      {/* Thumbnail strip (desktop) */}
      {images.length > 1 && (
        <div className="hidden md:flex gap-3 container mx-auto px-4 max-w-5xl mt-4 overflow-x-auto pb-1">
          {images.map((img, i) => (
            <button key={i} onClick={() => setActiveImage(i)}
              className={cn("w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 border-2 transition-all duration-200 bg-black",
                i === activeImage ? "border-primary shadow-md shadow-primary/20" : "border-transparent opacity-60 hover:opacity-100"
              )}>
              <img src={img} alt="" className="w-full h-full object-contain" />
            </button>
          ))}
        </div>
      )}

      {/* Content */}
      <div className="container mx-auto px-4 max-w-5xl mt-6 md:mt-8">
        <div className="flex flex-col md:flex-row gap-8">

          {/* Left: Details */}
          <div className="flex-1 flex flex-col gap-6">
            {/* Title + meta */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="px-3 py-1 bg-secondary text-muted-foreground rounded-full text-xs font-bold uppercase tracking-wide capitalize">
                  {listing.category}
                </span>
                {listing.condition && (
                  <span className="px-3 py-1 border border-border rounded-full text-xs font-semibold capitalize">
                    {listing.condition.replace("_", " ")}
                  </span>
                )}
                <div className="ml-auto hidden md:flex gap-2">
                  {isOwner && (
                    <Button variant="outline" size="sm" onClick={() => setLocation(`/listings/${listing.id}/edit`)}>Edit</Button>
                  )}
                  <Button variant="secondary" size="icon" onClick={() => setShowShare(true)}>
                    <Share2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight leading-tight mb-3">{listing.title}</h1>
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <MapPin className="w-4 h-4 text-primary" />
                {listing.city}, {listing.state}
              </div>
            </div>

            {/* Pricing */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: "Daily", value: listing.rentalPrice?.daily, highlight: true },
                { label: "Weekly", value: listing.rentalPrice?.weekly },
                { label: "Monthly", value: listing.rentalPrice?.monthly },
              ].map(({ label, value, highlight }) => (
                <div key={label}
                  className={cn(
                    "rounded-2xl p-4 text-center border transition-all",
                    highlight
                      ? "border-primary/30 bg-primary/5"
                      : "border-border bg-card"
                  )}
                >
                  <p className="text-xs font-semibold text-muted-foreground mb-1">{label}</p>
                  <p className={cn("text-xl font-extrabold tracking-tight", highlight ? "text-primary" : "text-foreground")}>
                    {value ? `₹${value}` : <span className="text-muted-foreground text-base">—</span>}
                  </p>
                </div>
              ))}
            </div>

            {/* Description */}
            <div>
              <h3 className="text-base font-bold mb-2.5">About this item</h3>
              <p className="text-muted-foreground leading-relaxed text-sm whitespace-pre-wrap">
                {listing.description || "No description provided."}
              </p>
            </div>

            {/* Owner */}
            {listing.owner && (
              <div className="flex items-center gap-4 p-4 border border-border rounded-2xl bg-card hover:border-primary/30 transition-all duration-200">
                <div className="w-12 h-12 rounded-2xl bg-secondary overflow-hidden flex-shrink-0">
                  {listing.owner.profilePhoto ? (
                    <img src={listing.owner.profilePhoto} alt={listing.owner.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center font-black text-xl gradient-text">
                      {listing.owner.name[0]}
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold flex items-center gap-1.5 text-sm">
                    {listing.owner.name}
                    {listing.owner.isVerified && <ShieldCheck className="w-4 h-4 text-primary" />}
                  </h4>
                  <p className="text-xs text-muted-foreground mt-0.5">Member since {new Date(listing.owner.createdAt).getFullYear()}</p>
                </div>
                <Button variant="outline" size="sm" onClick={() => setShowQr(true)} className="shrink-0">
                  <QrCode className="w-4 h-4 mr-1.5" /> QR
                </Button>
              </div>
            )}

            {/* Location placeholder */}
            <div className="rounded-2xl overflow-hidden border border-border bg-gradient-to-br from-secondary to-muted h-40 flex items-center justify-center">
              <div className="text-center">
                <div className="w-10 h-10 rounded-2xl gradient-primary flex items-center justify-center mx-auto mb-2 shadow-md shadow-primary/25">
                  <MapPin className="w-5 h-5 text-white" />
                </div>
                <p className="font-bold text-sm">{listing.city}, {listing.state}</p>
                <p className="text-xs text-muted-foreground mt-0.5">Exact location after contact</p>
              </div>
            </div>
          </div>

          {/* Right: Sticky CTA (desktop) */}
          <div className="hidden md:block w-72 shrink-0">
            <div className="sticky top-24 bg-card border border-border rounded-3xl p-6 shadow-lg shadow-black/5 flex flex-col gap-5">
              <div>
                <p className="text-muted-foreground text-sm font-medium mb-1">Starting from</p>
                <p className="text-4xl font-extrabold tracking-tight">
                  ₹{listing.rentalPrice?.daily || "—"}
                  <span className="text-base font-normal text-muted-foreground ml-1">/ day</span>
                </p>
              </div>

              {!isOwner ? (
                <button
                  onClick={handleWhatsApp}
                  className="w-full flex items-center justify-center gap-2.5 py-3.5 rounded-2xl text-white font-bold text-sm shadow-lg shadow-green-500/20 hover:shadow-xl hover:shadow-green-500/30 hover:-translate-y-0.5 transition-all duration-200 active:scale-95"
                  style={{ background: "linear-gradient(135deg,#25D366,#1eb85a)" }}
                >
                  <MessageCircle className="w-5 h-5" />
                  Contact on WhatsApp
                </button>
              ) : (
                <Button className="w-full" onClick={() => setLocation(`/listings/${listing.id}/edit`)}>
                  Edit Listing
                </Button>
              )}

              <div className="flex flex-col gap-2 pt-1">
                {[
                  { icon: ShieldCheck, text: "Verified by RentNEarn" },
                  { icon: Calendar, text: "Contact to check availability" },
                  { icon: Tag, text: "No hidden charges" },
                ].map(({ icon: Icon, text }) => (
                  <div key={text} className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Icon className="w-3.5 h-3.5 text-primary" />
                    {text}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile floating CTA */}
      <div className="md:hidden fixed bottom-0 inset-x-0 z-40 pb-[env(safe-area-inset-bottom)]">
        <div className="glass border-t mx-3 mb-3 rounded-2xl px-4 py-3 flex items-center justify-between gap-3 shadow-2xl shadow-black/20">
          <div>
            <p className="text-xs text-muted-foreground font-medium">per day</p>
            <p className="font-extrabold text-lg leading-none">₹{listing.rentalPrice?.daily || "—"}</p>
          </div>
          {isOwner ? (
            <Button className="flex-1" onClick={() => setLocation(`/listings/${listing.id}/edit`)}>Edit Listing</Button>
          ) : (
            <button
              onClick={handleWhatsApp}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-white font-bold text-sm shadow-lg hover:shadow-xl transition-all duration-200 active:scale-95"
              style={{ background: "linear-gradient(135deg,#25D366,#1eb85a)" }}
            >
              <MessageCircle className="w-4 h-4" />
              WhatsApp
            </button>
          )}
        </div>
      </div>

      {/* Share Modal */}
      <AnimatePresence>
        {showShare && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowShare(false)}
          >
            <motion.div
              initial={{ y: 48, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 48, opacity: 0 }}
              transition={{ type: "spring", bounce: 0.25, duration: 0.4 }}
              className="bg-card border border-border rounded-3xl p-6 w-full max-w-sm flex flex-col gap-5 shadow-2xl"
              onClick={e => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-extrabold text-lg">Share listing</h3>
                  <p className="text-muted-foreground text-sm mt-0.5 truncate max-w-[220px]">{listing.title}</p>
                </div>
                <button onClick={() => setShowShare(false)} className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center shrink-0 hover:bg-muted transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Platform grid */}
              <div className="grid grid-cols-4 gap-2">
                {/* WhatsApp */}
                <button
                  onClick={() => openSharePlatform(`https://wa.me/?text=${encodeURIComponent(shareText)}`)}
                  className="flex flex-col items-center gap-2 group"
                >
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-md transition-transform group-hover:scale-105 group-active:scale-95" style={{ background: "#25D366" }}>
                    <svg className="w-7 h-7 fill-white" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/></svg>
                  </div>
                  <span className="text-xs font-semibold text-muted-foreground">WhatsApp</span>
                </button>

                {/* Facebook */}
                <button
                  onClick={() => openSharePlatform(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`)}
                  className="flex flex-col items-center gap-2 group"
                >
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-md transition-transform group-hover:scale-105 group-active:scale-95" style={{ background: "#1877F2" }}>
                    <svg className="w-7 h-7 fill-white" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                  </div>
                  <span className="text-xs font-semibold text-muted-foreground">Facebook</span>
                </button>

                {/* X / Twitter */}
                <button
                  onClick={() => openSharePlatform(`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareTweet)}&url=${encodeURIComponent(shareUrl)}`)}
                  className="flex flex-col items-center gap-2 group"
                >
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-md transition-transform group-hover:scale-105 group-active:scale-95 bg-black dark:bg-white">
                    <svg className="w-6 h-6 fill-white dark:fill-black" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.737-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                  </div>
                  <span className="text-xs font-semibold text-muted-foreground">X (Twitter)</span>
                </button>

                {/* Instagram — copy link (no web share API) */}
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(shareUrl);
                    toast.success("Link copied — paste it in Instagram!");
                  }}
                  className="flex flex-col items-center gap-2 group"
                >
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-md transition-transform group-hover:scale-105 group-active:scale-95" style={{ background: "linear-gradient(45deg,#f09433,#e6683c,#dc2743,#cc2366,#bc1888)" }}>
                    <svg className="w-7 h-7 fill-white" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z"/></svg>
                  </div>
                  <span className="text-xs font-semibold text-muted-foreground">Instagram</span>
                </button>
              </div>

              {/* Copy link bar */}
              <div className="flex items-center gap-2 px-3 py-2.5 bg-secondary rounded-2xl border border-border">
                <Link2 className="w-4 h-4 text-muted-foreground shrink-0" />
                <p className="flex-1 text-sm text-muted-foreground truncate select-all">{shareUrl}</p>
                <button
                  onClick={handleCopyLink}
                  className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all bg-primary text-white hover:bg-primary/90 active:scale-95"
                >
                  {copied ? <><Check className="w-3 h-3" /> Copied</> : <><Copy className="w-3 h-3" /> Copy</>}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* QR Modal */}
      <AnimatePresence>
        {showQr && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowQr(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", bounce: 0.3 }}
              className="bg-card border border-border rounded-3xl p-8 max-w-xs w-full flex flex-col items-center text-center shadow-2xl"
              onClick={e => e.stopPropagation()}
            >
              <h3 className="font-extrabold text-xl mb-1.5">Scan to share</h3>
              <p className="text-muted-foreground text-sm mb-6">Share this listing with anyone.</p>
              {qrData?.qrDataUrl ? (
                <img src={qrData.qrDataUrl} alt="QR Code" className="w-48 h-48 rounded-2xl border border-border" />
              ) : (
                <div className="w-48 h-48 skeleton rounded-2xl" />
              )}
              <Button variant="outline" className="mt-6 w-full" onClick={() => setShowQr(false)}>Done</Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
