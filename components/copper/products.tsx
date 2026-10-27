import Image from "next/image";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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

// One card per catalog product: cutout, color swatches, name, price, features.
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
                  sizes="256px"
                  className="h-auto w-full max-w-64"
                />
              </div>
              <ul
                aria-label={`${product.name} colors`}
                className="flex flex-wrap gap-x-4 gap-y-2 px-(--card-spacing)"
              >
                {product.colors.map((color) => (
                  <li
                    key={color}
                    className="text-muted-foreground flex items-center gap-2 text-xs"
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
                <CardAction className="text-2xl font-bold">
                  {formatUsd(product.priceUsd)}
                </CardAction>
              </CardHeader>
              <CardContent>
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
      </div>
    </section>
  );
}
