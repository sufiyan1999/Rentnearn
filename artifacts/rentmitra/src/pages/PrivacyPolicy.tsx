import { motion } from "framer-motion";

const LAST_UPDATED = "22 July 2026";

export default function PrivacyPolicy() {
  return (
    <div className="pb-24 md:pb-0">
      <div className="bg-[#111] text-white py-12 md:py-16">
        <div className="container mx-auto px-4 max-w-3xl">
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="text-3xl md:text-4xl font-bold mb-2">Privacy Policy</h1>
            <p className="text-white/50 text-sm">Last updated: {LAST_UPDATED}</p>
          </motion.div>
        </div>
      </div>

      <div className="container mx-auto px-4 max-w-3xl py-10 prose prose-slate dark:prose-invert max-w-none space-y-8">
        {[
          {
            title: "1. Introduction",
            body: `RentNEarn ("we", "our", "us") respects your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our website and mobile application. By using RentNEarn, you consent to the practices described in this policy.`,
          },
          {
            title: "2. Information We Collect",
            subsections: [
              {
                sub: "Account Information",
                body: "When you register, we collect your name, email address, phone number, and password (stored as a bcrypt hash). If you sign in with Google, we receive your name, email, and profile photo from Google.",
              },
              {
                sub: "Listing Information",
                body: "When you create a listing, we collect the item details, photos, price, and your city/state. This information is shared publicly on the platform.",
              },
              {
                sub: "Cookies",
                body: "We use essential cookies to maintain your session and remember your login. With your consent, we may use functional and analytics cookies to personalise your experience and understand usage patterns.",
              },
              {
                sub: "Analytics",
                body: "We may collect anonymised usage data including pages visited, search terms, and app interactions to improve the platform. This data cannot identify you individually.",
              },
              {
                sub: "Third-Party Services",
                body: "We integrate with Zoho Mail for transactional emails. Our image CDN processes uploaded photos. Google OAuth is used for social login. These services have their own privacy policies.",
              },
            ],
          },
          {
            title: "3. How We Use Your Information",
            body: `We use your information to: operate and improve the platform; send transactional emails (welcome, listing approval, password reset); enable contact between owners and renters via WhatsApp; enforce our Terms of Service; and comply with legal obligations.`,
          },
          {
            title: "4. Data Sharing",
            body: `We do not sell your personal data. We share information only: with service providers who operate under strict data-processing agreements; when required by Indian law or a valid legal order; or with your explicit consent. Public listing data (item name, photos, city, price) is visible to all users.`,
          },
          {
            title: "5. Data Security",
            body: `We use industry-standard measures including HTTPS, password hashing (bcrypt), and restricted database access. However, no transmission over the internet is 100% secure. Please use a strong, unique password for your account.`,
          },
          {
            title: "6. Data Retention",
            body: `We retain your account data while your account is active. Deleted account data is removed within 30 days except where we are required to retain it for legal compliance. Listings are kept for 30 days after expiry before deletion.`,
          },
          {
            title: "7. Your Rights",
            body: `You have the right to: access the personal data we hold about you; correct inaccurate data; request deletion of your account and data; withdraw consent for non-essential cookies at any time. To exercise these rights, email support@rentnearn.com.`,
          },
          {
            title: "8. Children's Privacy",
            body: `RentNEarn is not intended for users under 18. We do not knowingly collect personal information from minors. If you believe a minor has provided us with personal information, please contact us immediately.`,
          },
          {
            title: "9. Changes to This Policy",
            body: `We may update this policy from time to time. We will notify you of significant changes by email or by displaying a prominent notice on the platform. Continued use of RentNEarn after changes constitutes acceptance.`,
          },
          {
            title: "10. Contact Us",
            body: `For privacy-related queries: support@rentnearn.com — AlliedReach, 11 Granada, LBS Marg, Opp. Phoenix Mall, Kurla West, Mumbai – 400070`,
          },
        ].map(({ title, body, subsections }) => (
          <motion.section key={title} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
            <h2 className="text-xl font-bold mb-3">{title}</h2>
            {body && <p className="text-muted-foreground leading-relaxed text-sm">{body}</p>}
            {subsections && subsections.map(({ sub, body: sb }) => (
              <div key={sub} className="mt-4 pl-4 border-l-2 border-primary/30">
                <h3 className="font-semibold text-sm mb-1">{sub}</h3>
                <p className="text-muted-foreground leading-relaxed text-sm">{sb}</p>
              </div>
            ))}
          </motion.section>
        ))}
      </div>
    </div>
  );
}
