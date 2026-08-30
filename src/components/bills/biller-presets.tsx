"use client";

import { useState, useRef, useEffect } from "react";
import { X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useDict } from "@/components/language-provider";
import type { Dict } from "@/lib/i18n/types";

const AVATAR_COLORS = [
  "#4f46e5", "#7c3aed", "#db2777", "#dc2626",
  "#ea580c", "#d97706", "#16a34a", "#0891b2",
  "#0284c7", "#6d28d9", "#be185d", "#0f766e",
];

function avatarColor(name: string) {
  return AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length];
}

// Clearbit's logo/autocomplete APIs are dead (logo.clearbit.com no longer
// resolves; autocomplete.clearbit.com returns null logos for every query).
// unavatar.io is a free drop-in replacement: it proxies favicons/logos from
// several sources and, with fallback=false, 404s cleanly when nothing is
// found so the existing <img onError> letter-avatar fallback still works.
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

interface Biller {
  name: string;
  domain: string;
}

type BillerCategoryKey = "streaming" | "finance" | "utilities" | "other";

function billerCategoryLabel(t: Dict["bills"], key: BillerCategoryKey): string {
  return {
    streaming: t.billerCategoryStreaming,
    finance: t.billerCategoryFinance,
    utilities: t.billerCategoryUtilities,
    other: t.billerCategoryOther,
  }[key];
}

const CATEGORIES: { key: BillerCategoryKey; billers: Biller[] }[] = [
  {
    key: "streaming",
    billers: [
      { name: "Netflix",         domain: "netflix.com" },
      { name: "Spotify",         domain: "spotify.com" },
      { name: "Hulu",            domain: "hulu.com" },
      { name: "Disney+",         domain: "disneyplus.com" },
      { name: "Apple TV+",       domain: "apple.com" },
      { name: "HBO Max",         domain: "hbo.com" },
      { name: "YouTube Premium", domain: "youtube.com" },
      { name: "Amazon Prime",    domain: "amazon.com" },
      { name: "Peacock",         domain: "peacocktv.com" },
      { name: "Paramount+",      domain: "paramountplus.com" },
    ],
  },
  {
    key: "finance",
    billers: [
      { name: "American Express", domain: "americanexpress.com" },
      { name: "Chase",            domain: "chase.com" },
      { name: "Visa",             domain: "visa.com" },
      { name: "Capital One",      domain: "capitalone.com" },
      { name: "Wells Fargo",      domain: "wellsfargo.com" },
      { name: "PayPal",           domain: "paypal.com" },
    ],
  },
  {
    key: "utilities",
    billers: [
      { name: "AT&T",    domain: "att.com" },
      { name: "Verizon", domain: "verizon.com" },
      { name: "T-Mobile", domain: "t-mobile.com" },
      { name: "Comcast",  domain: "comcast.com" },
    ],
  },
  {
    key: "other",
    billers: [
      { name: "Adobe",         domain: "adobe.com" },
      { name: "Microsoft 365", domain: "microsoft.com" },
      { name: "Google One",    domain: "google.com" },
      { name: "iCloud",        domain: "apple.com" },
      { name: "Dropbox",       domain: "dropbox.com" },
    ],
  },
];

interface BillerChipProps {
  biller: Biller;
  selected: boolean;
  onSelect: () => void;
}

function BillerChip({ biller, selected, onSelect }: BillerChipProps) {
  const logoUrl = logoUrlForDomain(biller.domain);
  const color   = avatarColor(biller.name);
  const [imgFailed, setImgFailed] = useState(false);

  return (
    <button
      type="button"
      onClick={onSelect}
      className="flex flex-col items-center gap-1 p-1.5 rounded-xl transition-all shrink-0"
      style={{
        width: 68,
        outline: selected ? `2px solid var(--color-primary)` : "2px solid transparent",
        backgroundColor: selected ? "color-mix(in srgb, var(--color-primary) 10%, transparent)" : "transparent",
      }}
    >
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm overflow-hidden"
        style={{ backgroundColor: imgFailed ? color : "var(--color-muted)" }}
      >
        {imgFailed ? (
          biller.name[0].toUpperCase()
        ) : (
          <img
            src={logoUrl}
            alt={biller.name}
            className="w-10 h-10 object-contain rounded-xl p-1"
            onError={() => setImgFailed(true)}
          />
        )}
      </div>
      <span
        className="text-[10px] text-center leading-tight font-medium w-full truncate"
        style={{ color: selected ? "var(--color-primary)" : "var(--color-muted-foreground)" }}
      >
        {biller.name}
      </span>
    </button>
  );
}

export async function fetchBillerLogo(name: string): Promise<string | null> {
  const domain = guessDomain(name);
  if (domain === ".com") return null;
  return logoUrlIfExists(domain);
}

interface BillerPresetsProps {
  selectedName: string;
  onSelect: (name: string, logoUrl: string | null) => void;
}

