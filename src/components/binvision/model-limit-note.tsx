import type { WasteDetection } from "@/lib/detection";

const BROAD_LABELS = new Set(["recyclable", "organic", "hazardous"]);

export function ModelLimitNote({ detections }: { detections: WasteDetection[] }) {
  if (!detections.some((detection) => BROAD_LABELS.has(detection.class_name.trim().toLowerCase()))) {
    return null;
  }

  return (
    <aside className="mb-3 rounded-lg border border-border bg-muted/60 px-3 py-2.5 text-xs leading-relaxed text-muted-foreground">
      <span className="font-semibold text-foreground">Model detail:</span> These weights return
      only broad waste groups. A battery may therefore be labeled “Recyclable”; item-level battery
      recognition requires the teammate model to return a Battery class. BinVision will not guess
      from the box location.
    </aside>
  );
}
