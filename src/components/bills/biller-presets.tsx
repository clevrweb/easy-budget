// Clearbit's logo/autocomplete APIs are dead (logo.clearbit.com no longer
// resolves; autocomplete.clearbit.com returns null logos for every query).
// unavatar.io is a free drop-in replacement: it proxies favicons/logos from
// several sources and, with fallback=false, 404s cleanly when nothing is
// found so the letter-avatar fallback in bill-row.tsx still works.
function logoUrlForDomain(domain: string): string {
  return `https://unavatar.io/${domain}?fallback=false`;
}

function guessDomain(name: string): string {
  return `${name.toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]/g, "")}.com`;
}

async function logoUrlIfExists(domain: string): Promise<string | null> {
  const url = logoUrlForDomain(domain);
  try {
    const res = await fetch(url, { method: "HEAD" });
    return res.ok ? url : null;
  } catch {
    return null;
  }
}

export async function fetchBillerLogo(name: string): Promise<string | null> {
  const domain = guessDomain(name);
  if (domain === ".com") return null;
  return logoUrlIfExists(domain);
}
