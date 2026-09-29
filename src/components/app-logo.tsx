"use client";

import Image from "next/image";
import { useTheme } from "next-themes";

interface AppLogoProps {
  size: number;
  className?: string;
  priority?: boolean;
}

export function AppLogo({ size, className, priority }: AppLogoProps) {
  const { resolvedTheme } = useTheme();
  const src = resolvedTheme === "dark" ? "/logo-dark.png" : "/logo.png";
  return <Image src={src} alt="Budget Whisperer" width={size} height={size} className={className} priority={priority} />;
}
