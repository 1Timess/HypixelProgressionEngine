import type { ItemDefinition } from "@/schemas/items";

export type WeaponSpecializationKind =
  | "TARGET_RESTRICTED" | "EVENT_RESTRICTED" | "LOCATION_RESTRICTED" | "EQUIPMENT_DEPENDENT";

export interface WeaponRestriction {
  kind: WeaponSpecializationKind;
  /** Literal lore subject, or null when its boundary cannot be established. */
  subject: string | null;
  /** A conditional bonus does not make the whole weapon unusable elsewhere. */
  scope: "EFFECT" | "WEAPON";
  evidence: string[];
}

export interface WeaponSpecializationEvidence {
  restrictions: WeaponRestriction[];
  restricted: boolean;
  kinds: WeaponSpecializationKind[];
  evidence: string[];
}

function stripFormatting(value: string): string {
  return value.replace(/§[0-9A-FK-OR]/gi, "").replace(/\s+/g, " ").trim();
}

function getLoreSegments(item: ItemDefinition): string[] {
  const segments: string[] = [];
  let lines: string[] = [];
  const flush = () => {
    if (lines.length) segments.push(stripFormatting(lines.join(" ")));
    lines = [];
  };
  for (const rawLine of item.knowledge.rawLore) {
    const line = stripFormatting(rawLine);
    if (line) lines.push(line);
    else flush();
  }
  flush();
  return segments;
}

const RULES: { kind: WeaponSpecializationKind; detect: RegExp; subjects: RegExp[] }[] = [
  {
    kind: "TARGET_RESTRICTED",
    detect: /\b(?:deal(?:s|ing)?\s+\+?\d+(?:%|x)[^.]*\bdamage to|deal(?:s|ing)?\b[^.]*\b(?:bonus damage to|more damage to|damage against)|(?:receive|take)\b[^.]*\b(?:less|reduced)\b[^.]*\bdamage from|(?:less|reduced)\b[^.]*\bdamage from|damage bonus\b[^.]*\b(?:against|to))\b/i,
    subjects: [
      /\bdamage\s+(?:to|against|from)\s+(.+?)(?=\s+(?:during|while|when|and grants|and gain|for every|for each)\b|[.,;!]|$)/gi,
      /\bdamage bonus\s+(?:against|to)\s+(.+?)(?=[.,;!]|$)/gi,
    ],
  },
  {
    kind: "EVENT_RESTRICTED",
    detect: /\b(?:during (?:the )?[^.]*\b(?:festival|event)|while (?:the )?[^.]*\b(?:festival|event)\b[^.]*\bactive|only during\b[^.]+)/i,
    subjects: [
      /\b(?:during|while)\s+(?:the\s+)?([^.,;]+?\b(?:festival|event))\b/gi,
      /\bonly during\s+([^.,;]+?)(?=[.,;]|$)/gi,
    ],
  },
  {
    kind: "LOCATION_RESTRICTED",
    detect: /\b(?:(?:while|when) in|this (?:weapon|item) (?:can only be used|only works) in)\b/i,
    subjects: [
      /\b(?:while|when) in\s+([^,.:;]+?)(?=[,.:;]|$)/gi,
      /\bthis (?:weapon|item) (?:can only be used|only works) in\s+([^,.:;]+?)(?=[,.:;]|$)/gi,
    ],
  },
  {
    kind: "EQUIPMENT_DEPENDENT",
    detect: /\b(?:per piece of\b[^.]*\bworn|(?:while|when|if) wearing|for each\b[^.]*\b(?:armor|equipment)\b[^.]*\b(?:worn|equipped))\b/i,
    subjects: [
      /\bper piece of\s+(.+?)\s+worn\b/gi,
      /\b(?:while|when|if) wearing\s+(.+?)(?=[,.;:]|$)/gi,
      /\bfor each\s+(.+?\b(?:armor|equipment)\b.*?)\s+(?:worn|equipped)\b/gi,
    ],
  },
];

export function analyzeWeaponSpecialization(item: ItemDefinition): WeaponSpecializationEvidence {
  const restrictions: WeaponRestriction[] = [];
  for (const evidence of getLoreSegments(item)) {
    for (const rule of RULES) {
      if (!rule.detect.test(evidence.replace(/(\d)\.(?=\d)/g, "$1"))) continue;
      const subjects = new Map<string | null, "EFFECT" | "WEAPON">();
      let genericTargetOnly = false;
      for (const pattern of rule.subjects) {
        for (const match of evidence.matchAll(pattern)) {
          const subject = match[1].replace(/[\uE000-\uF8FF]/g, "")
            .replace(/^the\s+the\s+/i, "The ").replace(/\s+/g, " ").trim();
          // An unpunctuated clause may swallow its effect. Preserve uncertainty.
          if (rule.kind === "TARGET_RESTRICTED" && /^(?:all |nearby )?(?:enemies|mobs|monsters|targets)(?: hit)?$/i.test(subject)) {
            genericTargetOnly = true;
            continue;
          }
          const recovered = subject && !/\b(?:gain|grants?|consume|deals?|increases?|reduces?|your|you)\b/i.test(subject) ? subject : null;
          const scope = /^this (?:weapon|item) (?:can only be used|only works) in\b/i.test(match[0]) ? "WEAPON" : "EFFECT";
          subjects.set(recovered, scope);
        }
      }
      if (!subjects.size && genericTargetOnly) continue;
      if (!subjects.size) subjects.set(null, "EFFECT");
      for (const [subject, scope] of subjects) {
        restrictions.push({
          kind: rule.kind, subject,
          scope,
          evidence: [evidence],
        });
      }
    }
  }
  return {
    restrictions,
    restricted: restrictions.length > 0,
    kinds: [...new Set(restrictions.map((entry) => entry.kind))],
    evidence: [...new Set(restrictions.flatMap((entry) => entry.evidence))],
  };
}
