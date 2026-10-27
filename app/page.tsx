import { Hero } from "@/components/copper/landing/hero";
import { PlusPricing } from "@/components/copper/landing/plus-pricing";
import { PrivacySummary } from "@/components/copper/landing/privacy-summary";
import { ProductsSection } from "@/components/copper/landing/products-section";
import { Showcase } from "@/components/copper/landing/showcase";
import { SiteFooter } from "@/components/copper/site-footer";
import { SiteHeader } from "@/components/copper/site-header";
import { getPlans, getPrivacySummary, getProducts } from "@/lib/copper/catalog";

export default function Home() {
  const products = getProducts();
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
        <Hero products={products} />
        <ProductsSection products={products} />
        <Showcase products={products} />
        <PlusPricing plans={getPlans()} />
        <PrivacySummary privacy={getPrivacySummary()} />
      </main>
      <SiteFooter />
    </>
  );
}