export function BillerPresets({ selectedName, onSelect }: BillerPresetsProps) {
  const dict = useDict();
  const [activeTab, setActiveTab] = useState(0);
  const current = CATEGORIES[activeTab];

  function handleSelect(biller: Biller) {
    onSelect(biller.name, logoUrlForDomain(biller.domain));
  }

  return (
    <div className="space-y-2">
      {/* Category tabs */}
      <div className="flex gap-1 overflow-x-auto [&::-webkit-scrollbar]:hidden" style={{ scrollbarWidth: "none" }}>
        {CATEGORIES.map((cat, i) => (
          <button
            key={cat.key}
            type="button"
            onClick={() => setActiveTab(i)}
            className="px-2.5 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-colors shrink-0"
            style={{
              backgroundColor: activeTab === i
                ? "color-mix(in srgb, var(--color-primary) 15%, transparent)"
                : "var(--color-muted)",
              color: activeTab === i ? "var(--color-primary)" : "var(--color-muted-foreground)",
            }}
          >
            {billerCategoryLabel(dict.bills, cat.key)}
          </button>
        ))}
      </div>

      {/* Chips row */}
      <div
        className="flex gap-1 overflow-x-auto pb-1 [&::-webkit-scrollbar]:hidden"
        style={{ scrollbarWidth: "none" }}
      >
        {current.billers.map((biller) => (
          <BillerChip
            key={biller.name}
            biller={biller}
            selected={selectedName === biller.name}
            onSelect={() => handleSelect(biller)}
          />
        ))}
      </div>
    </div>
  );
}

// ── Standalone company logo search field ─────────────────────────────────────

interface SearchResult {
  name: string;
  logo: string;
}

interface CompanyLogoSearchProps {
  logoUrl: string | null;
  onSelect: (logoUrl: string | null) => void;
}

export function CompanyLogoSearch({ logoUrl, onSelect }: CompanyLogoSearchProps) {
  const dict = useDict();
  const [query, setQuery]         = useState("");
  const [results, setResults]     = useState<SearchResult[]>([]);
  const [showDrop, setShowDrop]   = useState(false);
  const containerRef              = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (query.length < 2) { setResults([]); setShowDrop(false); return; }
    const timer = setTimeout(async () => {
      const domain = guessDomain(query);
      const url = domain === ".com" ? null : await logoUrlIfExists(domain);
      if (url) {
        setResults([{ name: query, logo: url }]);
        setShowDrop(true);
      } else {
        setResults([]);
        setShowDrop(false);
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowDrop(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  function handlePick(r: SearchResult) {
    setQuery("");
    setResults([]);
    setShowDrop(false);
    onSelect(r.logo);
  }

  return (
    <div ref={containerRef} className="relative flex items-center gap-2">
      <div className="relative flex-1">
        <Input
          placeholder={dict.bills.searchCompanyPlaceholder}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Escape") { setShowDrop(false); setQuery(""); } }}
        />

        {showDrop && results.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-[var(--color-card)] border border-[var(--color-border)] rounded-xl shadow-xl z-[100] overflow-hidden">
            {results.map((r) => (
              <button
                key={r.name}
                type="button"
                onMouseDown={(e) => { e.preventDefault(); handlePick(r); }}
                className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-[var(--color-muted)] transition-colors text-left"
              >
                <div className="w-8 h-8 rounded-lg overflow-hidden shrink-0 bg-[var(--color-muted)] flex items-center justify-center">
                  <img
                    src={r.logo}
                    alt=""
                    className="w-8 h-8 object-contain p-0.5"
                    onError={(e) => {
                      const el = e.currentTarget;
                      const parent = el.parentElement as HTMLElement;
                      parent.style.backgroundColor = avatarColor(r.name);
                      const span = document.createElement("span");
                      span.className = "text-white font-bold text-sm";
                      span.textContent = r.name[0].toUpperCase();
                      el.replaceWith(span);
                    }}
                  />
                </div>
                <span className="text-sm font-medium text-[var(--color-foreground)] truncate">{r.name}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {logoUrl ? (
        <div className="relative shrink-0">
          <img
            src={logoUrl}
            alt=""
            className="w-10 h-10 object-contain rounded-xl border border-[var(--color-border)] bg-[var(--color-muted)] p-0.5"
          />
          <button
            type="button"
            onMouseDown={(e) => { e.preventDefault(); onSelect(null); }}
            className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[var(--color-muted-foreground)] flex items-center justify-center"
          >
            <X className="w-2.5 h-2.5 text-white" />
          </button>
        </div>
      ) : (
        <div className="w-10 h-10 rounded-xl border border-dashed border-[var(--color-border)] flex items-center justify-center shrink-0 text-[var(--color-muted-foreground)]">
          <span className="text-lg">🏢</span>
        </div>
      )}
    </div>
  );
}
