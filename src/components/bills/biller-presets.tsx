// Clearbit's logo/autocomplete APIs are dead (logo.clearbit.com no longer
// resolves; autocomplete.clearbit.com returns null logos for every query).
// unavatar.io is a free replacement: with fallback=false it 404s cleanly
// (no image body) when nothing is found, so the <img onError> handler in
// bill-row.tsx correctly falls back to the letter avatar.
//
// This used to also pre-validate the guess with a fetch({method:"HEAD"})
// before saving it, but that was actively harmful: unavatar has no CORS
// headers for many of its upstream sources and its free tier hard
// rate-limits (HTTP 429) after ~25 requests, so the pre-check was silently
// failing on effectively every real bill, leaving logo_url stuck at null
// even for well-known billers whose logo genuinely exists. Skipping the
// pre-check and letting the real <img> element validate the guess (exactly
// like the preset chips already do) fixes this: a bad guess still falls
// back to the letter cleanly, a good guess just shows the logo.
function logoUrlForDomain(domain: string): string {
  return `https://unavatar.io/${domain}?fallback=false`;
}

function guessDomain(name: string): string {
  return `${name.toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]/g, "")}.com`;
}

export function fetchBillerLogo(name: string): string | null {
  const domain = guessDomain(name);
  if (domain === ".com") return null;
  return logoUrlForDomain(domain);
}
