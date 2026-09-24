import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useState } from "react";
import { ANALYSIS_MODE, analyzeWasteImage, type WasteAnalysisResponse } from "@/lib/detection";
import { newAnalysisId, saveAnalysis } from "@/lib/analysis-store";
import { PageHeader } from "@/components/binvision/app-shell";
import { UploadZone, type LoadedImage } from "@/components/binvision/upload-zone";
import { BBoxOverlay } from "@/components/binvision/bbox-overlay";
import { DetectionList, CategorySummary } from "@/components/binvision/detection-list";
import { ModelLimitNote } from "@/components/binvision/model-limit-note";
import sampleWaste from "@/assets/sample-waste.jpg";
import { openAssistant, setAssistantContext } from "@/lib/chat-store";

export const Route = createFileRoute("/detection")({
  head: () => ({
    meta: [
      { title: "Waste Image Detection — BinVision" },
      { name: "description", content: "Upload and analyze a waste image with BinVision." },
    ],
  }),
  component: DetectionPage,
});
type Phase = "empty" | "ready" | "analyzing" | "done";
function DetectionPage() {
  const [image, setImage] = useState<LoadedImage | null>(null);
  const [analysis, setAnalysis] = useState<WasteAnalysisResponse | null>(null);
  const [phase, setPhase] = useState<Phase>("empty");
  const [error, setError] = useState<string | null>(null);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [view, setView] = useState<"original" | "detection">("detection");
  const onLoaded = useCallback((img: LoadedImage) => {
    setImage(img);
    setAnalysis(null);
    setSelectedIndex(null);
    setError(null);
    setPhase("ready");
  }, []);
  const useSample = useCallback(async () => {
    try {
      const response = await fetch(sampleWaste);
      const blob = await response.blob();
      const file = new File([blob], "sample-waste.jpg", { type: blob.type || "image/jpeg" });
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = () => reject(new Error("Couldn't load sample image"));
        reader.readAsDataURL(file);
      });
      const img = new Image();
      img.onload = () =>
        onLoaded({ file, dataUrl, width: img.naturalWidth, height: img.naturalHeight });
      img.onerror = () => setError("Couldn't load the demo image. Please upload a photo instead.");
      img.src = dataUrl;
    } catch {
      setError("Couldn't load the demo image. Please upload a photo instead.");
    }
  }, [onLoaded]);
  const removeImage = useCallback(() => {
    setImage(null);
    setAnalysis(null);
    setError(null);
    setSelectedIndex(null);
    setPhase("empty");
  }, []);
  const analyze = useCallback(async () => {
    if (!image) return;
    setPhase("analyzing");
    setError(null);
    setAnalysis(null);
    try {
      const response = await analyzeWasteImage(image.file);
      setAnalysis(response);
      setAssistantContext(response);
      setPhase("done");
      saveAnalysis({
        id: newAnalysisId(),
        analysisMode: ANALYSIS_MODE,
        fileName: image.file.name || "image",
        imageDataUrl: image.dataUrl,
        imageWidth: image.width,
        imageHeight: image.height,
        analyzedAt: new Date().toISOString(),
        analysis: response,
      });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Analysis failed. Please try again.");
      setPhase("ready");
    }
  }, [image]);
  return (
    <>
      <PageHeader
        eyebrow="Waste Image Detection"
        title="See waste differently."
        description="Drop in a photo and let BinVision map every visible item to its next best destination."
      />
      <div className="mb-5 flex flex-wrap items-center gap-2">
        <span className={`rounded-full px-3 py-1.5 text-xs font-semibold ${ANALYSIS_MODE === "api" ? "bg-primary/10 text-primary" : "bg-amber-100 text-amber-800"}`}>
          {ANALYSIS_MODE === "api" ? "API mode · supplied YOLO model" : "Demo mode · simulated detections"}
        </span>
        <span className="text-xs text-muted-foreground">
          {ANALYSIS_MODE === "api"
            ? "Images are analyzed by the configured local backend."
            : "No live model request is made in demo mode."}
        </span>
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <section className="lg:col-span-7">
          <div className="rounded-2xl border border-black/5 bg-card p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-display text-lg font-semibold">Your image</h2>
              <span className="text-xs text-muted-foreground">JPG · PNG · up to 10 MB</span>
            </div>
            {!image ? (
              <>
                <UploadZone onLoaded={onLoaded} onError={setError} />
                <div className="mt-4 text-center">
                  <button
                    type="button"
                    onClick={useSample}
                    className="text-sm font-semibold text-primary hover:underline"
                  >
                    Try the demo image →
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="mb-3 flex items-center justify-between">
                  <p className="truncate text-sm font-medium">{image.file.name}</p>
                  <button
                    type="button"
                    disabled={phase === "analyzing"}
                    onClick={removeImage}
                    className="text-xs font-semibold text-hazardous disabled:opacity-50"
                  >
                    Reset image
                  </button>
                </div>
                {analysis ? (
                  <>
                    <div
                      className="mb-3 flex rounded-lg bg-muted p-1"
                      role="group"
                      aria-label="Image view"
                    >
                      {(["original", "detection"] as const).map((mode) => (
                        <button
                          type="button"
                          key={mode}
                          onClick={() => setView(mode)}
                          className={`flex-1 rounded-md px-3 py-2 text-xs font-semibold transition ${view === mode ? "bg-card shadow-sm" : "text-muted-foreground"}`}
                        >
                          {mode === "original" ? "Original" : "AI Detection"}
                        </button>
                      ))}
                    </div>
                    <BBoxOverlay
                      imageUrl={image.dataUrl}
                      imageWidth={image.width}
                      imageHeight={image.height}
                      detections={analysis.detections}
                      fileName={image.file.name}
                      mode={view}
                      selectedIndex={selectedIndex}
                      onSelect={(index) => {
                        setSelectedIndex(index);
                        setAssistantContext(analysis, index);
                      }}
                    />
                    <ModelLimitNote detections={analysis.detections} />
                  </>
                ) : (
                  <div className="overflow-hidden rounded-xl bg-muted">
                    <img
                      src={image.dataUrl}
                      alt="Selected waste preview"
                      className="block max-h-[440px] w-full object-contain"
                    />
                  </div>
                )}
              </>
            )}
            {error && (
              <p
                role="alert"
                className="mt-3 rounded-lg bg-hazardous/10 px-3 py-2 text-sm font-medium text-hazardous"
              >
                {error}
              </p>
            )}
            <button
              type="button"
              onClick={analyze}
              disabled={!image || phase === "analyzing"}
              className="mt-5 w-full rounded-xl bg-ink px-4 py-3 text-sm font-semibold text-white transition hover:bg-black disabled:cursor-not-allowed disabled:opacity-50"
            >
              {phase === "analyzing" ? (
                <span className="inline-flex items-center gap-2">
                  <span className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  Scanning image…
                </span>
              ) : phase === "done" ? (
                "Analyze again"
              ) : (
                "Analyze image"
              )}
            </button>
            {phase === "analyzing" && (
              <div className="mt-4 rounded-xl bg-accent/50 p-4" role="status" aria-live="polite">
                <p className="text-sm font-semibold text-primary">Mapping visible materials</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Checking image regions and preparing a category breakdown…
                </p>
                <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-primary/15">
                  <div className="h-full w-2/3 animate-pulse rounded-full bg-primary" />
                </div>
              </div>
            )}
            <p className="mt-2 text-center text-[11px] text-muted-foreground">
              {ANALYSIS_MODE === "api"
                ? "API mode sends this image to the local YOLO backend."
                : "Demo mode uses simulated detections and does not contact a model."}
            </p>
          </div>
        </section>
        <section className="lg:col-span-5">
          <div className="rounded-2xl border border-black/5 bg-card p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-display text-lg font-semibold">Detection results</h2>
              <span className="rounded-full bg-muted px-2.5 py-1 text-[11px] font-medium text-muted-foreground">
                {analysis ? `${analysis.summary.total} objects` : "Awaiting analysis"}
              </span>
            </div>
            {phase === "analyzing" ? (
              <div className="space-y-3" aria-busy="true">
                <div className="aspect-video animate-pulse rounded-xl bg-muted" />
                {[0, 1, 2].map((i) => (
                  <div key={i} className="h-14 animate-pulse rounded-xl bg-muted" />
                ))}
              </div>
            ) : analysis ? (
              <>
                {analysis.detections.length ? (
                  <>
                    <ModelLimitNote detections={analysis.detections} />
                    <DetectionList
                      detections={analysis.detections}
                      selectedIndex={selectedIndex}
                      onSelect={(i) => {
                        setSelectedIndex(i);
                        setView("detection");
                        setAssistantContext(analysis, i);
                      }}
                    />
                    <div className="mt-4">
                      <CategorySummary detections={analysis.detections} />
                    </div>
                    <p className="mt-3 text-center text-xs text-muted-foreground">
                      Average confidence · {Math.round(analysis.summary.average_confidence * 100)}%
                    </p>
                  </>
                ) : (
                  <div className="rounded-xl border border-dashed p-8 text-center">
                    <p className="font-semibold">No objects found</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Try a clearer image with visible waste items.
                    </p>
                  </div>
                )}
                <Link
                  to="/results"
                  className="mt-4 block rounded-xl border px-4 py-2.5 text-center text-sm font-semibold hover:bg-muted"
                >
                  Explore full results →
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    setAssistantContext(analysis, selectedIndex ?? undefined);
                    openAssistant();
                  }}
                  className="mt-2 w-full rounded-xl bg-[#10251f] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#17372c]"
                >
                  Ask BinVision AI about these results
                </button>
              </>
            ) : (
              <div className="grid min-h-64 place-items-center rounded-xl border-2 border-dashed border-black/10 px-6 text-center">
                <div>
                  <div className="text-3xl">✳</div>
                  <p className="mt-2 font-display font-semibold">Your results will appear here</p>
                  <p className="mt-1 max-w-xs text-sm text-muted-foreground">
                    Upload an image or try our demo to start an analysis.
                  </p>
                </div>
              </div>
            )}
          </div>
        </section>
      </div>
    </>
  );
}
