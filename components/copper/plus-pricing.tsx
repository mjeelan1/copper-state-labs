import { CheckIcon, XIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  formatMemory,
  formatNotesHours,
  formatUsd,
  getPlans,
} from "@/lib/copper/catalog";
import { cn } from "@/lib/utils";

// Free vs. Copper Plus, one card each, side by side; stacked on phones. Every
// price and plan detail comes from the catalog. Copper Plus is highlighted in
// Copper.
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
        <div className="mt-10 grid gap-6 md:grid-cols-2">
          {plans.map((plan) => {
            const highlighted = plan.id === "copper-plus";
            return (
              <Card
                key={plan.id}
                data-plan={plan.id}
                className={cn("pt-0", highlighted && "ring-primary ring-2")}
              >
                <CardHeader
                  className={cn(
                    "border-b pt-(--card-spacing)",
                    highlighted && "bg-primary text-primary-foreground",
                  )}
                >
                  <CardTitle>
                    <h3 className="text-xl font-bold">{plan.name}</h3>
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col gap-6">
                  <div>
                    <p>
                      <span className="text-4xl font-bold">
                        {formatUsd(plan.monthlyUsd)}
                      </span>
                      <span className="text-muted-foreground">/month</span>
                    </p>
                    <p className="text-muted-foreground mt-1">
                      {plan.monthlyUsd > 0
                        ? `or ${formatUsd(plan.annualUsd)}/year`
                        : "Included with your Copper device"}
                    </p>
                  </div>
                  <dl className="divide-y">
                    <PlanRow label="Household Memory kept">
                      {formatMemory(plan.memoryDays)}
                    </PlanRow>
                    <PlanRow label="Copper Notes recording">
                      {formatNotesHours(plan.notesHoursPerMonth)}
                    </PlanRow>
                    <PlanRow
                      label="Refined answers"
                      note="Frontier models for complex questions and planning"
                    >
                      {plan.refinedAnswers ? (
                        <CheckIcon
                          aria-hidden
                          className="text-primary size-4"
                        />
                      ) : (
                        <XIcon
                          aria-hidden
                          className="text-muted-foreground size-4"
                        />
                      )}
                      {plan.refinedAnswers ? "Included" : "Not included"}
                    </PlanRow>
                  </dl>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function PlanRow({
  label,
  note,
  children,
}: {
  label: string;
  note?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4 py-3">
      <dt className="text-muted-foreground">
        {label}
        {note && <span className="block text-xs">{note}</span>}
      </dt>
      <dd className="flex shrink-0 items-center gap-1.5 text-right font-medium">
        {children}
      </dd>
    </div>
  );
}
