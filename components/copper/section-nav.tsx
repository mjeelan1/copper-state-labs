"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

// In-page jumps to the landing page sections.
const NAV_LINKS = [
  { href: "#products", label: "Products" },
  { href: "#plus", label: "Copper Plus" },
  { href: "#privacy", label: "Privacy" },
];

// The header links. The link for the section crossing the middle of the screen
// is marked current, with a Copper underline. Without IntersectionObserver (as
// in tests) no link is marked.
export function SectionNav({ className }: { className?: string }) {
  const [current, setCurrent] = useState<string | null>(null);

  useEffect(() => {
    if (typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const href = `#${entry.target.id}`;
          if (entry.isIntersecting) setCurrent(href);
          else setCurrent((active) => (active === href ? null : active));
        }
      },
      // A thin band across the middle of the screen.
      { rootMargin: "-45% 0px -50% 0px" },
    );
    for (const { href } of NAV_LINKS) {
      const section = document.querySelector(href);
      if (section) observer.observe(section);
    }
    return () => observer.disconnect();
  }, []);

  return (
    <nav aria-label="Main" className={className}>
      {NAV_LINKS.map((link) => (
        <a
          key={link.href}
          href={link.href}
          aria-current={current === link.href ? "true" : undefined}
          className={cn(
            "text-muted-foreground hover:text-foreground focus-visible:ring-ring decoration-primary inline-flex h-11 items-center rounded-sm px-2 text-sm font-medium decoration-2 underline-offset-8 transition-colors outline-none focus-visible:ring-3",
            current === link.href && "text-foreground underline",
          )}
        >
          {link.label}
        </a>
      ))}
    </nav>
  );
}
