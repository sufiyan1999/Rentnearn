/**
 * MetaPixel — global component mounted once in App.tsx.
 *
 * - Initialises the Facebook Pixel on first render (production only).
 * - Fires a PageView event on every client-side route change.
 * - Renders nothing to the DOM.
 */
import { useEffect } from "react";
import { useLocation } from "wouter";
import { initPixel, trackPageView } from "@/lib/metaPixel";

export function MetaPixel() {
  const [location] = useLocation();

  // Initialise once — injects the fbevents.js script and calls fbq('init')
  useEffect(() => {
    initPixel();
  }, []);

  // Track a PageView on every route change (including the initial load)
  useEffect(() => {
    trackPageView();
  }, [location]);

  return null;
}
