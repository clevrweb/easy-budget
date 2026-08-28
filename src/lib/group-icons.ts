import {
  Home,
  Zap,
  Droplet,
  Wifi,
  Car,
  UtensilsCrossed,
  ShoppingCart,
  Heart,
  Gift,
  Briefcase,
  Smartphone,
  Tv,
  GraduationCap,
  PawPrint,
  Plane,
  CreditCard,
  Wallet,
  Music,
  type LucideIcon,
} from "lucide-react";

export const GROUP_ICONS: Record<string, LucideIcon> = {
  home: Home,
  zap: Zap,
  droplet: Droplet,
  wifi: Wifi,
  car: Car,
  utensils: UtensilsCrossed,
  cart: ShoppingCart,
  heart: Heart,
  gift: Gift,
  briefcase: Briefcase,
  phone: Smartphone,
  tv: Tv,
  education: GraduationCap,
  pet: PawPrint,
  travel: Plane,
  creditCard: CreditCard,
  wallet: Wallet,
  music: Music,
};

export type GroupIconKey = keyof typeof GROUP_ICONS;

export function getGroupIcon(key: string | null | undefined): LucideIcon | null {
  if (!key) return null;
  return GROUP_ICONS[key] ?? null;
}
