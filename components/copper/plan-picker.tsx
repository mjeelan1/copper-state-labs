"use client";

import { CheckIcon, XIcon } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  formatMemory,
  formatNotesHours,
  formatUsd,
  type Plan,
} from "@/lib/copper/catalog";
import { cn } from "@/lib/utils";

type Billing = "monthly" | "annual";

// Rounds to the cent, so 7.99 × 12 − 79 shows as $16.88.
const cents = (amount: number) => Math.round(amount * 100) / 100;
const yearlySaving = (plan: Plan) =>
  cents(plan.monthlyUsd * 12 - plan.annualUsd);
const savingPercent = (plan: Plan) =>
  Math.round((yearlySaving(plan) / (plan.monthlyUsd * 12)) * 100);

// The Monthly/Annual switch and one card per plan, side by side; stacked on
// phones. Every price comes from the plans passed in (the catalog), and a paid
// plan shows both its monthly and annual price in either view. Copper Plus is
// highlighted in Copper.
export function PlanPicker({ plans }: { plans: Plan[] }) {
  const [billing, setBilling] = useState<Billing>("monthly");
  const paid = plans.filter((plan) => plan.monthlyUsd > 0);
  const bestSaving = Math.max(0, ...paid.map(savingPercent));
  return (
    <>
      {paid.length > 0 && (
        <ButtonGroup aria-label="Billing period" className="mt-8">
          {(["monthly", "annual"] as const).map((option) => (
            <Button
              key={option}
              type="button"
              variant="outline"
              aria-pressed={billing === option}
              onClick={() => setBilling(option)}
              className={cn(
                "focus-visible:ring-ring h-11 px-5 text-base",
                billing === option &&
                  "bg-foreground text-background hover:bg-foreground/90 hover:text-background dark:bg-foreground dark:hover:bg-foreground/90",
              )}
            >
              {option === "monthly"
                ? "Monthly"
                : bestSaving > 0
                  ? `Annual · save ${bestSaving}%`
                  : "Annual"}
            </Button>
          ))}
        </ButtonGroup>
      )}
      <div className="mt-6 grid gap-6 md:grid-cols-2">
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
                <PlanPrice plan={plan} billing={billing} />
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
                      <CheckIcon aria-hidden className="text-primary size-4" />
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
    </>
  );
}

// A free plan shows $0; a paid plan leads with the chosen billing period and
// names the other one underneath.
function PlanPrice({ plan, billing }: { plan: Plan; billing: Billing }) {
  if (plan.monthlyUsd === 0) {
    return (
      <div>
        <p className="text-4xl font-bold">{formatUsd(plan.monthlyUsd)}</p>
        <p className="text-muted-foreground mt-1">
          Included with your Copper device
        </p>
      </div>
    );
  }
  const saving = yearlySaving(plan);
  return (
    <div aria-live="polite">
      {billing === "monthly" ? (
        <>
          <p>
            <span className="text-4xl font-bold">
              {formatUsd(plan.monthlyUsd)}
            </span>
            <span className="text-muted-foreground">/month</span>
          </p>
          <p className="text-muted-foreground mt-1">
            or {formatUsd(plan.annualUsd)}/year
            {saving > 0 && <> · save {formatUsd(saving)}</>}
          </p>
        </>
      ) : (
        <>
          <p>
            <span className="text-4xl font-bold">
              {formatUsd(plan.annualUsd)}
            </span>
            <span className="text-muted-foreground">/year</span>
          </p>
          <p className="text-muted-foreground mt-1">
            That’s {formatUsd(cents(plan.annualUsd / 12))}/month · or{" "}
            {formatUsd(plan.monthlyUsd)} monthly
          </p>
        </>
      )}
    </div>
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
        {note && <span className="block text-sm">{note}</span>}
      </dt>
      <dd className="flex shrink-0 items-center gap-1.5 text-right font-medium">
        {children}
      </dd>
    </div>
  );
}
