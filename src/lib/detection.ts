/** Stable API contract shared by the UI and future inference service. */
export type WasteCategory = "recyclable" | "organic" | "hazardous";
export const ANALYSIS_MODE: "api" | "mock" =
  import.meta.env["VITE_ANALYSIS_MODE"] === "api" ? "api" : "mock";
export interface WasteDetection {
  class_name: string;
  category: WasteCategory;
  confidence: number;
  /** [x1, y1, x2, y2], in original image pixels */
  bbox: [number, number, number, number];
}
export interface WasteAnalysisResponse {
  image_id: string;
  detections: WasteDetection[];
  summary: {
    total: number;
    recyclable: number;
    organic: number;
    hazardous: number;
    average_confidence: number;
  };
}
export type Detection = WasteDetection;
export const CATEGORY_META: Record<WasteCategory, { label: string; hex: string }> = {
  recyclable: { label: "Recyclable", hex: "#0d9488" },
  organic: { label: "Organic", hex: "#ca8a04" },
  hazardous: { label: "Hazardous", hex: "#dc2626" },
};
export const CATEGORIES: WasteCategory[] = ["recyclable", "organic", "hazardous"];
export function formatClassName(name: string): string {
  return name
    .split(/[\s_]+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}
export function summarizeDetections(
  detections: WasteDetection[],
): WasteAnalysisResponse["summary"] {
  const summary = {
    total: detections.length,
    recyclable: 0,
    organic: 0,
    hazardous: 0,
    average_confidence: 0,
  };
  for (const d of detections) {
    summary[d.category] += 1;
    summary.average_confidence += d.confidence;
  }
  summary.average_confidence = detections.length
    ? summary.average_confidence / detections.length
    : 0;
  return summary;
}

function isWasteAnalysisResponse(value: unknown): value is WasteAnalysisResponse {
  if (!value || typeof value !== "object") return false;
  const data = value as Partial<WasteAnalysisResponse>;
  if (typeof data.image_id !== "string" || !Array.isArray(data.detections) || !data.summary)
    return false;
  const summary = data.summary;
  if (
    ![
      summary.total,
      summary.recyclable,
      summary.organic,
      summary.hazardous,
      summary.average_confidence,
    ].every(Number.isFinite)
  )
    return false;
  return data.detections.every((d) =>
    Boolean(
      d &&
      typeof d.class_name === "string" &&
      ["recyclable", "organic", "hazardous"].includes(d.category) &&
      Number.isFinite(d.confidence) &&
      d.confidence >= 0 &&
      d.confidence <= 1 &&
      Array.isArray(d.bbox) &&
      d.bbox.length === 4 &&
      d.bbox.every(Number.isFinite),
    ),
  );
}

// Mock-only inference fixture. Category mapping here is demo data; teammates must
// replace it with their reviewed model adapter/category mapper output.
const MOCK_POOL: WasteDetection[] = [
  {
    class_name: "plastic bottle",
    category: "recyclable",
    confidence: 0.94,
    bbox: [60, 70, 330, 560],
  },
  { class_name: "cardboard", category: "recyclable", confidence: 0.88, bbox: [690, 200, 980, 520] },
  {
    class_name: "aluminium can",
    category: "recyclable",
    confidence: 0.91,
    bbox: [520, 420, 660, 560],
  },
  { class_name: "banana peel", category: "organic", confidence: 0.89, bbox: [330, 40, 670, 380] },
  { class_name: "food scraps", category: "organic", confidence: 0.84, bbox: [360, 300, 610, 560] },
  { class_name: "eggshell", category: "organic", confidence: 0.82, bbox: [600, 380, 700, 500] },
  { class_name: "battery", category: "hazardous", confidence: 0.97, bbox: [640, 110, 770, 190] },
  { class_name: "paint can", category: "hazardous", confidence: 0.9, bbox: [760, 380, 940, 590] },
];
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
/** Uses the configured API in api mode; deterministic demo fixtures remain available in mock mode. */
export async function analyzeWasteImage(image: File): Promise<WasteAnalysisResponse> {
  if (!image || !image.type.startsWith("image/"))
    throw new Error("Please provide a valid image file.");
  if (ANALYSIS_MODE === "api") {
    const form = new FormData();
    form.append("image", image);
    const response = await fetch(import.meta.env["VITE_ANALYZE_ENDPOINT"] || "/api/analyze", {
      method: "POST",
      body: form,
    });
    if (!response.ok)
      throw new Error(`Analysis service returned ${response.status}. Please try again.`);
    const data: unknown = await response.json();
    if (!isWasteAnalysisResponse(data))
      throw new Error("Analysis service returned an invalid response.");
    return data;
  }
  await sleep(1150);
  const detections = [...MOCK_POOL]
    .sort(() => Math.random() - 0.5)
    .slice(0, 3 + Math.floor(Math.random() * 4));
  return {
    image_id: `demo_${Date.now().toString(36)}`,
    detections,
    summary: summarizeDetections(detections),
  };
}
