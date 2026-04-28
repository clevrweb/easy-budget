"use client";

import { createContext, useContext } from "react";
import { getDict } from "@/lib/i18n";
import type { Dict } from "@/lib/i18n";

const DictContext = createContext<Dict>(getDict("en"));

export function LanguageProvider({ lang, children }: { lang: string; children: React.ReactNode }) {
  return <DictContext.Provider value={getDict(lang)}>{children}</DictContext.Provider>;
}

export function useDict() {
  return useContext(DictContext);
}
