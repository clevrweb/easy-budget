import { cookies } from "next/headers";
import { getDict } from "./index";

export async function getServerDict() {
  const store = await cookies();
  return getDict(store.get("lang")?.value ?? "en");
}
