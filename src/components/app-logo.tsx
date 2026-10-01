"use client";

import Image from "next/image";

interface AppLogoProps {
  size: number;
  className?: string;
  priority?: boolean;
}

export function AppLogo({ size, className, priority }: AppLogoProps) {
  return <Image src="/logo-transparent.png" alt="Budget Whisperer" width={size} height={size} className={className} priority={priority} />;
}
