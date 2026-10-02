import { redirect } from "next/navigation";

export default function OldCalculatorRedirect() {
  redirect("/calculators/stock");
}
