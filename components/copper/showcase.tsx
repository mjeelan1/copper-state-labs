import Image from "next/image";
import { getProducts } from "@/lib/copper/catalog";
import { cn } from "@/lib/utils";

type Photo = { alt: string; caption: string; width: number; height: number };

// The catalog lists each product's lifestyle photos; what each one shows, its
// caption and its size live here, keyed by its path.
const PHOTOS: Record<string, Photo> = {
  "/assets/lifestyle/copper-home-desert-light.png": {
    alt: "Copper Home smart speaker on a stone kitchen counter, with saguaros and desert mountains through the window at sunset",
    caption:
      "Copper Home keeps an eye on the Arizona weather, right on the kitchen counter.",
    width: 1672,
    height: 941,
  },
  "/assets/lifestyle/copper-notes-stone-desk.png": {
    alt: "Copper Notes recorder in Brushed Copper standing beside its round charging puck on a stone counter",
    caption:
      "Between meetings, Copper Notes rests on its copper charging puck.",
    width: 1672,
    height: 941,
  },
  "/assets/lifestyle/copper-notes-golden-hour.png": {
    alt: "A person writing in a notebook at a café table, with Copper Notes clipped to their shirt pocket and its amber ring lit",
    caption:
      "Clipped to a pocket, Copper Notes glows amber while it records, so everyone nearby knows.",
    width: 1536,
    height: 1024,
  },
};

// Every catalog lifestyle photo with a one-line caption, in alternating
// image/text rows; stacked on phones.
export function Showcase() {
  const photos = getProducts().flatMap((product) =>
    product.lifestyle.map((src) => ({
      src,
      product: product.name,
      ...(PHOTOS[src] ?? {
        alt: `${product.name} ${product.type} in use`,
        caption: `${product.name}, at home in Arizona.`,
        width: 1536,
        height: 1024,
      }),
    })),
  );

  return (
    <section
      data-testid="showcase"
      id="showcase"
      className="bg-secondary py-16 md:py-24"
    >
      <div className="mx-auto max-w-5xl px-4">
        <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
          At home in Arizona
        </h2>
        <div className="mt-10 flex flex-col gap-12 md:gap-16">
          {photos.map((photo, index) => (
            <figure
              key={photo.src}
              className="grid items-center gap-6 md:grid-cols-5 md:gap-10"
            >
              <Image
                src={photo.src}
                alt={photo.alt}
                width={photo.width}
                height={photo.height}
                sizes="(min-width: 1024px) 600px, (min-width: 768px) 60vw, 100vw"
                className={cn(
                  "h-auto w-full rounded-xl md:col-span-3",
                  index % 2 === 1 && "md:order-last",
                )}
              />
              <figcaption className="md:col-span-2">
                <p className="text-muted-foreground text-sm font-medium tracking-wide uppercase">
                  {photo.product}
                </p>
                <p className="font-heading mt-2 text-xl md:text-2xl">
                  {photo.caption}
                </p>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
