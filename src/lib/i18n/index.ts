import { cookies } from "next/headers";
import { en } from "./en";
import { es } from "./es";
export type { Dict } from "./types";

export function getDict(lang: string) {
  return lang === "es" ? es : en;
}

export async function getServerDict() {
  const store = await cookies();
  return getDict(store.get("lang")?.value ?? "en");
}
