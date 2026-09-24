import { useCallback, useRef, useState } from "react";

const ACCEPT = ["image/jpeg", "image/jpg", "image/png"];

export interface LoadedImage {
  file: File;
  dataUrl: string;
  width: number;
  height: number;
}

export function UploadZone({
  onLoaded,
  onError,
  disabled,
}: {
  onLoaded: (img: LoadedImage) => void;
  onError: (message: string) => void;
  disabled?: boolean;
}) {
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(
    (file: File | undefined) => {
      if (!file) return;
      if (!ACCEPT.includes(file.type)) {
        onError("Unsupported file. Please use a JPG, JPEG or PNG image.");
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        onError("That image is larger than 10 MB. Please choose a smaller file.");
        return;
      }
      const reader = new FileReader();
      reader.onerror = () => onError("We couldn't read that file. Please try again.");
      reader.onload = () => {
        const dataUrl = String(reader.result);
        const img = new Image();
        img.onload = () =>
          onLoaded({
            file,
            dataUrl,
            width: img.naturalWidth,
            height: img.naturalHeight,
          });
        img.onerror = () => onError("That file doesn't look like a valid image.");
        img.src = dataUrl;
      };
      reader.readAsDataURL(file);
    },
    [onError, onLoaded],
  );

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        if (!disabled) setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragging(false);
        if (disabled) return;
        handleFile(e.dataTransfer.files?.[0]);
      }}
      className={`rounded-xl border-2 border-dashed p-8 text-center transition-colors ${
        dragging
          ? "border-primary bg-primary/10"
          : "border-primary/30 bg-primary/[0.03]"
      } ${disabled ? "opacity-60" : ""}`}
    >
      <div className="mx-auto grid size-12 place-items-center rounded-full bg-primary/10 text-primary">
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
          <path d="M12 19V5" />
          <path d="m5 12 7-7 7 7" />
        </svg>
      </div>
      <p className="mt-3 font-display text-base font-semibold">Upload Waste Image</p>
      <p className="mt-1 text-sm text-muted-foreground">
        Drag &amp; drop or browse a file
      </p>
      <button
        type="button"
        disabled={disabled}
        onClick={() => inputRef.current?.click()}
        className="mt-4 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-brand-deep focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed"
      >
        Browse files
      </button>
      <input
        ref={inputRef}
        type="file"
        accept=".jpg,.jpeg,.png,image/jpeg,image/png"
        className="sr-only"
        onChange={(e) => {
          handleFile(e.target.files?.[0]);
          e.target.value = "";
        }}
      />
    </div>
  );
}
