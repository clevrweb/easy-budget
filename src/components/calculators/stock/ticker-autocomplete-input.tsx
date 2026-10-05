"use client";

import { useEffect, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { useDict } from "@/components/language-provider";
import type { SymbolMatch, SymbolSearchResponse } from "@/app/api/calculator/symbol-search/route";

interface TickerAutocompleteInputProps {
  id: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  /** When provided, renders a "Load" button next to the field (project-mode style). */
  onLoad?: () => void;
  loadStatus?: "idle" | "loading" | "error" | "success";
}

/** Ticker input with a debounced symbol-search dropdown, shared by the Calculators pages and the embedded bucket stock fields. */
export function TickerAutocompleteInput({ id, value, onChange, placeholder, disabled, required, onLoad, loadStatus }: TickerAutocompleteInputProps) {
  const dict = useDict();
  const t = dict.calculator;

  const [suggestions, setSuggestions] = useState<SymbolMatch[]>([]);
  const [suggestionsOpen, setSuggestionsOpen] = useState(false);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  // Skips the very first run -- otherwise every mount fires a search for
  // whatever ticker is pre-filled (e.g. "SPY") before the user has typed
  // anything, wasting a call against Alpha Vantage's scarce free-tier quota.
  const touchedRef = useRef(false);

  useEffect(() => {
    if (!touchedRef.current) {
      touchedRef.current = true;
      return;
    }
    if (!value.trim()) {
      setSuggestions([]);
      return;
    }
    const timer = setTimeout(async () => {
      setSuggestionsLoading(true);
      try {
        const res = await fetch(`/api/calculator/symbol-search?q=${encodeURIComponent(value.trim())}`);
        if (res.ok) {
          const json = (await res.json()) as SymbolSearchResponse;
          setSuggestions(json.matches);
          setSuggestionsOpen(true);
        }
      } catch {
        // Silently ignore -- autocomplete is a convenience, not required for the form to work.
      } finally {
        setSuggestionsLoading(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [value]);

  useEffect(() => {
    if (!suggestionsOpen) return;
    function handler(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setSuggestionsOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [suggestionsOpen]);

  function selectSuggestion(symbol: string) {
    onChange(symbol);
    setSuggestionsOpen(false);
  }

  return (
    <div className="relative" ref={wrapRef}>
      <div className="flex gap-2">
        <Input
          id={id}
          className={onLoad ? "flex-1" : undefined}
          value={value}
          onChange={(e) => onChange(e.target.value.toUpperCase())}
          onFocus={() => suggestions.length > 0 && setSuggestionsOpen(true)}
          placeholder={placeholder}
          autoComplete="off"
          disabled={disabled}
          required={required}
        />
        {onLoad && (
          <Button type="button" onClick={onLoad} disabled={loadStatus === "loading" || !value.trim()}>
            <Download className="w-4 h-4" />
            {loadStatus === "loading" ? t.loadingButton : t.loadButton}
          </Button>
        )}
      </div>

      {suggestionsOpen && value.trim() && (
        <div className="absolute z-20 left-0 right-0 mt-1 bg-[var(--color-card)] border border-[var(--color-border)] rounded-lg shadow-[var(--shadow-card)] max-h-60 overflow-y-auto">
          {suggestionsLoading ? (
            <p className="px-3 py-2 text-xs text-[var(--color-muted-foreground)]">{t.loadingButton}</p>
          ) : suggestions.length === 0 ? (
            <p className="px-3 py-2 text-xs text-[var(--color-muted-foreground)]">{t.noMatches}</p>
          ) : (
            suggestions.map((m) => (
              <button
                key={m.symbol}
                type="button"
                onClick={() => selectSuggestion(m.symbol)}
                className="w-full text-left px-3 py-2 hover:bg-[var(--color-muted)] transition-colors"
              >
                <span className="text-sm font-semibold text-[var(--color-foreground)]">{m.symbol}</span>
                <span className="text-xs text-[var(--color-muted-foreground)] ml-2">{m.name}</span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
