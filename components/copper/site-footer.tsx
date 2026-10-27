import { Logo } from "@/components/copper/logo";

// Night Sky in both modes, so the logo always uses its light-on-dark version.
// On phones the logo sits above the fictional-use line.
export function SiteFooter() {
  return (
    <footer data-testid="site-footer" className="bg-night-sky text-desert-sand">
      <div className="mx-auto flex max-w-5xl flex-col items-start gap-4 px-4 py-8 md:flex-row md:items-center md:justify-between">
        <a href="#top" aria-label="Back to top">
          <Logo onDark className="w-36" />
        </a>
        <p className="text-desert-sand/70 text-sm">
          Fictional — for educational use.
        </p>
      </div>
    </footer>
  );
}
