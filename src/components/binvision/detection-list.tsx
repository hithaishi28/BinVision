import {
  CATEGORY_META,
  formatClassName,
  summarizeDetections,
  type WasteDetection,
} from "@/lib/detection";
import { CategoryDot } from "./category-badge";

export function DetectionList({
  detections,
  selectedIndex,
  onSelect,
}: {
  detections: WasteDetection[];
  selectedIndex?: number | null;
  onSelect?: (index: number) => void;
}) {
  if (!detections.length)
    return (
      <div className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
        No objects were detected in this image. Try a clearer image with visible waste items.
      </div>
    );
  return (
    <div className="max-h-[360px] space-y-2 overflow-y-auto">
      {detections.map((d, i) => (
        <button
          key={`${d.class_name}-${i}`}
          type="button"
          onClick={() => onSelect?.(i)}
          aria-pressed={selectedIndex === i}
          className={`flex w-full items-center gap-3 rounded-xl border p-3 text-left transition-colors ${selectedIndex === i ? "border-primary/50 bg-accent" : "border-black/5 bg-background hover:bg-muted"}`}
        >
          <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-muted text-xs font-bold">
            {i + 1}
          </span>
          <CategoryDot category={d.category} />
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-semibold">
              {formatClassName(d.class_name)}
            </span>
            <span className="text-xs text-muted-foreground">{CATEGORY_META[d.category].label}</span>
          </span>
          <span className="text-sm font-semibold">{Math.round(d.confidence * 100)}%</span>
        </button>
      ))}
    </div>
  );
}
export function CategorySummary({ detections }: { detections: WasteDetection[] }) {
  const summary = summarizeDetections(detections);
  return (
    <div className="grid grid-cols-3 gap-2">
      {(["recyclable", "organic", "hazardous"] as const).map((key) => (
        <div key={key} className="rounded-lg bg-muted p-3 text-center">
          <p className="font-display text-xl font-bold" style={{ color: CATEGORY_META[key].hex }}>
            {summary[key]}
          </p>
          <p className="text-[11px] font-medium text-muted-foreground">
            {CATEGORY_META[key].label}
          </p>
        </div>
      ))}
    </div>
  );
}
