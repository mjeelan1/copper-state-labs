import { SiteFooter } from "@/components/copper/site-footer";
import { SiteHeader } from "@/components/copper/site-header";

export default function Home() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col items-center justify-center gap-6 px-4 py-16 text-center">
        <h1 className="text-4xl font-bold">Copper State Labs</h1>
        <p className="text-muted-foreground text-lg">
          Our new site is under construction.
        </p>
        {/* MODULE 0: change this line */}
        <p
          data-testid="week-0-line"
          className="bg-secondary text-secondary-foreground rounded-lg px-4 py-2"
        >
          Week 0 check-in: Hi, How are you doing today!?
        </p>
      </main>
      <SiteFooter />
    </>
  );
}
