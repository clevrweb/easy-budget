"use client";

import { useEffect, useState } from "react";

// Logo lookup history, in order of what was tried and why it was dropped:
// - Clearbit's logo/autocomplete APIs are dead (logo.clearbit.com no longer
//   resolves; autocomplete.clearbit.com returns null logos for every query).
// - unavatar.io has correct "not found" semantics (a real 404 with
//   fallback=false, so <img onError> fires cleanly), but its free tier is
//   capped at 25 requests total with a ~16 HOUR lockout once exhausted
//   (confirmed via its own Retry-After header) -- unusable for a real app,
//   since a single user adding a handful of billers exhausts it immediately.
// - DuckDuckGo's icon service has no such cap, but always returns a valid
//   image (a generic default) even for made-up domains, so there is no
//   signal to detect "not found" and fall back to the letter avatar.
//
// Google's favicon service is the current choice: no known rate limit (it's
// the same public endpoint used by countless browser extensions/bookmark
// managers), and no CORS needed since it's only ever used as <img src>. Like
// DuckDuckGo, it never errors -- unknown domains get a small generic default
// icon rather than a 404. Tried detecting that case by size (the generic
// icon is always 16x16), but real favicons for several major companies
// (Verizon, Comcast, Allstate, Discover) are ALSO only 16x16, so that would
// hide real logos as often as it hides missing ones -- not worth doing.
// Net effect: well-known billers get their real logo; obscure/local ones
// may show a small generic icon instead of cleanly falling back to the
// letter avatar. That's a real trade-off, but far better than the
// unavatar.io lockout this replaced.
function logoUrlForDomain(domain: string): string {
  return `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;
}

function guessDomain(name: string): string {
  return `${name.toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]/g, "")}.com`;
}

export function fetchBillerLogo(name: string): string | null {
  const domain = guessDomain(name);
  if (domain === ".com") return null;
  return logoUrlForDomain(domain);
}

const AVATAR_COLORS = [
  "#4f46e5", "#7c3aed", "#db2777", "#dc2626",
  "#ea580c", "#d97706", "#16a34a", "#0891b2",
  "#0284c7", "#6d28d9", "#be185d", "#0f766e",
];

function avatarColor(name: string) {
  return AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length];
}

interface BillerLogoPreviewProps {
  logoUrl: string | null;
  fallbackName: string;
}

// Live preview shown next to the Biller field as the user types, so they see
// the logo (or letter fallback) before saving, matching what bill-row.tsx
// will render afterward.
export function BillerLogoPreview({ logoUrl, fallbackName }: BillerLogoPreviewProps) {
  const [imgFailed, setImgFailed] = useState(false);

  useEffect(() => { setImgFailed(false); }, [logoUrl]);

  if (!fallbackName) return null;

  const letter = fallbackName[0].toUpperCase();
  const color = avatarColor(fallbackName);
  const showImg = logoUrl && !imgFailed;

  return (
    <div
      className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0 overflow-hidden select-none"
      style={{ backgroundColor: showImg ? "transparent" : color }}
    >
      {showImg ? (
        <img
          src={logoUrl}
          alt=""
          className="w-10 h-10 object-contain rounded-full"
          onError={() => setImgFailed(true)}
        />
      ) : (
        letter
      )}
    </div>
  );
}
