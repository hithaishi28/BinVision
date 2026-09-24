import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { clearAnalyses, useAnalyses } from "@/lib/analysis-store";
import { PageHeader, CategoryLegend } from "@/components/binvision/app-shell";
import { BBoxOverlay } from "@/components/binvision/bbox-overlay";
import { DetectionList, CategorySummary } from "@/components/binvision/detection-list";
import { ModelLimitNote } from "@/components/binvision/model-limit-note";
import { openAssistant, setAssistantContext } from "@/lib/chat-store";

export const Route = createFileRoute("/results")({
  head: () => ({
    meta: [
      { title: "Detection Results — BinVision" },
      {
        name: "description",
        content:
          "Review BinVision detection results: bounding boxes, object classes, categories, and confidence scores for analyzed waste images.",
      },
      { property: "og:title", content: "Detection Results — BinVision" },
      {
        property: "og:description",
        content:
          "Review detected waste objects with bounding boxes, categories, and confidence scores.",
      },
    ],
  }),
  component: ResultsPage,
});

function ResultsPage() {
  const analyses = useAnalyses();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [view, setView] = useState<"original" | "detection">("detection");

  const selected = useMemo(() => {
    if (analyses.length === 0) return undefined;
    return analyses.find((a) => a.id === selectedId) ?? analyses[0];
  }, [analyses, selectedId]);

  useEffect(() => {
    setAssistantContext(selected?.analysis, selectedIndex ?? undefined);
  }, [selected, selectedIndex]);

  return (
    <>
      <PageHeader
        eyebrow="Detection Results"
        title="Analysis history & details"
        description="Review analyses saved in this browser, with bounding boxes and per-object confidence."
        actions={<CategoryLegend />}
      />

      {analyses.length === 0 ? (
        <div className="grid place-items-center rounded-2xl border-2 border-dashed border-black/10 bg-card px-6 py-20 text-center shadow-sm">
          <div>
            <div className="mx-auto grid size-12 place-items-center rounded-full bg-accent text-primary">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="size-5"
                aria-hidden
              >
                <path d="M3 3v16a2 2 0 0 0 2 2h16" />
                <path d="m7 14 4-4 4 4 5-5" />
              </svg>
            </div>
            <p className="mt-3 font-display text-lg font-semibold">No results yet</p>
            <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
              Run your first waste analysis and the results — image, bounding boxes, and object list
              — will appear here.
            </p>
            <Link
              to="/detection"
              className="mt-4 inline-flex rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-brand-deep"
            >
              Go to Detection
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Selected analysis detail */}
          <section className="lg:col-span-7">
            {selected && (
              <div className="rounded-2xl border border-black/5 bg-card p-5 shadow-sm">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <h2 className="truncate font-display text-lg font-semibold">
                      {selected.fileName}
                    </h2>
                    <p className="text-xs text-muted-foreground">
                      {new Date(selected.analyzedAt).toLocaleString()} ·{" "}
                      {selected.analysis.detections.length} objects detected
                    </p>
                  </div>
                  <span className="shrink-0 rounded-full bg-muted px-2.5 py-1 text-[11px] font-medium text-muted-foreground">
                    {selected.analysisMode === "api"
                      ? "YOLO API"
                      : selected.analysisMode === "mock"
                        ? "Demo run"
                        : "Saved result"}
                  </span>
                </div>
                <BBoxOverlay
                  imageUrl={selected.imageDataUrl}
                  imageWidth={selected.imageWidth}
                  imageHeight={selected.imageHeight}
                  detections={selected.analysis.detections}
                  selectedIndex={selectedIndex}
                  onSelect={setSelectedIndex}
                  mode={view}
                />
                <ModelLimitNote detections={selected.analysis.detections} />
                <div
                  className="my-3 flex rounded-lg bg-muted p-1"
                  role="group"
                  aria-label="Image view"
                >
                  {(["original", "detection"] as const).map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => setView(mode)}
                      className={`flex-1 rounded-md px-3 py-2 text-xs font-semibold ${view === mode ? "bg-card shadow-sm" : "text-muted-foreground"}`}
                    >
                      {mode === "original" ? "Original" : "AI Detection"}
                    </button>
                  ))}
                </div>
                <div className="mt-5">
                  <DetectionList
                    detections={selected.analysis.detections}
                    selectedIndex={selectedIndex}
                    onSelect={(i) => {
                      setSelectedIndex(i);
                      setView("detection");
                      setAssistantContext(selected.analysis, i);
                    }}
                  />
                </div>
                <div className="mt-4">
                  <CategorySummary detections={selected.analysis.detections} />
                </div>
                <div className="mt-5 rounded-2xl border border-emerald-900/10 bg-gradient-to-r from-emerald-50 to-white p-4 sm:flex sm:items-center sm:justify-between sm:gap-4">
                  <div>
                    <p className="font-display font-semibold">
                      Have a question about these results?
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      BinVision AI can explain categories, confidence, and safer disposal.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setAssistantContext(selected.analysis, selectedIndex ?? undefined);
                      openAssistant();
                    }}
                    className="mt-3 shrink-0 rounded-xl bg-[#10251f] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#17372c] sm:mt-0"
                  >
                    Ask BinVision AI
                  </button>
                </div>
              </div>
            )}
          </section>

          {/* History list */}
          <section className="lg:col-span-5">
            <div className="rounded-2xl border border-black/5 bg-card p-5 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="font-display text-lg font-semibold">Session history</h2>
                <button
                  type="button"
                  onClick={() => clearAnalyses()}
                  className="text-xs font-medium text-hazardous hover:underline"
                >
                  Clear history
                </button>
              </div>
              <div className="space-y-2.5">
                {analyses.map((a) => {
                  const active = selected?.id === a.id;
                  return (
                    <button
                      key={a.id}
                      type="button"
                      onClick={() => setSelectedId(a.id)}
                      className={`flex w-full items-center gap-3 rounded-xl border p-3 text-left transition-colors ${
                        active
                          ? "border-primary/40 bg-accent"
                          : "border-black/5 bg-background hover:bg-muted"
                      }`}
                    >
                      <img
                        src={a.imageDataUrl}
                        alt=""
                        className="size-11 shrink-0 rounded-lg object-cover"
                        loading="lazy"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold">{a.fileName}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(a.analyzedAt).toLocaleTimeString()} ·{" "}
                          {a.analysis.detections.length} objects
                        </p>
                      </div>
                      {active && (
                        <span className="size-2 shrink-0 rounded-full bg-primary" aria-hidden />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </section>
        </div>
      )}
    </>
  );
}
