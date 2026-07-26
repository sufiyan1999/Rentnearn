import { motion } from "framer-motion";

const LAST_UPDATED = "22 July 2026";

export default function TermsOfService() {
  return (
    <div className="pb-24 md:pb-0">
      <div className="bg-[#111] text-white py-12 md:py-16">
        <div className="container mx-auto px-4 max-w-3xl">
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="text-3xl md:text-4xl font-bold mb-2">Terms of Service</h1>
            <p className="text-white/50 text-sm">Last updated: {LAST_UPDATED}</p>
          </motion.div>
        </div>
      </div>

      <div className="container mx-auto px-4 max-w-3xl py-10 space-y-8">
        {[
          {
            title: "1. Acceptance of Terms",
            body: `By accessing or using RentNEarn, you agree to be bound by these Terms of Service and our Privacy Policy. If you do not agree, you must not use the platform.`,
          },
          {
            title: "2. User Responsibilities",
            body: `You are responsible for maintaining the confidentiality of your account credentials. You must not share your account with others. You are responsible for all activity under your account. You must provide accurate, current, and complete information when registering or creating a listing.`,
          },
          {
            title: "3. Listing Rules",
            body: `Listings must accurately describe the item including condition, photos, and pricing. Listing prices are set by the owner and are in Indian Rupees (INR). Listings automatically expire after 30 days and must be renewed. Items must be in the owner's possession and legally available for rent. Owners must respond to enquiries promptly.`,
          },
          {
            title: "4. Prohibited Items",
            body: `The following items may not be listed on RentNEarn: firearms, weapons, or ammunition; controlled substances or illegal drugs; stolen or counterfeit goods; items that violate any intellectual property rights; adult-only content or products; animals; items that require a government licence to operate (unless you hold that licence); any item whose rental is prohibited under Indian law.`,
          },
          {
            title: "5. Account Suspension & Termination",
            body: `We reserve the right to suspend or permanently terminate accounts that: repeatedly violate these Terms; submit fraudulent, misleading, or prohibited listings; engage in harassment, abuse, or threatening behaviour; are found to be associated with scam or fraud activity. Terminated accounts may not re-register without express written permission.`,
          },
          {
            title: "6. Disclaimer of Liability",
            body: `RentNEarn is a marketplace platform that connects owners and renters. We are not a party to any rental agreement between users. We are not responsible for the condition, quality, safety, or legality of listed items. We are not responsible for any payment disputes, deposits, damages, loss, or injury arising from a rental transaction. Users enter rental agreements entirely at their own risk.`,
          },
          {
            title: "7. Intellectual Property",
            body: `All content, trademarks, logos, and design elements on RentNEarn are owned by or licensed to RentNEarn India and may not be reproduced without written consent. By uploading photos or content, you grant RentNEarn a non-exclusive, royalty-free licence to display that content on the platform.`,
          },
          {
            title: "8. Limitation of Liability",
            body: `To the maximum extent permitted by Indian law, RentNEarn shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of the platform, even if advised of the possibility of such damages. Our total liability to you for any claim shall not exceed ₹1,000 (One Thousand Indian Rupees).`,
          },
          {
            title: "9. Governing Law",
            body: `These Terms are governed by and construed in accordance with the laws of India. Any dispute arising from these Terms shall be subject to the exclusive jurisdiction of the courts located in Bangalore, Karnataka, India.`,
          },
          {
            title: "10. Changes to Terms",
            body: `We may update these Terms at any time. Continued use of RentNEarn after changes are posted constitutes acceptance of the new Terms. We will provide notice of material changes by email or prominent in-app notification.`,
          },
          {
            title: "11. Contact",
            body: `For legal enquiries: support@rentnearn.com — RentNEarn India`,
          },
        ].map(({ title, body }) => (
          <motion.section key={title} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
            <h2 className="text-xl font-bold mb-3">{title}</h2>
            <p className="text-muted-foreground leading-relaxed text-sm">{body}</p>
          </motion.section>
        ))}
      </div>
    </div>
  );
}
