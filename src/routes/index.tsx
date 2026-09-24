import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { CATEGORY_META, formatClassName } from "@/lib/detection";
import { useAnalyses } from "@/lib/analysis-store";
import { PageHeader, CategoryLegend } from "@/components/binvision/app-shell";
import { CategoryDot } from "@/components/binvision/category-badge";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dashboard — BinVision AI Waste Classification" },
      {
        name: "description",
        content:
          "BinVision dashboard: total detections, recyclable, organic and hazardous counts, confidence, and recent waste classification results.",
      },
      { property: "og:title", content: "Dashboard — BinVision AI Waste Classification" },
      {
        property: "og:description",
        content:
          "Track waste detection results across recyclable, organic, and hazardous categories.",
      },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const analyses = useAnalyses();

  const stats = useMemo(() => {
    const all = analyses.flatMap((a) => a.analysis.detections);
    const count = (c: keyof typeof CATEGORY_META) => all.filter((d) => d.category === c).length;
    const avgConfidence =
      all.length === 0 ? 0 : all.reduce((sum, d) => sum + d.confidence, 0) / all.length;
    return {
      total: all.length,
      recyclable: count("recyclable"),
      organic: count("organic"),
      hazardous: count("hazardous"),
      avgConfidence,
    };
  }, [analyses]);

  const chartData = [
    { name: "Recyclable", value: stats.recyclable, color: CATEGORY_META.recyclable.hex },
    { name: "Organic", value: stats.organic, color: CATEGORY_META.organic.hex },
    { name: "Hazardous", value: stats.hazardous, color: CATEGORY_META.hazardous.hex },
  ];

  const recent = analyses.slice(0, 5);

  return (
    <>
      <PageHeader
        eyebrow="Dashboard"
        title="Waste detection overview"
        description="Aggregated results from analyses saved in this browser, including runs from the configured model API."
        actions={<CategoryLegend />}
      />

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        <StatCard label="Total objects" value={String(stats.total)} accent="text-foreground" />
        <StatCard label="Recyclable" value={String(stats.recyclable)} accent="text-recyclable" />
        <StatCard label="Organic" value={String(stats.organic)} accent="text-organic" />
        <StatCard label="Hazardous" value={String(stats.hazardous)} accent="text-hazardous" />
        <StatCard
          label="Avg confidence"
          value={stats.total ? `${Math.round(stats.avgConfidence * 100)}%` : "—"}
          accent="text-primary"
        />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Category distribution */}
        <section className="lg:col-span-5">
          <div className="h-full rounded-2xl border border-black/5 bg-card p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-display text-lg font-semibold">Category distribution</h2>
              <span className="rounded-full bg-muted px-2.5 py-1 text-[11px] font-medium text-muted-foreground">
                Browser results
              </span>
            </div>
            {stats.total === 0 ? (
              <ChartEmpty message="No detections yet. Run an analysis to populate this chart." />
            ) : (
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={chartData.filter((c) => c.value > 0)}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={56}
                      outerRadius={84}
                      paddingAngle={3}
                      strokeWidth={0}
                    >
                      {chartData.map((c) => (
                        <Cell key={c.name} fill={c.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: number, name: string) => [`${value} objects`, name]}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
            <div className="mt-2 flex justify-center gap-4">
              {chartData.map((c) => (
                <span
                  key={c.name}
                  className="flex items-center gap-1.5 text-xs text-muted-foreground"
                >
                  <span className="size-2 rounded-full" style={{ backgroundColor: c.color }} />
                  {c.name}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* Objects per category bar chart */}
        <section className="lg:col-span-7">
          <div className="h-full rounded-2xl border border-black/5 bg-card p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-display text-lg font-semibold">Objects per category</h2>
              <span className="rounded-full bg-muted px-2.5 py-1 text-[11px] font-medium text-muted-foreground">
                Browser session
              </span>
            </div>
            {stats.total === 0 ? (
              <ChartEmpty message="Charts will fill automatically once analyses run." />
            ) : (
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      stroke="oklch(0.92 0.01 150)"
                    />
                    <XAxis dataKey="name" tickLine={false} axisLine={false} fontSize={12} />
                    <YAxis allowDecimals={false} tickLine={false} axisLine={false} fontSize={12} />
                    <Tooltip formatter={(value: number) => [`${value} objects`, "Count"]} />
                    <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                      {chartData.map((c) => (
                        <Cell key={c.name} fill={c.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </section>
      </div>

      {/* Recent detections */}
      <section className="mt-6">
        <div className="rounded-2xl border border-black/5 bg-card p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold">Recent detection results</h2>
            <Link
              to="/detection"
              className="rounded-lg bg-primary px-3.5 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-brand-deep"
            >
              New analysis
            </Link>
          </div>

          {recent.length === 0 ? (
            <div className="grid place-items-center rounded-xl border-2 border-dashed border-black/10 px-6 py-14 text-center">
              <div>
                <p className="font-display text-base font-semibold">No analyses yet</p>
                <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
                  Head to the Detection page, upload a waste image, and your results will show up
                  here.
                </p>
              </div>
            </div>
          ) : (
            <div className="divide-y divide-black/5">
              {recent.map((a) => (
                <div key={a.id} className="flex flex-wrap items-center gap-4 py-3">
                  <img
                    src={a.imageDataUrl}
                    alt=""
                    className="size-12 rounded-lg object-cover"
                    loading="lazy"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{a.fileName}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(a.analyzedAt).toLocaleString()} · {a.analysis.detections.length}{" "}
                      objects
                    </p>
                  </div>
                  <div className="hidden flex-wrap items-center gap-2 sm:flex">
                    {a.analysis.detections.slice(0, 4).map((d, i) => (
                      <span
                        key={i}
                        className="flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-1 text-[11px] font-medium text-muted-foreground"
                      >
                        <CategoryDot category={d.category} />
                        {formatClassName(d.class_name)} {Math.round(d.confidence * 100)}%
                      </span>
                    ))}
                  </div>
                  <Link
                    to="/results"
                    className="text-xs font-semibold text-primary hover:underline"
                  >
                    Open
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}

function StatCard({ label, value, accent }: { label: string; value: string; accent: string }) {
  return (
    <div className="rounded-2xl border border-black/5 bg-card p-4 shadow-sm">
      <p className="text-[11px] font-medium tracking-wide uppercase text-muted-foreground">
        {label}
      </p>
      <p className={`mt-2 font-display text-3xl font-bold tracking-tight ${accent}`}>{value}</p>
    </div>
  );
}

function ChartEmpty({ message }: { message: string }) {
  return (
    <div className="grid h-56 place-items-center rounded-xl border-2 border-dashed border-black/10">
      <p className="max-w-xs px-4 text-center text-sm text-muted-foreground">{message}</p>
    </div>
  );
}
