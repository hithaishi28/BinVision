import { CATEGORY_META, type WasteCategory } from "@/lib/detection";
import { cn } from "@/lib/utils";

const styles: Record<WasteCategory, string> = {
  recyclable: "bg-recyclable/10 text-recyclable",
  organic: "bg-organic/10 text-organic",
  hazardous: "bg-hazardous/10 text-hazardous",
};

const dotStyles: Record<WasteCategory, string> = {
  recyclable: "bg-recyclable",
  organic: "bg-organic",
  hazardous: "bg-hazardous",
};

export function CategoryBadge({
  category,
  className,
}: {
  category: WasteCategory;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold",
        styles[category],
        className,
      )}
    >
      {CATEGORY_META[category].label}
    </span>
  );
}

export function CategoryDot({ category }: { category: WasteCategory }) {
  return (
    <span
      aria-hidden
      className={cn("size-2.5 shrink-0 rounded-full", dotStyles[category])}
    />
  );
}
