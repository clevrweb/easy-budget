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
