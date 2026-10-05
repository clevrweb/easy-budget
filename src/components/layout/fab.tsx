import { forwardRef } from "react";
import Link from "next/link";

const fabClassName = "h-14 w-14 rounded-full bg-[#eec553] text-[#0d3b66] border-2 border-[#0d3b66] shadow-xl flex items-center justify-center active:scale-95 transition-transform";

interface FabTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon: React.ReactNode;
  label: string;
}

/**
 * Round FAB-styled button, meant to be passed as a form's `trigger` prop.
 * Forwards ref and spreads extra props so Radix's `DialogTrigger asChild`
 * can attach its onClick/aria/ref -- without this, Slot's merged props
 * land on this component but are silently dropped, leaving the dialog's
 * trigger non-functional.
 */
export const FabTrigger = forwardRef<HTMLButtonElement, FabTriggerProps>(
  ({ icon, label, className, ...props }, ref) => {
    return (
      <button
        ref={ref}
        type="button"
        aria-label={label}
        className={className ?? fabClassName}
        {...props}
      >
        {icon}
      </button>
    );
  }
);
FabTrigger.displayName = "FabTrigger";

interface FabLinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  icon: React.ReactNode;
  label: string;
  href: string;
}

/** Round FAB-styled link, for FABs that navigate to a page instead of opening a dialog. */
export const FabLink = forwardRef<HTMLAnchorElement, FabLinkProps>(
  ({ href, icon, label, className, ...props }, ref) => {
    return (
      <Link
        ref={ref}
        href={href}
        aria-label={label}
        className={className ?? fabClassName}
        {...props}
      >
        {icon}
      </Link>
    );
  }
);
FabLink.displayName = "FabLink";

/** Fixed bottom-right position for a mobile-only FAB, clear of the bottom nav. */
export function MobileFab({ children }: { children: React.ReactNode }) {
  return <div className="fixed bottom-20 right-4 z-30 md:hidden">{children}</div>;
}
