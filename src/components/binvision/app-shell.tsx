import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { ANALYSIS_MODE } from "@/lib/detection";

const NAV = [
  { to: "/", label: "Dashboard" },
  { to: "/detection", label: "Detection" },
  { to: "/results", label: "Results" },
  { to: "/analytics", label: "Analytics" },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background font-sans text-foreground antialiased">
      <header className="sticky top-0 z-20 border-b border-black/5 bg-card/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3.5 sm:px-6">
          <Link to="/" className="flex items-center gap-2.5">
            <span className="grid size-9 place-items-center rounded-lg bg-primary font-display text-lg font-bold text-primary-foreground">
              B
            </span>
            <span className="leading-tight">
              <span className="block font-display text-[15px] font-bold tracking-tight">
                BinVision
              </span>
              <span className="block text-[11px] text-muted-foreground">
                AI Waste Classification
              </span>
            </span>
          </Link>

          <nav className="hidden items-center gap-1 md:flex">
            {NAV.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                activeOptions={{ exact: item.to === "/" }}
                className="rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted"
                activeProps={{
                  className:
                    "rounded-md bg-accent px-3 py-1.5 text-sm font-semibold text-accent-foreground",
                }}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <span className="hidden items-center gap-1.5 rounded-full border border-black/5 bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground sm:flex">
              <span className="size-1.5 rounded-full bg-primary" />
              {ANALYSIS_MODE === "api" ? "Model: YOLO API" : "Model: Demo mode"}
            </span>
            <span className="grid size-9 place-items-center rounded-full bg-muted text-xs font-semibold text-muted-foreground">
              M1
            </span>
          </div>
        </div>

        <nav className="flex items-center gap-1 overflow-x-auto border-t border-black/5 px-4 py-2 md:hidden">
          {NAV.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              activeOptions={{ exact: item.to === "/" }}
              className="rounded-md px-3 py-1.5 text-sm font-medium whitespace-nowrap text-muted-foreground"
              activeProps={{
                className:
                  "rounded-md bg-accent px-3 py-1.5 text-sm font-semibold whitespace-nowrap text-accent-foreground",
              }}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">{children}</main>

      <footer className="mx-auto max-w-7xl px-4 pb-8 sm:px-6">
        <p className="text-[11px] text-muted-foreground">
          BinVision — software-only waste classification. {ANALYSIS_MODE === "api"
            ? "Analysis uses the configured local API and supplied model weights."
            : "Analysis uses simulated demo data; configure the API to run the supplied model."}
        </p>
      </footer>
    </div>
  );
}

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <p className="text-xs font-semibold tracking-[0.15em] uppercase text-primary">
          {eyebrow}
        </p>
        <h1 className="mt-1 font-display text-3xl font-bold tracking-tight">
          {title}
        </h1>
        {description ? (
          <p className="mt-1 max-w-xl text-sm text-muted-foreground">
            {description}
          </p>
        ) : null}
      </div>
      {actions}
    </div>
  );
}

export function CategoryLegend() {
  return (
    <div className="flex items-center gap-2">
      <span className="rounded-full bg-recyclable/10 px-3 py-1 text-xs font-semibold text-recyclable">
        Recyclable
      </span>
      <span className="rounded-full bg-organic/10 px-3 py-1 text-xs font-semibold text-organic">
        Organic
      </span>
      <span className="rounded-full bg-hazardous/10 px-3 py-1 text-xs font-semibold text-hazardous">
        Hazardous
      </span>
    </div>
  );
}
