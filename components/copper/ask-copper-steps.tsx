"use client";

// One Ask Copper answer, drawn as stations on a rail in the order they
// happened: the tools on offer, Copper's thinking, each tool call (what Copper
// sent and what came back), what's happening now, then the reply. The layout
// is described in specs/module-2/spec.md, section 5.
import {
  BrainIcon,
  ListIcon,
  TriangleAlertIcon,
  WrenchIcon,
} from "lucide-react";
import type { ReactNode } from "react";
import { Spinner } from "@/components/ui/spinner";
import {
  type Progress,
  type Step,
  TOOL_LABELS,
  type ToolStep,
} from "@/lib/copper/assistant/progress";
import { formatUsd, getPlans, getProducts } from "@/lib/copper/catalog";
import { cn } from "@/lib/utils";

const TOOL_NAMES = Object.keys(TOOL_LABELS);

const isTool = (step: Step): step is ToolStep => step.type === "tool";

/** What the "what's happening now" station says while Copper works. */
export function statusLine(progress: Progress, useTools: boolean): string {
  if (progress.reply) return "Writing the answer…";
  if (!useTools) return "Answering from memory…";
  return progress.steps.length > 0
    ? "Deciding what to do next…"
    : "Reading your question…";
}

/** "2026-11-14" → "Nov 14, 2026". Anything else is shown as it is. */
export function formatRestockDate(date: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return date;
  return new Date(`${date}T00:00:00Z`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

/** Gemini writes **bold** and `code`; show them instead of the marks. */
function inline(text: string): ReactNode[] {
  return text.split(/(\*\*[^*]+\*\*|`[^`]+`)/).map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**") && part.length > 4)
      return <strong key={i}>{part.slice(2, -2)}</strong>;
    if (part.startsWith("`") && part.endsWith("`") && part.length > 2)
      return (
        <code key={i} className="bg-background/60 rounded px-1 font-mono">
          {part.slice(1, -1)}
        </code>
      );
    return part;
  });
}

/** Paragraphs of lightly formatted text; `trailing` goes at the very end. */
export function Markdown({
  text,
  trailing,
}: {
  text: string;
  trailing?: ReactNode;
}) {
  const paragraphs = text.split(/\n{2,}/);
  return paragraphs.map((paragraph, i) => (
    <p key={i} className="whitespace-pre-line [&+p]:mt-2">
      {inline(paragraph)}
      {i === paragraphs.length - 1 && trailing}
    </p>
  ));
}

function Label({ children }: { children: ReactNode }) {
  return (
    <p className="text-muted-foreground text-xs font-semibold tracking-widest uppercase">
      {children}
    </p>
  );
}

/** A station: a round node on the rail, a label, and what it shows. */
function Station({
  icon,
  nodeClassName,
  label,
  children,
}: {
  icon: ReactNode;
  nodeClassName: string;
  label?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <li className="relative">
      <span
        aria-hidden
        className={cn(
          "ring-secondary absolute top-0 -left-8 flex size-6 items-center justify-center rounded-full ring-4 [&_svg]:size-3.5",
          nodeClassName,
        )}
      >
        {icon}
      </span>
      {label && <Label>{label}</Label>}
      {children && <div className={cn(label && "mt-2")}>{children}</div>}
    </li>
  );
}

export function Answer({
  progress,
  useTools,
}: {
  progress: Progress;
  useTools: boolean;
}) {
  const toolSteps = progress.steps.filter(isTool);
  const used = new Set(toolSteps.map((step) => step.name));
  const working = progress.status === "working";
  return (
    <div>
      <ol className="relative flex flex-col gap-5 pl-8">
        <span
          aria-hidden
          className={cn(
            "absolute top-3 bottom-3 left-[11px] w-0.5 rounded-full",
            useTools
              ? "from-primary via-accent to-accent bg-linear-to-b"
              : "bg-chart-3",
          )}
        />
        <ToolsOnOffer used={used} useTools={useTools} />
        {progress.steps.map((step, i) =>
          isTool(step) ? (
            <Station
              key={step.id}
              icon={<WrenchIcon />}
              nodeClassName="bg-accent text-accent-foreground"
              label={
                step.state === "calling"
                  ? "Copper is calling a tool"
                  : "Copper called a tool"
              }
            >
              <ToolCard step={step} number={toolSteps.indexOf(step) + 1} />
            </Station>
          ) : (
            <Station
              key={i}
              icon={<BrainIcon />}
              nodeClassName={
                useTools
                  ? "bg-primary text-primary-foreground"
                  : "bg-chart-3 text-accent-foreground"
              }
              label="Copper is thinking"
            >
              <div
                data-testid="thinking"
                className="text-muted-foreground border-border border-l-2 pl-3 italic"
              >
                <Markdown text={step.text} />
              </div>
            </Station>
          ),
        )}
        {working && (
          <Station
            icon={
              <span className="flex gap-0.5">
                {[0, 150, 300].map((delay) => (
                  <span
                    key={delay}
                    className="bg-background size-1 animate-bounce rounded-full"
                    style={{ animationDelay: `${delay}ms` }}
                  />
                ))}
              </span>
            }
            nodeClassName="bg-foreground animate-pulse"
          >
            <p className="text-muted-foreground pt-0.5">
              {statusLine(progress, useTools)}
            </p>
          </Station>
        )}
      </ol>
      {(progress.reply || !working) && (
        <Reply progress={progress} useTools={useTools} />
      )}
    </div>
  );
}

/** Station 1: the menu of tools the model was handed, with the used ones filled in. */
function ToolsOnOffer({
  used,
  useTools,
}: {
  used: Set<string>;
  useTools: boolean;
}) {
  if (!useTools) {
    return (
      <Station
        icon={<ListIcon />}
        nodeClassName="bg-chart-3 text-accent-foreground"
        label="Tools given to Copper: none"
      >
        <ul className="flex flex-wrap gap-1.5">
          {TOOL_NAMES.map((name) => (
            <li
              key={name}
              className="text-muted-foreground font-mono text-sm line-through"
            >
              {name}
            </li>
          ))}
        </ul>
        <p className="text-muted-foreground mt-1">
          Copper has to answer from memory alone.
        </p>
      </Station>
    );
  }
  return (
    <Station
      icon={<ListIcon />}
      nodeClassName="bg-accent text-accent-foreground"
      label="Tools Copper can use"
    >
      <ul className="flex flex-wrap gap-1.5">
        {TOOL_NAMES.map((name) => (
          <li
            key={name}
            className={cn(
              "rounded-full px-2 py-0.5 font-mono text-sm",
              used.has(name)
                ? "bg-accent text-accent-foreground font-bold"
                : "border-border text-muted-foreground bg-background/60 border",
            )}
          >
            {name}
          </li>
        ))}
      </ul>
    </Station>
  );
}

/** Station 3's card: always open, input above, result below. */
function ToolCard({ step, number }: { step: ToolStep; number: number }) {
  return (
    <div
      data-testid="tool-call"
      data-tool={step.name}
      className="bg-card text-card-foreground overflow-hidden rounded-lg border"
    >
      <div className="bg-accent text-accent-foreground flex flex-wrap items-center gap-2 px-3 py-2">
        <span className="font-mono font-bold">{step.name}()</span>
        <span className="rounded-full bg-white/60 px-2 text-sm">
          tool {number}
        </span>
        <span className="ml-auto text-sm">{TOOL_LABELS[step.name] ?? ""}</span>
      </div>
      <div className="px-3 py-3">
        <Label>→ What Copper sent</Label>
        <div className="mt-2">
          <Sent step={step} />
        </div>
      </div>
      <div className="bg-accent/10 border-t px-3 py-3">
        <Label>← What came back</Label>
        <div className="mt-2">
          <CameBack step={step} />
        </div>
      </div>
    </div>
  );
}

const productName = (id: unknown) =>
  getProducts().find((product) => product.id === id)?.name ?? String(id);
const planName = (id: unknown) =>
  getPlans().find((plan) => plan.id === id)?.name ?? String(id);
const asRecord = (value: unknown): Record<string, unknown> =>
  value && typeof value === "object" ? (value as Record<string, unknown>) : {};

/** The tool's input as a labelled list, never raw JSON. */
function sentRows(name: string, input: unknown): [string, string][] {
  const fields = asRecord(input);
  if (name === "calculate_cost") {
    const products = Array.isArray(fields.products) ? fields.products : [];
    return [
      ["Products", products.map(productName).join(", ") || "None"],
      ["Plan", planName(fields.plan)],
      ["Billing", String(fields.billing ?? "")],
      ["Years", String(fields.years ?? "")],
    ];
  }
  if (name === "check_availability") {
    return [
      ["Product", productName(fields.product)],
      ["Color", fields.color ? String(fields.color) : "Every color"],
    ];
  }
  return Object.entries(fields).map(([key, value]) => [
    key.charAt(0).toUpperCase() + key.slice(1),
    Array.isArray(value) ? value.join(", ") : String(value),
  ]);
}

function Sent({ step }: { step: ToolStep }) {
  if (step.name === "get_prices")
    return <p>Nothing, it just asked for the price list</p>;
  if (step.name === "get_products")
    return <p>Nothing, it just asked what Copper sells</p>;
  if (step.input === undefined)
    return (
      <p className="text-muted-foreground italic">filling in the details…</p>
    );
  const rows = sentRows(step.name, step.input);
  if (rows.length === 0) return <p>Nothing</p>;
  return (
    <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1">
      {rows.map(([label, value]) => (
        <div key={label} className="contents">
          <dt className="text-muted-foreground">{label}</dt>
          <dd className="font-medium">{value}</dd>
        </div>
      ))}
    </dl>
  );
}

type Cost = { lines: { item: string; usd: number }[]; totalUsd: number };
type ProductList = {
  products: {
    name: string;
    type: string;
    priceUsd: number;
    colors: string[];
  }[];
};
type Prices = {
  products: { name: string; priceUsd: number }[];
  plans: { name: string; monthlyUsd: number; annualUsd: number }[];
};
type Availability =
  | {
      status: "ok";
      product: string;
      colors: { color: string; stock: string; restockDate: string | null }[];
    }
  | { status: "not_a_color"; product: string; color: string; colors: string[] }
  | { status: "unavailable"; message: string };

const has = (value: unknown, key: string) => key in asRecord(value);

function CameBack({ step }: { step: ToolStep }) {
  if (step.state === "calling") {
    return (
      <p className="text-muted-foreground flex items-center gap-2">
        <Spinner /> the app is running the code…
      </p>
    );
  }
  if (step.state === "error") return <p>{String(step.output)}</p>;
  const output = step.output;
  if (step.name === "calculate_cost" && has(output, "totalUsd"))
    return <CostResult cost={output as Cost} />;
  if (step.name === "get_products" && has(output, "products"))
    return <ProductsResult list={output as ProductList} />;
  if (step.name === "get_prices" && has(output, "plans"))
    return <PricesResult prices={output as Prices} />;
  if (step.name === "check_availability" && has(output, "status"))
    return <AvailabilityResult availability={output as Availability} />;
  return (
    <p className="font-mono text-sm break-all">{JSON.stringify(output)}</p>
  );
}

function CostResult({ cost }: { cost: Cost }) {
  return (
    <div>
      <ul className="flex flex-col gap-1">
        {cost.lines.map((line, i) => (
          <li key={i} className="flex justify-between gap-4">
            <span>{line.item}</span>
            <span className="font-medium tabular-nums">
              {formatUsd(line.usd)}
            </span>
          </li>
        ))}
      </ul>
      <div className="mt-2 flex items-baseline justify-between border-t pt-2">
        <span className="font-semibold">Total</span>
        <span className="text-primary text-2xl font-bold tabular-nums">
          {formatUsd(cost.totalUsd)}
        </span>
      </div>
    </div>
  );
}

function ProductsResult({ list }: { list: ProductList }) {
  return (
    <ul className="flex flex-col gap-3">
      {list.products.map((product) => (
        <li key={product.name}>
          <p className="flex justify-between gap-4 font-medium">
            <span>{product.name}</span>
            <span className="tabular-nums">{formatUsd(product.priceUsd)}</span>
          </p>
          <p className="text-muted-foreground text-sm">{product.type}</p>
          <ul className="mt-1 flex flex-wrap gap-1">
            {product.colors.map((color) => (
              <li
                key={color}
                className="border-accent/40 bg-accent/15 rounded-full border px-2 text-sm"
              >
                {color}
              </li>
            ))}
          </ul>
        </li>
      ))}
    </ul>
  );
}

function PricesResult({ prices }: { prices: Prices }) {
  const rows: [string, string][] = [
    ...prices.products.map((p): [string, string] => [
      p.name,
      formatUsd(p.priceUsd),
    ]),
    ...prices.plans
      .filter((plan) => plan.monthlyUsd > 0)
      .map((plan): [string, string] => [
        plan.name,
        `${formatUsd(plan.monthlyUsd)}/mo · ${formatUsd(plan.annualUsd)}/yr`,
      ]),
  ];
  return (
    <ul className="flex flex-col gap-1">
      {rows.map(([name, price]) => (
        <li key={name} className="flex justify-between gap-4">
          <span>{name}</span>
          <span className="font-medium tabular-nums">{price}</span>
        </li>
      ))}
    </ul>
  );
}

const STOCK_PILLS: Record<string, { label: string; className: string }> = {
  in_stock: { label: "In stock", className: "bg-accent" },
  low_stock: { label: "Low stock", className: "bg-chart-4" },
  backordered: { label: "Back-ordered", className: "bg-chart-3" },
};

function AvailabilityResult({ availability }: { availability: Availability }) {
  if (availability.status === "unavailable")
    return <p>{availability.message}</p>;
  if (availability.status === "not_a_color") {
    return (
      <p>
        {availability.product} doesn’t come in {availability.color}. It comes in{" "}
        {listOf(availability.colors)}.
      </p>
    );
  }
  if (availability.colors.length === 0)
    return <p>No stock rows for {availability.product}.</p>;
  return (
    <ul className="flex flex-col gap-1.5">
      {availability.colors.map(({ color, stock, restockDate }) => {
        const pill = STOCK_PILLS[stock] ?? {
          label: stock,
          className: "bg-muted",
        };
        return (
          <li key={color} className="flex items-center justify-between gap-4">
            <span>{color}</span>
            <span
              className={cn(
                "text-accent-foreground rounded-full px-2 text-sm font-medium",
                pill.className,
              )}
            >
              {pill.label}
              {stock === "backordered" &&
                restockDate &&
                ` until ${formatRestockDate(restockDate)}`}
            </span>
          </li>
        );
      })}
    </ul>
  );
}

const listOf = (items: string[]) =>
  items.length < 2
    ? items.join("")
    : `${items.slice(0, -1).join(", ")} and ${items.at(-1)}`;

/** The reply: a chat bubble below the rail that types itself out. */
function Reply({
  progress,
  useTools,
}: {
  progress: Progress;
  useTools: boolean;
}) {
  const typing = progress.status === "working";
  return (
    <div className="bg-card text-card-foreground mt-3 rounded-2xl rounded-tl-sm border p-3 shadow-xs">
      <p className="text-primary text-sm font-semibold">Copper</p>
      {!useTools && (
        <div className="border-chart-3 bg-chart-3/10 mt-2 rounded-lg border p-2 text-sm">
          <p className="flex items-center gap-1.5 font-semibold">
            <TriangleAlertIcon aria-hidden className="text-chart-3 size-4" />
            Answered without tools: may be made up
          </p>
          <p className="text-muted-foreground mt-1">
            With tools off, Copper can’t see today’s prices or stock. The AI
            only has what it learned in training, so it fills the gaps with
            guesses that sound right. That’s a hallucination.
          </p>
        </div>
      )}
      <div className="mt-2">
        <Markdown
          text={progress.reply}
          trailing={
            typing ? (
              <span
                aria-hidden
                className="bg-primary ml-0.5 inline-block h-4 w-1.5 animate-pulse align-text-bottom"
              />
            ) : null
          }
        />
      </div>
    </div>
  );
}
