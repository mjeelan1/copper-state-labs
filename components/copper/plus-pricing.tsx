import { NextStep } from "@/components/copper/next-step";
import { PlanPicker } from "@/components/copper/plan-picker";
import { getPlans } from "@/lib/copper/catalog";

// Free vs. Copper Plus with a Monthly/Annual switch. The plans come from the
// catalog; PlanPicker shows them.
export function PlusPricing() {
  const plans = getPlans();
  return (
    <section data-testid="plus-pricing" id="plus" className="py-16 md:py-24">
      <div className="mx-auto max-w-5xl px-4">
        <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
          Copper Plus
        </h2>
        <p className="text-muted-foreground mt-3 text-lg">
          Refine your answers. The smartest answers and the longest memory, for
          everyone in the house.
        </p>
        <PlanPicker plans={plans} />
        <NextStep
          text="Curious what Copper keeps, and for how long?"
          href="#privacy"
          label="Read our privacy promise"
        />
      </div>
    </section>
  );
}
