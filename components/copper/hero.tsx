import Image from "next/image";
import { Button } from "@/components/ui/button";
import { getProducts } from "@/lib/copper/catalog";

// The product cutouts are square PNGs on transparent backgrounds.
const CUTOUT_SIZE = 1254;

// Headline, tagline and "See products" on one side, the product cutouts on the
// other; stacked on phones. Desert Sand in light mode, Night Sky in dark mode.
export function Hero() {
  const products = getProducts();
  return (
    <section
      data-testid="hero"
      id="top"
      className="bg-secondary dark:bg-background"
    >
      <div className="mx-auto grid max-w-5xl items-center gap-10 px-4 py-16 md:grid-cols-2 md:py-24">
        <div className="flex flex-col items-start gap-6">
          <h1 className="text-4xl font-bold tracking-tight md:text-5xl">
            Smart AI devices, made for Arizona life
          </h1>
          <p className="text-muted-foreground text-xl">
            From raw ideas to refined answers.
          </p>
          <Button asChild size="lg" className="h-11 px-6 text-base">
            <a href="#products">See products</a>
          </Button>
        </div>
        <div className="grid grid-cols-2 items-end gap-4">
          {products.map((product) => (
            <Image
              key={product.id}
              src={product.cutout}
              alt={`${product.name} ${product.type} in ${product.colors[0]}`}
              width={CUTOUT_SIZE}
              height={CUTOUT_SIZE}
              loading="eager"
              sizes="(min-width: 768px) 240px, 45vw"
              className="h-auto w-full"
            />
          ))}
        </div>
      </div>
    </section>
  );
}
