import { CATEGORY_META, formatClassName, type WasteDetection } from "@/lib/detection";

export function BBoxOverlay({
  imageUrl,
  imageWidth,
  imageHeight,
  detections,
  fileName,
  selectedIndex,
  onSelect,
  mode = "detection",
}: {
  imageUrl: string;
  imageWidth: number;
  imageHeight: number;
  detections: WasteDetection[];
  fileName?: string;
  selectedIndex?: number | null;
  onSelect?: (index: number) => void;
  mode?: "original" | "detection";
}) {
  return (
    <div className="relative overflow-hidden rounded-xl bg-ink">
      <img
        src={imageUrl}
        alt="Analyzed waste"
        className="block max-h-[520px] w-full object-contain"
        width={imageWidth}
        height={imageHeight}
      />
      {mode === "detection" &&
        detections.map((d, i) => {
          const [x1, y1, x2, y2] = d.bbox;
          const color = CATEGORY_META[d.category]?.hex ?? "#0d9488";
          return (
            <button
              key={`${d.class_name}-${i}`}
              type="button"
              aria-label={`Highlight ${formatClassName(d.class_name)}`}
              aria-pressed={selectedIndex === i}
              onClick={() => onSelect?.(i)}
              className={`absolute rounded-sm border-2 transition-all ${selectedIndex === i ? "z-10 shadow-[0_0_0_3px_rgba(255,255,255,.8)]" : "hover:z-10 hover:shadow-[0_0_0_2px_rgba(255,255,255,.65)]"}`}
              style={{
                left: `${(x1 / imageWidth) * 100}%`,
                top: `${(y1 / imageHeight) * 100}%`,
                width: `${((x2 - x1) / imageWidth) * 100}%`,
                height: `${((y2 - y1) / imageHeight) * 100}%`,
                borderColor: color,
                backgroundColor: selectedIndex === i ? `${color}20` : "transparent",
              }}
            >
              <span
                className="absolute -top-5 left-0 rounded px-1.5 py-0.5 text-[10px] font-semibold whitespace-nowrap text-white"
                style={{ backgroundColor: color }}
              >
                {i + 1} · {formatClassName(d.class_name)} {Math.round(d.confidence * 100)}%
              </span>
            </button>
          );
        })}
      {fileName && (
        <span className="absolute top-3 left-3 rounded-md bg-black/60 px-2 py-1 text-[10px] font-medium text-white">
          {fileName}
        </span>
      )}
    </div>
  );
}
