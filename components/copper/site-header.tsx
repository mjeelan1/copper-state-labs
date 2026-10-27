import Link from "next/link";
import { Logo } from "@/components/copper/logo";
import { ModeToggle } from "@/components/copper/mode-toggle";

// In-page jumps to the landing page sections.
const NAV_LINKS = [
  { href: "#products", label: "Products" },
  { href: "#plus", label: "Copper Plus" },
  { href: "#privacy", label: "Privacy" },
];

// Sticky and slim. On phones the links drop to a second row under the logo.
export function SiteHeader() {
  return (
    <header
      data-testid="site-header"
      className="bg-background/95 sticky top-0 z-50 border-b backdrop-blur"
    >
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-x-6 px-4 py-3">
        <Link href="/" aria-label="Copper State Labs home">
          <Logo className="w-32 md:w-44" />
        </Link>
        <nav
          aria-label="Main"
          className="order-last flex w-full justify-center gap-6 pt-2 md:order-none md:ml-auto md:w-auto md:pt-0"
        >
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-muted-foreground hover:text-foreground focus-visible:ring-ring/50 rounded-sm text-sm font-medium transition-colors outline-none focus-visible:ring-3"
            >
              {link.label}
            </a>
          ))}
        </nav>
        <ModeToggle />
      </div>
    </header>
  );
}
