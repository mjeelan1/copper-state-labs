import Link from "next/link";
import { Logo } from "@/components/copper/logo";
import { ModeToggle } from "@/components/copper/mode-toggle";
import { SectionNav } from "@/components/copper/section-nav";

// Sticky and slim. On phones the links drop to a second row under the logo.
// Every link and button is at least 44px tall, so it's easy to tap.
export function SiteHeader() {
  return (
    <header
      data-testid="site-header"
      className="bg-background/95 sticky top-0 z-50 border-b backdrop-blur"
    >
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-x-6 px-4 md:py-2">
        <Link
          href="/"
          aria-label="Copper State Labs home"
          className="focus-visible:ring-ring inline-flex h-11 items-center rounded-sm outline-none focus-visible:ring-3"
        >
          <Logo className="w-32 md:w-44" />
        </Link>
        <SectionNav className="order-last flex w-full justify-center gap-2 md:order-none md:ml-auto md:w-auto" />
        <ModeToggle />
      </div>
    </header>
  );
}
