import { createFileRoute, Link } from "@tanstack/react-router";
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
import { CATEGORY_META, formatClassName, summarizeDetections } from "@/lib/detection";
import { useAnalyses } from "@/lib/analysis-store";
import { PageHeader } from "@/components/binvision/app-shell";
import { CategoryDot } from "@/components/binvision/category-badge";

export const Route = createFileRoute("/analytics")({
  head: () => ({
    meta: [
      { title: "Analytics — BinVision" },
      { name: "description", content: "Session analytics for BinVision waste analyses." },
    ],
  }),
  component: AnalyticsPage,
});
function AnalyticsPage() {
  const analyses = useAnalyses();
  const detections = analyses.flatMap((run) => run.analysis.detections);
  const summary = summarizeDetections(detections);
  const categories = (["recyclable", "organic", "hazardous"] as const).map((key) => ({
    name: CATEGORY_META[key].label,
    value: summary[key],
    color: CATEGORY_META[key].hex,
  }));
  const classes = Object.entries(
    detections.reduce<Record<string, number>>((counts, detection) => {
      counts[detection.class_name] = (counts[detection.class_name] || 0) + 1;
      return counts;
    }, {}),
  )
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([name, count]) => ({ name: formatClassName(name), count }));
  return (
    <>
      <PageHeader
        eyebrow="Analytics"
        title="A clearer picture of your waste."
        description="A live summary of analyses saved in this browser session."
      />
      <div className="mb-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
        Session analytics · saved in this browser only. This is not shared backend data.
      </div>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        {[
          ["Images analyzed", analyses.length],
          ["Objects found", summary.total],
          ["Recyclable", summary.recyclable],
          ["Organic", summary.organic],
          ["Hazardous", summary.hazardous],
        ].map(([label, value]) => (
          <div key={label} className="rounded-2xl border bg-card p-4">
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="mt-1 font-display text-2xl font-bold">{value}</p>
          </div>
        ))}
      </div>
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border bg-card p-5">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold">Category distribution</h2>
            <span className="text-xs text-muted-foreground">{summary.total} total</span>
          </div>
          {summary.total ? (
            <div className="mt-3 h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categories.filter((c) => c.value)}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={65}
                    outerRadius={100}
                    paddingAngle={4}
                  >
                    {categories.map((c) => (
                      <Cell key={c.name} fill={c.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <Empty />
          )}
        </section>
        <section className="rounded-2xl border bg-card p-5">
          <h2 className="font-display text-lg font-semibold">Most detected items</h2>
          {classes.length ? (
            <div className="mt-4 h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={classes} layout="vertical" margin={{ left: 12, right: 16 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" allowDecimals={false} />
                  <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="count" fill={CATEGORY_META.recyclable.hex} radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <Empty />
          )}
        </section>
      </div>
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border bg-card p-5">
          <h2 className="font-display text-lg font-semibold">Confidence snapshot</h2>
          <p className="mt-4 font-display text-4xl font-bold">
            {summary.total ? `${Math.round(summary.average_confidence * 100)}%` : "—"}
          </p>
          <p className="text-sm text-muted-foreground">
            Average confidence across {summary.total} detections
          </p>
          <div className="mt-4 h-2 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{ width: `${summary.average_confidence * 100}%` }}
            />
          </div>
        </section>
        <section className="rounded-2xl border bg-card p-5">
          <h2 className="font-display text-lg font-semibold">Category mix</h2>
          <div className="mt-4 space-y-4">
            {categories.map((c) => (
              <div key={c.name}>
                <div className="mb-1 flex justify-between text-sm">
                  <span className="flex items-center gap-2">
                    <CategoryDot
                      category={c.name.toLowerCase() as "recyclable" | "organic" | "hazardous"}
                    />
                    {c.name}
                  </span>
                  <span>{summary.total ? Math.round((c.value / summary.total) * 100) : 0}%</span>
                </div>
                <div className="h-2 rounded-full bg-muted">
                  <div
                    className="h-2 rounded-full"
                    style={{
                      width: `${summary.total ? (c.value / summary.total) * 100 : 0}%`,
                      background: c.color,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
      <div className="mt-6 text-sm text-muted-foreground">
        Need more data?{" "}
        <Link to="/detection" className="font-semibold text-primary hover:underline">
          Analyze an image →
        </Link>
      </div>
    </>
  );
}
function Empty() {
  return (
    <div className="grid h-64 place-items-center text-center text-sm text-muted-foreground">
      <p>
        No session data yet.
        <br />
        <Link to="/detection" className="font-semibold text-primary hover:underline">
          Run your first analysis →
        </Link>
      </p>
    </div>
  );
}
