import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";

const LAST_UPDATED = "22 July 2026";

const COOKIE_TYPES = [
  {
    type: "Essential Cookies",
    canDisable: false,
    examples: "Session tokens, login state, CSRF protection",
    desc: "These cookies are necessary for the website to function and cannot be disabled. They are usually set in response to actions you take such as logging in or submitting a form.",
  },
  {
    type: "Functional Cookies",
    canDisable: true,
    examples: "Theme preference (dark/light), recent search history",
    desc: "These cookies allow the website to remember choices you make and provide enhanced, personalised features. They do not track your browsing activity on other websites.",
  },
  {
    type: "Analytics Cookies",
    canDisable: true,
    examples: "Page views, session duration, feature usage patterns",
    desc: "These cookies help us understand how visitors interact with RentMitra by collecting and reporting anonymised information. No personally identifiable information is included.",
  },
];

export default function CookiePolicy() {
  function resetConsent() {
    localStorage.removeItem("rentmitra_cookie_consent");
    window.location.reload();
  }

  return (
    <div className="pb-24 md:pb-0">
      <div className="bg-[#111] text-white py-12 md:py-16">
        <div className="container mx-auto px-4 max-w-3xl">
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="text-3xl md:text-4xl font-bold mb-2">Cookie Policy</h1>
            <p className="text-white/50 text-sm">Last updated: {LAST_UPDATED}</p>
          </motion.div>
        </div>
      </div>

      <div className="container mx-auto px-4 max-w-3xl py-10 space-y-8">
        <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <h2 className="text-xl font-bold mb-3">What Are Cookies?</h2>
          <p className="text-muted-foreground text-sm leading-relaxed">
            Cookies are small text files stored on your device when you visit a website. They help the site remember information
            about your visit — such as your login status or preferences — so you don't have to re-enter it every time.
            Cookies cannot run programs or deliver viruses to your computer.
          </p>
        </motion.section>

        <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
          <h2 className="text-xl font-bold mb-5">Types of Cookies We Use</h2>
          <div className="space-y-4">
            {COOKIE_TYPES.map(({ type, canDisable, examples, desc }) => (
              <div key={type} className="bg-card border border-border rounded-2xl p-5">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold">{type}</h3>
                  <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${canDisable ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"}`}>
                    {canDisable ? "Optional" : "Required"}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed mb-2">{desc}</p>
                <p className="text-xs text-muted-foreground/70"><span className="font-medium">Examples:</span> {examples}</p>
              </div>
            ))}
          </div>
        </motion.section>

        <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <h2 className="text-xl font-bold mb-3">Managing Cookies</h2>
          <p className="text-muted-foreground text-sm leading-relaxed mb-4">
            You can control non-essential cookies at any time using our Cookie Settings panel, which appears when you first
            visit RentMitra. Your preferences are stored in your browser's local storage. You can also manage cookies through
            your browser settings — most browsers allow you to refuse all cookies or accept only certain types.
          </p>
          <p className="text-muted-foreground text-sm leading-relaxed mb-5">
            Note: disabling essential cookies may affect your ability to use core features like logging in or submitting listings.
          </p>
          <Button variant="outline" onClick={resetConsent} className="rounded-xl text-sm">
            Reset Cookie Preferences
          </Button>
        </motion.section>

        <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <h2 className="text-xl font-bold mb-3">Cookie Consent</h2>
          <p className="text-muted-foreground text-sm leading-relaxed">
            On your first visit, we display a cookie consent banner at the bottom of the screen. You may Accept All,
            Reject Non-Essential cookies, or open Cookie Settings to choose individually. Your choice is saved to local
            storage and respected on future visits. You may update your choice at any time by clicking "Reset Cookie
            Preferences" above.
          </p>
        </motion.section>

        <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <h2 className="text-xl font-bold mb-3">Contact</h2>
          <p className="text-muted-foreground text-sm leading-relaxed">
            If you have questions about our use of cookies, contact us at{" "}
            <a href="mailto:privacy@rentmitra.in" className="text-primary underline underline-offset-2">privacy@rentmitra.in</a>.
          </p>
        </motion.section>
      </div>
    </div>
  );
}
