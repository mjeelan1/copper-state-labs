"use client";

import { ArrowUpIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

// A round "Back to top" button in the bottom-right corner, shown once the hero
// (#top) has scrolled out of view. Without IntersectionObserver (as in tests)
// it never shows.
export function BackToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const hero = document.querySelector("#top");
    if (!hero || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(([entry]) =>
      setVisible(!entry.isIntersecting),
    );
    observer.observe(hero);
    return () => observer.disconnect();
  }, []);

  if (!visible) return null;
  return (
    <Button
      asChild
      variant="outline"
      size="icon"
      className="bg-background dark:bg-background focus-visible:ring-ring fixed right-4 bottom-4 z-40 size-11 rounded-full shadow-lg"
    >
      <a href="#top" aria-label="Back to top">
        <ArrowUpIcon aria-hidden className="size-5" />
      </a>
    </Button>
  );
}
