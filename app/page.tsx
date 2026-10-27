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
      <SiteHeader />
      <main className="flex-1">
        <Hero />
        <Products />
        <Showcase />
        <PlusPricing />
        <Privacy />
      </main>
      <SiteFooter />
    </>
  );
}
