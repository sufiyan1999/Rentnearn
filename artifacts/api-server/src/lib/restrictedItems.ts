/**
 * Restricted items policy for RentNEarn (India)
 *
 * References:
 *  - Arms Act, 1959 & Arms Rules, 2016
 *  - Narcotic Drugs and Psychotropic Substances Act, 1985 (NDPS)
 *  - IPC sections 292–294 (obscenity)
 *  - Wildlife Protection Act, 1972
 *  - Explosives Act, 1884
 *  - Information Technology Act, 2000
 *  - Indian Wireless Telegraphy Act, 1933 (signal jammers)
 */

interface RestrictedCheck {
  restricted: boolean;
  reason?: string;
  category?: string;
}

const RULES: { pattern: RegExp; category: string; reason: string }[] = [
  // ── Firearms & Guns ──────────────────────────────────────────────────
  {
    pattern: /\b(firearm|fire.?arm|gun|pistol|revolver|rifle|shotgun|musket|carbine|handgun|air.?gun|pellet.?gun|bb.?gun)\b/i,
    category: "Firearms",
    reason: "Firearms and guns are prohibited under the Arms Act, 1959.",
  },
  // ── Ammunition & Explosives ──────────────────────────────────────────
  {
    pattern: /\b(ammunition|ammo|bullet|cartridge|shell casing|explosive|bomb|grenade|landmine|detonator|blasting cap|dynamite|gunpowder)\b/i,
    category: "Ammunition & Explosives",
    reason: "Ammunition and explosives are prohibited under the Arms Act and Explosives Act.",
  },
  // ── Prohibited Weapons ───────────────────────────────────────────────
  {
    pattern: /\b(sword|kirpan for sale|dagger|stiletto|switchblade|flick.?knife|gravity.?knife|butterfly.?knife|balisong|brass.?knuckle|knuckle.?duster|nunchuck|nunchaku|shuriken|throwing.?star|sling.?shot|knuckleduster)\b/i,
    category: "Prohibited Weapons",
    reason: "Many edged and impact weapons are restricted under the Arms Act, 1959.",
  },
  // ── Adult / Obscene Items ────────────────────────────────────────────
  {
    pattern: /\b(sex.?toy|dildo|vibrator|masturbat(or|ion)|butt.?plug|anal.?plug|fleshlight|cock.?ring|penis.?pump|sex.?doll|blow.?up.?doll|bdsm.?equipment|bondage.?gear|adult.?toy|pornograph|obscen(e|ity)|erotic.?device)\b/i,
    category: "Adult / Obscene Items",
    reason: "Adult and obscene articles are prohibited under IPC sections 292–294.",
  },
  // ── Narcotics & Drugs ────────────────────────────────────────────────
  {
    pattern: /\b(cocaine|heroin|marijuana|cannabis|weed|ganja|charas|bhang|opium|poppy.?husk|afeem|meth|methamphetamine|amphetamine|mdma|ecstasy|lsd|lysergic|narcotic|psychedelic.?drug|ketamine|crack.?cocaine|fentanyl|tramadol.?abuse)\b/i,
    category: "Narcotics & Controlled Drugs",
    reason: "Narcotics and psychotropic substances are prohibited under the NDPS Act, 1985.",
  },
  // ── Drug Paraphernalia ───────────────────────────────────────────────
  {
    pattern: /\b(bong for drugs|crack.?pipe|meth.?pipe|drug.?paraphernalia|rolling.?papers.?for.?drugs|dab.?rig)\b/i,
    category: "Drug Paraphernalia",
    reason: "Drug paraphernalia is prohibited under the NDPS Act, 1985.",
  },
  // ── Wildlife & Animal Products ───────────────────────────────────────
  {
    pattern: /\b(ivory|rhino.?horn|tiger.?skin|leopard.?skin|shahtoosh|turtle.?shell|bear.?bile|pangolin|wildlife.?product|taxidermy.?of.?(tiger|leopard|rhino|elephant|bear|pangolin))\b/i,
    category: "Wildlife / Endangered Species Products",
    reason: "Trade in wildlife products is prohibited under the Wildlife Protection Act, 1972.",
  },
  // ── Counterfeit / Forgery ────────────────────────────────────────────
  {
    pattern: /\b(counterfeit|fake.?currency|forged.?(document|note|currency)|replica.?(gun|firearm|weapon))\b/i,
    category: "Counterfeit / Forgery",
    reason: "Counterfeit currency and forged documents are criminal offences under the IPC.",
  },
  // ── Illegal Surveillance ─────────────────────────────────────────────
  {
    pattern: /\b(spy.?camera|hidden.?camera|covert.?camera|stalkerware|imsi.?catcher|stingray.?device|signal.?jammer|gps.?jammer|phone.?jammer|drone.?jammer|gsm.?jammer)\b/i,
    category: "Illegal Surveillance / Jamming Equipment",
    reason: "Signal jammers and covert surveillance devices are prohibited under the Indian Wireless Telegraphy Act and IT Act.",
  },
  // ── Hazardous / Chemical / Biological ───────────────────────────────
  {
    pattern: /\b(radioactive.?material|biohazard|chemical.?weapon|nerve.?agent|sarin|vx.?gas|mustard.?gas|toxic.?chemical.?weapon|biological.?weapon)\b/i,
    category: "Hazardous / Chemical / Biological Materials",
    reason: "Chemical, biological, radiological materials are strictly prohibited.",
  },
  // ── Hacking / Cracking Tools ─────────────────────────────────────────
  {
    pattern: /\b(hacking.?tool|credit.?card.?skimmer|atm.?skimmer|card.?skimmer|phishing.?kit|malware.?kit|exploit.?kit)\b/i,
    category: "Cybercrime Tools",
    reason: "Hacking tools and skimming devices are prohibited under the IT Act, 2000.",
  },
];

/**
 * Check multiple text fields (title, description, customCategory) for restricted content.
 * Returns the first violation found, or { restricted: false } if clean.
 */
export function checkRestrictedContent(...texts: (string | null | undefined)[]): RestrictedCheck {
  const combined = texts.filter(Boolean).join(" ");
  for (const rule of RULES) {
    if (rule.pattern.test(combined)) {
      return {
        restricted: true,
        category: rule.category,
        reason: rule.reason,
      };
    }
  }
  return { restricted: false };
}
