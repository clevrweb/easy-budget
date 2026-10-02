import Link from "next/link";

interface FabTriggerProps {
  icon: React.ReactNode;
  label: string;
}

/** Round FAB-styled button, meant to be passed as a form's `trigger` prop. */
export function FabTrigger({ icon, label }: FabTriggerProps) {
  return (
    <button
      type="button"
      aria-label={label}
      className="h-14 w-14 rounded-full bg-[var(--color-primary)] text-white shadow-xl flex items-center justify-center active:scale-95 transition-transform"
    >
      {icon}
    </button>
  );
}

interface FabLinkProps extends FabTriggerProps {
  href: string;
}

/** Round FAB-styled link, for FABs that navigate to a page instead of opening a dialog. */
export function FabLink({ href, icon, label }: FabLinkProps) {
  return (
    <Link
      href={href}
      aria-label={label}
      className="h-14 w-14 rounded-full bg-[var(--color-primary)] text-white shadow-xl flex items-center justify-center active:scale-95 transition-transform"
    >
      {icon}
    </Link>
  );
}

/** Fixed bottom-right position for a mobile-only FAB, clear of the bottom nav. */
export function MobileFab({ children }: { children: React.ReactNode }) {
  return <div className="fixed bottom-20 right-4 z-30 md:hidden">{children}</div>;
}
