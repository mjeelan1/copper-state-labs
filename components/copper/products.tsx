import Image from "next/image";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { NextStep } from "@/components/copper/next-step";
import { formatUsd, getProducts } from "@/lib/copper/catalog";

// The product cutouts are square PNGs on transparent backgrounds.
const CUTOUT_SIZE = 1254;

// The catalog names each finish; these are the brand colors behind them.
// A finish not listed here gets a neutral swatch.
const SWATCHES: Record<string, string> = {
  "Polished Copper": "#B87333",
  "Brushed Copper": "#B87333",
  "Patina Teal": "#4A8C82",
  "Desert Sand": "#EFE3D0",
  "Night Sky": "#1C2333",
};

// Who each product is for (Product Bible, section 3). A product not listed here
// gets no "Best for" line.
const BEST_FOR: Record<string, string> = {
  "copper-home": "Households, families, retirees and snowbirds",
  "copper-notes": "Students, professionals and anyone in lots of meetings",
};

// One card per catalog product: cutout, color swatches, name, price, who it's
// best for and features, then a link on to the plans.
export function Products() {
  const products = getProducts();
  return (
    <section data-testid="products" id="products" className="py-16 md:py-24">
      <div className="mx-auto max-w-5xl px-4">
        <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
          Meet the devices
        </h2>
        <p className="text-muted-foreground mt-3 text-lg">
          One for your home, one for your day.
        </p>
        <div className="mt-10 grid gap-6 md:grid-cols-2">
          {products.map((product) => (
            <Card
              key={product.id}
              data-testid="product-card"
              data-product={product.id}
              className="pt-0"
            >
              <div className="bg-secondary flex justify-center px-6 pt-8 pb-4">
                <Image
                  src={product.cutout}
                  alt={`${product.name} ${product.type} in ${product.colors[0]}`}
                  width={CUTOUT_SIZE}
                  height={CUTOUT_SIZE}
                  sizes="(min-width: 768px) 256px, 192px"
                  className="h-auto w-full max-w-48 md:max-w-64"
                />
              </div>
              <ul
                aria-label={`${product.name} colors`}
                className="flex flex-wrap gap-x-4 gap-y-2 px-(--card-spacing)"
              >
                {product.colors.map((color) => (
                  <li
                    key={color}
                    className="text-muted-foreground flex items-center gap-2 text-sm"
                  >
                    <span
                      aria-hidden
                      className="bg-muted ring-foreground/20 size-4 rounded-full ring-1"
                      style={{ backgroundColor: SWATCHES[color] }}
                    />
                    {color}
                  </li>
                ))}
              </ul>
              <CardHeader>
                <CardTitle>
                  <h3 className="text-xl font-bold">{product.name}</h3>
                </CardTitle>
                <CardDescription>{product.type}</CardDescription>
                <CardAction className="text-right">
                  <p className="text-2xl font-bold">
                    {formatUsd(product.priceUsd)}
                  </p>
                  <p className="text-muted-foreground text-sm">
                    One-time price
                  </p>
                </CardAction>
              </CardHeader>
              <CardContent>
                {BEST_FOR[product.id] && (
                  <p className="mb-4">
                    <span className="font-semibold">Best for:</span>{" "}
                    {BEST_FOR[product.id]}
                  </p>
                )}
                <ul className="flex flex-col gap-3">
                  {product.features.map((feature) => (
                    <li key={feature.name}>
                      <p className="font-medium">{feature.name}</p>
                      <p className="text-muted-foreground">
                        {feature.description}
                      </p>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>
        <NextStep
          text="Both work on the free plan. Copper Plus adds Refined answers and longer memory."
          href="#plus"
          label="Compare plans"
        />
      </div>
    </section>
  );
}
