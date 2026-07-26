/**
 * Client-side restricted items check — mirrors the server policy.
 * Real enforcement is always done server-side; this provides immediate UX feedback.
 */

const RULES: { pattern: RegExp; label: string }[] = [
  { pattern: /\b(firearm|fire.?arm|gun|pistol|revolver|rifle|shotgun|musket|carbine|handgun|air.?gun|pellet.?gun|bb.?gun)\b/i, label: "Firearms" },
  { pattern: /\b(ammunition|ammo|bullet|cartridge|shell casing|explosive|bomb|grenade|landmine|detonator|dynamite|gunpowder)\b/i, label: "Ammunition & Explosives" },
  { pattern: /\b(sword|dagger|stiletto|switchblade|flick.?knife|gravity.?knife|butterfly.?knife|balisong|brass.?knuckle|knuckle.?duster|nunchuck|nunchaku|shuriken|throwing.?star|sling.?shot)\b/i, label: "Prohibited Weapons" },
  { pattern: /\b(sex.?toy|dildo|vibrator|masturbat(or|ion)|butt.?plug|anal.?plug|fleshlight|cock.?ring|penis.?pump|sex.?doll|blow.?up.?doll|bondage.?gear|adult.?toy|pornograph|obscen(e|ity)|erotic.?device)\b/i, label: "Adult / Obscene Items" },
  { pattern: /\b(cocaine|heroin|marijuana|cannabis|weed|ganja|charas|bhang|opium|meth|methamphetamine|amphetamine|mdma|ecstasy|lsd|lysergic|narcotic|psychedelic.?drug|ketamine|crack.?cocaine|fentanyl)\b/i, label: "Narcotics & Controlled Drugs" },
  { pattern: /\b(bong for drugs|crack.?pipe|meth.?pipe|drug.?paraphernalia)\b/i, label: "Drug Paraphernalia" },
  { pattern: /\b(ivory|rhino.?horn|tiger.?skin|leopard.?skin|shahtoosh|turtle.?shell|bear.?bile|pangolin|wildlife.?product)\b/i, label: "Wildlife / Endangered Species Products" },
  { pattern: /\b(counterfeit|fake.?currency|forged.?(document|note|currency)|replica.?(gun|firearm|weapon))\b/i, label: "Counterfeit / Forgery" },
  { pattern: /\b(spy.?camera|hidden.?camera|covert.?camera|stalkerware|imsi.?catcher|signal.?jammer|gps.?jammer|phone.?jammer|gsm.?jammer)\b/i, label: "Illegal Surveillance / Jamming Equipment" },
  { pattern: /\b(radioactive.?material|biohazard|chemical.?weapon|nerve.?agent|sarin|vx.?gas|mustard.?gas|biological.?weapon)\b/i, label: "Hazardous / Chemical Materials" },
  { pattern: /\b(credit.?card.?skimmer|atm.?skimmer|card.?skimmer|phishing.?kit|malware.?kit|exploit.?kit)\b/i, label: "Cybercrime Tools" },
];

export interface RestrictedResult {
  restricted: boolean;
  label?: string;
}

export function checkRestrictedContent(...texts: (string | null | undefined)[]): RestrictedResult {
  const combined = texts.filter(Boolean).join(" ");
  for (const rule of RULES) {
    if (rule.pattern.test(combined)) {
      return { restricted: true, label: rule.label };
    }
  }
  return { restricted: false };
}

export const PROHIBITED_CATEGORIES = [
  "Firearms, guns & ammunition",
  "Edged / impact weapons (swords, knuckle dusters, etc.)",
  "Adult / obscene items & sex toys",
  "Narcotics, drugs & drug paraphernalia",
  "Wildlife products (ivory, animal skins, etc.)",
  "Counterfeit currency or forged documents",
  "Signal jammers & covert surveillance devices",
  "Chemical, biological or radioactive materials",
  "ATM / credit card skimmers & hacking tools",
];
