import Image from "next/image";
import { Button } from "@/components/ui/button";
import { formatUsd, getProducts } from "@/lib/copper/catalog";
import { cn } from "@/lib/utils";

// The product cutouts are square PNGs on transparent backgrounds.
const CUTOUT_SIZE = 1254;

// Headline, tagline, price hint and two buttons on one side; the product
// cutouts on the other, with the first product large and the second smaller in
// front of it. Stacked below 1024px, so the products stay bigger than the
// product-card photos. Desert Sand in light mode, Night Sky in dark.
export function Hero() {
  const products = getProducts();
  const lowestPrice = Math.min(...products.map((product) => product.priceUsd));
  return (
    <section
      data-testid="hero"
      id="top"
      className="bg-secondary dark:bg-background"
    >
      <div className="mx-auto grid max-w-5xl items-center gap-4 px-4 py-12 md:gap-8 md:py-16 lg:grid-cols-2 lg:gap-12 lg:py-28">
        <div className="flex flex-col items-start gap-6">
          <h1 className="text-4xl leading-tight font-bold tracking-tight text-balance md:text-5xl">
            <span className="block">Desert-smart help at home.</span>{" "}
            <span className="block">Notes that write themselves.</span>
          </h1>
          <p className="text-muted-foreground text-xl">
            From raw ideas to refined answers.
          </p>
          <p className="text-muted-foreground">
            <span className="text-foreground font-semibold">
              From {formatUsd(lowestPrice)}
            </span>
            . No subscription needed.
          </p>
          <div className="flex flex-wrap gap-3">
            {/* 20px bold counts as large text, which Night Sky on Copper
                (4.1:1) passes. */}
            <Button
              asChild
              size="lg"
              className="focus-visible:ring-ring h-12 px-6 text-xl font-bold"
            >
              <a href="#products">See products</a>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="focus-visible:ring-ring h-12 px-6 text-base"
            >
              <a href="#plus">Compare plans</a>
            </Button>
          </div>
        </div>
        <div className="relative mx-auto aspect-[6/5] w-full max-w-md lg:max-w-none">
          {products.map((product, index) => (
            <Image
              key={product.id}
              src={product.cutout}
              alt={`${product.name} ${product.type} in ${product.colors[0]}`}
              width={CUTOUT_SIZE}
              height={CUTOUT_SIZE}
              loading="eager"
              fetchPriority={index === 0 ? "high" : "auto"}
              sizes={
                index === 0
                  ? "(min-width: 640px) 350px, 70vw"
                  : "(min-width: 640px) 210px, 42vw"
              }
              className={cn(
                "absolute h-auto drop-shadow-2xl",
                index === 0
                  ? "top-0 left-0 w-[70%]"
                  : "right-0 bottom-0 w-[42%]",
              )}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
