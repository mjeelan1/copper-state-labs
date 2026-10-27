import { BackToTop } from "@/components/copper/back-to-top";
import { Hero } from "@/components/copper/hero";
import { PlusPricing } from "@/components/copper/plus-pricing";
import { Privacy } from "@/components/copper/privacy";
import { Products } from "@/components/copper/products";
import { Showcase } from "@/components/copper/showcase";
import { SiteFooter } from "@/components/copper/site-footer";
import { SiteHeader } from "@/components/copper/site-header";

export default function Home() {
  return (
    <>
      {/* Hidden until a keyboard user tabs to it. */}
      <a
        href="#main"
        className="bg-background text-foreground focus-visible:ring-ring sr-only rounded-md font-medium outline-none focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-60 focus:px-4 focus:py-3 focus-visible:ring-3"
      >
        Skip to content
      </a>
      <SiteHeader />
      <main id="main" tabIndex={-1} className="flex-1 outline-none">
        <Hero />
        <Products />
        <Showcase />
        <PlusPricing />
        <Privacy />
      </main>
      <SiteFooter />
      <BackToTop />
    </>
  );
}
