import { ArrowRightIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// The step a shopper takes at the end of a section: a short line and an outline
// link to the next section.
export function NextStep({
  text,
  href,
  label,
  className,
}: {
  text: string;
  href: string;
  label: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "mt-10 flex flex-col items-start gap-4 rounded-xl border p-6 md:flex-row md:items-center md:justify-between",
        className,
      )}
    >
      <p className="text-lg">{text}</p>
      <Button
        asChild
        size="lg"
        variant="outline"
        className="focus-visible:ring-ring h-11 shrink-0 px-5 text-base"
      >
        <a href={href}>
          {label}
          <ArrowRightIcon aria-hidden />
        </a>
      </Button>
    </div>
  );
}
