import Image from "next/image";
import { cn } from "@/lib/utils";

const WIDTH = 1200;
const HEIGHT = 197;

// Two versions of the same logo: the wordmark is Night Sky in light mode and
// Desert Sand in dark mode. CSS picks one, so there's no flash on load.
// `onDark` always shows the Desert Sand version, for backgrounds that are dark
// in both modes (the footer).
export function Logo({
  className,
  onDark = false,
}: {
  className?: string;
  onDark?: boolean;
}) {
  if (onDark) {
    return (
      <span className={cn("inline-block", className)}>
        <Image
          src="/brand/logo-dark.png"
          alt="Copper State Labs"
          width={WIDTH}
          height={HEIGHT}
          className="h-auto w-full"
        />
      </span>
    );
  }
  return (
    <span className={cn("inline-block", className)}>
      <Image
        src="/brand/logo.png"
        alt="Copper State Labs"
        width={WIDTH}
        height={HEIGHT}
        priority
        className="h-auto w-full dark:hidden"
      />
      <Image
        src="/brand/logo-dark.png"
        alt="Copper State Labs"
        width={WIDTH}
        height={HEIGHT}
        priority
        className="hidden h-auto w-full dark:block"
      />
    </span>
  );
}
