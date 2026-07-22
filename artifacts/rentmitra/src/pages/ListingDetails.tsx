import { useRoute, useLocation } from "wouter";
import { useGetListing, getGetListingQueryKey, useGetListingQr, getGetListingQrQueryKey } from "@workspace/api-client-react";
import { Button } from "@/components/ui/ui-core";
import { ArrowLeft, MapPin, Share2, MessageCircle, AlertTriangle, ShieldCheck, QrCode } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useState } from "react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogTrigger } from "@radix-ui/react-dialog"; // Assume we have dialog, but if not we'll build a basic one. Let's just use conditional rendering for modal for simplicity if Dialog isn't built yet.

export default function ListingDetails() {
  const [, params] = useRoute("/listings/:id");
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const id = Number(params?.id);

  const [activeImage, setActiveImage] = useState(0);
  const [showQr, setShowQr] = useState(false);

  const { data: listing, isLoading, error } = useGetListing(id, {
    query: {
      enabled: !!id,
      queryKey: getGetListingQueryKey(id)
    }
  });

  const { data: qrData } = useGetListingQr(id, {
    query: {
      enabled: !!id,
      queryKey: getGetListingQrQueryKey(id)
    }
  });

  if (isLoading) {
    return <div className="h-[80vh] flex items-center justify-center animate-pulse text-muted-foreground">Loading...</div>;
  }

  if (error || !listing) {
    return (
      <div className="h-[80vh] flex flex-col items-center justify-center text-center px-4">
        <AlertTriangle className="w-12 h-12 text-destructive mb-4" />
        <h1 className="text-2xl font-bold">Listing not found</h1>
        <p className="text-muted-foreground mb-6">This item might have been removed or is unavailable.</p>
        <Button onClick={() => setLocation("/")}>Go Home</Button>
      </div>
    );
  }

  const images = listing.images?.length ? listing.images : ["https://placehold.co/800x600/e2e8f0/8492a6?text=No+Image"];

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: listing.title,
          text: `Check out ${listing.title} on RentMitra`,
          url: window.location.href,
        });
      } catch (e) {
        console.log("Share failed", e);
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success("Link copied to clipboard");
    }
  };

  const isOwner = user?.id === listing.ownerId;

  return (
    <div className="pb-24">
      {/* Mobile Top Bar */}
      <div className="md:hidden fixed top-0 w-full z-50 flex items-center justify-between p-4 pointer-events-none">
        <button 
          onClick={() => setLocation(-1 as any)} 
          className="w-10 h-10 bg-background/80 backdrop-blur-xl rounded-full flex items-center justify-center pointer-events-auto shadow-sm"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <button 
          onClick={handleShare}
          className="w-10 h-10 bg-background/80 backdrop-blur-xl rounded-full flex items-center justify-center pointer-events-auto shadow-sm"
        >
          <Share2 className="w-5 h-5" />
        </button>
      </div>

      {/* Hero Gallery */}
      <div className="relative w-full aspect-square md:aspect-[2/1] bg-secondary md:rounded-b-[3rem] overflow-hidden">
        <img 
          src={images[activeImage]} 
          alt={listing.title} 
          className="w-full h-full object-cover"
        />
        {images.length > 1 && (
          <div className="absolute bottom-4 left-0 w-full flex justify-center gap-2">
            {images.map((_, i) => (
              <button 
                key={i}
                onClick={() => setActiveImage(i)}
                className={`w-2 h-2 rounded-full transition-all ${i === activeImage ? 'bg-primary w-4' : 'bg-white/50'}`}
              />
            ))}
          </div>
        )}
      </div>

      <div className="container mx-auto px-4 max-w-4xl -mt-6 relative z-10">
        <div className="bg-background rounded-t-[2rem] md:rounded-3xl p-6 md:p-8 shadow-sm border border-border flex flex-col gap-6">
          
          {/* Header */}
          <div>
            <div className="flex justify-between items-start mb-2">
              <span className="px-3 py-1 bg-secondary text-secondary-foreground rounded-full text-xs font-bold uppercase">
                {listing.category}
              </span>
              <div className="hidden md:flex gap-2">
                {isOwner && (
                  <Button variant="outline" size="sm" onClick={() => setLocation(`/listings/${listing.id}/edit`)}>
                    Edit Listing
                  </Button>
                )}
                <Button variant="secondary" size="icon" onClick={handleShare}>
                  <Share2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
            
            <h1 className="text-2xl md:text-4xl font-bold mb-2">{listing.title}</h1>
            <div className="flex items-center text-muted-foreground text-sm gap-4">
              <span className="flex items-center gap-1">
                <MapPin className="w-4 h-4" />
                {listing.city}, {listing.state}
              </span>
              <span className="capitalize px-2 py-0.5 border border-border rounded-md">
                Condition: {listing.condition?.replace('_', ' ')}
              </span>
            </div>
          </div>

          <hr className="border-border" />

          {/* Pricing */}
          <div className="bg-secondary/50 rounded-2xl p-4 flex flex-wrap gap-4 items-center justify-between">
            <div className="flex flex-col">
              <span className="text-muted-foreground text-sm font-medium">Daily</span>
              <span className="text-xl font-bold text-primary">₹{listing.rentalPrice?.daily || '--'}</span>
            </div>
            <div className="w-px h-8 bg-border hidden sm:block"></div>
            <div className="flex flex-col">
              <span className="text-muted-foreground text-sm font-medium">Weekly</span>
              <span className="text-xl font-bold">₹{listing.rentalPrice?.weekly || '--'}</span>
            </div>
            <div className="w-px h-8 bg-border hidden sm:block"></div>
            <div className="flex flex-col">
              <span className="text-muted-foreground text-sm font-medium">Monthly</span>
              <span className="text-xl font-bold">₹{listing.rentalPrice?.monthly || '--'}</span>
            </div>
          </div>

          {/* Description */}
          <div>
            <h3 className="text-lg font-bold mb-3">About this item</h3>
            <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
              {listing.description || "No description provided."}
            </p>
          </div>

          {/* Owner Info */}
          {listing.owner && (
            <div className="flex items-center justify-between p-4 border border-border rounded-2xl bg-card">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-secondary overflow-hidden">
                  {listing.owner.profilePhoto ? (
                    <img src={listing.owner.profilePhoto} alt={listing.owner.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center font-bold text-lg">
                      {listing.owner.name[0]}
                    </div>
                  )}
                </div>
                <div>
                  <h4 className="font-bold flex items-center gap-1">
                    {listing.owner.name} 
                    {listing.owner.isVerified && <ShieldCheck className="w-4 h-4 text-primary" />}
                  </h4>
                  <p className="text-xs text-muted-foreground">Joined {new Date(listing.owner.createdAt).getFullYear()}</p>
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={() => setShowQr(true)}>
                <QrCode className="w-4 h-4 mr-2" /> Show QR
              </Button>
            </div>
          )}

          {/* Map Placeholder */}
          <div className="rounded-2xl overflow-hidden border border-border bg-secondary flex items-center justify-center h-48 relative">
            <div className="absolute inset-0 opacity-10 bg-[url('https://placehold.co/800x400/000000/ffffff?text=Map')] bg-cover"></div>
            <div className="z-10 flex flex-col items-center">
              <MapPin className="w-8 h-8 text-primary mb-2" />
              <span className="font-bold">{listing.city}, {listing.state}</span>
              <span className="text-xs text-muted-foreground">Exact location provided after booking</span>
            </div>
          </div>

        </div>
      </div>

      {/* Floating Action Area */}
      <div className="fixed bottom-0 left-0 w-full p-4 bg-background/90 backdrop-blur-xl border-t border-border z-40 md:hidden flex justify-between items-center gap-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
        <div className="flex flex-col">
          <span className="font-bold text-lg">₹{listing.rentalPrice?.daily} <span className="text-sm font-normal text-muted-foreground">/ day</span></span>
        </div>
        {isOwner ? (
          <Button onClick={() => setLocation(`/listings/${listing.id}/edit`)}>Edit</Button>
        ) : (
          <Button 
            className="flex-1 bg-[#25D366] hover:bg-[#20bd5a] text-white shadow-lg shadow-[#25D366]/20"
            onClick={() => {
              if (!listing.owner?.phone) {
                toast.error("Owner phone number not available");
                return;
              }
              const msg = encodeURIComponent(`Hi, I saw your listing for ${listing.title} on RentMitra.`);
              window.open(`https://wa.me/91${listing.owner.phone}?text=${msg}`, '_blank');
            }}
          >
            <MessageCircle className="w-4 h-4 mr-2" /> WhatsApp
          </Button>
        )}
      </div>

      {/* Desktop Action Box (Sidebar logic if we had side layout, but here we just append to bottom) */}
      <div className="hidden md:flex justify-end max-w-4xl mx-auto px-4 mt-6">
        {!isOwner && (
          <Button 
            size="lg"
            className="bg-[#25D366] hover:bg-[#20bd5a] text-white shadow-lg shadow-[#25D366]/20 px-8"
            onClick={() => {
              if (!listing.owner?.phone) {
                toast.error("Owner phone number not available");
                return;
              }
              const msg = encodeURIComponent(`Hi, I saw your listing for ${listing.title} on RentMitra.`);
              window.open(`https://wa.me/91${listing.owner.phone}?text=${msg}`, '_blank');
            }}
          >
            <MessageCircle className="w-5 h-5 mr-2" /> Contact via WhatsApp
          </Button>
        )}
      </div>

      {/* QR Modal (Simple implementation) */}
      {showQr && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setShowQr(false)}>
          <div className="bg-background rounded-3xl p-8 max-w-sm w-full flex flex-col items-center text-center shadow-2xl" onClick={e => e.stopPropagation()}>
            <h3 className="font-bold text-xl mb-2">Scan to view</h3>
            <p className="text-muted-foreground text-sm mb-6">Share this QR code with friends to let them see this listing.</p>
            {qrData?.qrDataUrl ? (
              <img src={qrData.qrDataUrl} alt="QR Code" className="w-48 h-48 rounded-xl" />
            ) : (
              <div className="w-48 h-48 bg-secondary animate-pulse rounded-xl" />
            )}
            <Button variant="outline" className="mt-8 w-full" onClick={() => setShowQr(false)}>Close</Button>
          </div>
        </div>
      )}
    </div>
  );
}
