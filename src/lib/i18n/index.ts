import { en } from "./en";
import { es } from "./es";
export type { Dict } from "./types";

export function getDict(lang: string) {
  return lang === "es" ? es : en;
}
