import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Cookie, X, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

const STORAGE_KEY = "rentnearn_cookie_consent";

type ConsentValue = "accepted" | "rejected" | null;

export default function CookieConsent() {
  const [visible, setVisible] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [prefs, setPrefs] = useState({ functional: true, analytics: false });

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) {
      // Small delay so it doesn't flash on initial paint
      const t = setTimeout(() => setVisible(true), 1200);
      return () => clearTimeout(t);
    }
  }, []);

  function save(value: ConsentValue, customPrefs?: typeof prefs) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ value, prefs: customPrefs ?? prefs, ts: Date.now() }));
    setVisible(false);
  }

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: 120, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 120, opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="fixed bottom-20 md:bottom-6 left-0 right-0 z-[200] px-4 pointer-events-none"
        >
          <div className="max-w-2xl mx-auto bg-[#111] text-white rounded-2xl shadow-2xl border border-white/10 overflow-hidden pointer-events-auto">
            {!showSettings ? (
              <div className="p-5 flex flex-col sm:flex-row gap-4">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <Cookie className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                  <p className="text-sm text-white/75 leading-relaxed">
                    We use cookies to improve your experience. By continuing, you agree to our{" "}
                    <Link href="/cookies" className="text-primary underline underline-offset-2">Cookie Policy</Link>.
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0 flex-wrap">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setShowSettings(true)}
                    className="text-white/60 hover:text-white h-8 px-3 text-xs"
                  >
                    <Settings className="w-3.5 h-3.5 mr-1.5" />
                    Settings
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => save("rejected", { functional: true, analytics: false })}
                    className="border-white/20 text-white hover:bg-white/10 h-8 px-4 text-xs bg-transparent"
                  >
                    Reject Non-Essential
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => save("accepted", { functional: true, analytics: true })}
                    className="bg-primary hover:bg-primary/90 h-8 px-4 text-xs"
                  >
                    Accept All
                  </Button>
                </div>
              </div>
            ) : (
              <div className="p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-sm">Cookie Settings</h3>
                  <button onClick={() => setShowSettings(false)} className="text-white/40 hover:text-white transition-colors">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                {[
                  { key: "essential", label: "Essential Cookies", desc: "Required for the site to function. Cannot be disabled.", fixed: true },
                  { key: "functional", label: "Functional Cookies", desc: "Remember your preferences and settings.", fixed: false },
                  { key: "analytics", label: "Analytics Cookies", desc: "Help us understand how you use the app.", fixed: false },
                ].map(({ key, label, desc, fixed }) => (
                  <div key={key} className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-medium">{label}</p>
                      <p className="text-xs text-white/45 mt-0.5">{desc}</p>
                    </div>
                    <button
                      disabled={fixed}
                      onClick={() => !fixed && setPrefs(p => ({ ...p, [key]: !p[key as keyof typeof p] }))}
                      className={`shrink-0 w-11 h-6 rounded-full transition-colors relative ${
                        fixed || prefs[key as keyof typeof prefs] ? "bg-primary" : "bg-white/20"
                      } ${fixed ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}`}
                    >
                      <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                        fixed || prefs[key as keyof typeof prefs] ? "translate-x-[22px]" : "translate-x-0.5"
                      }`} />
                    </button>
                  </div>
                ))}
                <div className="flex gap-2 pt-2">
                  <Button size="sm" onClick={() => save("rejected")} variant="outline" className="flex-1 border-white/20 text-white hover:bg-white/10 text-xs bg-transparent h-8">
                    Save Preferences
                  </Button>
                  <Button size="sm" onClick={() => save("accepted", { functional: true, analytics: true })} className="flex-1 bg-primary hover:bg-primary/90 h-8 text-xs">
                    Accept All
                  </Button>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
