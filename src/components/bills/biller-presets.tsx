"use client";

import { useState } from "react";

const AVATAR_COLORS = [
  "#4f46e5", "#7c3aed", "#db2777", "#dc2626",
  "#ea580c", "#d97706", "#16a34a", "#0891b2",
  "#0284c7", "#6d28d9", "#be185d", "#0f766e",
];

function avatarColor(name: string) {
  return AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length];
}

interface Biller {
  name: string;
  domain: string;
}

const CATEGORIES: { label: string; billers: Biller[] }[] = [
  {
    label: "Streaming",
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
    label: "Finance",
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
    label: "Utilities",
    billers: [
      { name: "AT&T",    domain: "att.com" },
      { name: "Verizon", domain: "verizon.com" },
      { name: "T-Mobile", domain: "t-mobile.com" },
      { name: "Comcast",  domain: "comcast.com" },
    ],
  },
  {
    label: "Other",
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
  const logoUrl = `https://www.google.com/s2/favicons?domain=${biller.domain}&sz=128`;
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
        style={{ backgroundColor: imgFailed ? color : "transparent" }}
      >
        {imgFailed ? (
          biller.name[0].toUpperCase()
        ) : (
          <img
            src={logoUrl}
            alt={biller.name}
            className="w-10 h-10 object-contain rounded-xl"
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

interface BillerPresetsProps {
  selectedName: string;
  onSelect: (name: string, logoUrl: string | null) => void;
}

export function BillerPresets({ selectedName, onSelect }: BillerPresetsProps) {
  const [activeTab, setActiveTab] = useState(0);
  const current = CATEGORIES[activeTab];

  function handleSelect(biller: Biller) {
    const logoUrl = `https://www.google.com/s2/favicons?domain=${biller.domain}&sz=128`;
    onSelect(biller.name, logoUrl);
  }

  return (
    <div className="space-y-2">
      {/* Category tabs */}
      <div className="flex gap-1 overflow-x-auto [&::-webkit-scrollbar]:hidden" style={{ scrollbarWidth: "none" }}>
        {CATEGORIES.map((cat, i) => (
          <button
            key={cat.label}
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
            {cat.label}
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
