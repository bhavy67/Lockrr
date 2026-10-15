"use client";

import { useEffect, useRef, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { loadPdfjs } from "@/features/extraction/extract-pdf";

// ponytail: every page is drawn up front; switch to drawing pages as they
// scroll into view if people store long (50+ page) PDFs.
const MAX_PAGES = 50;

/**
 * Draws a PDF's pages to canvases with pdf.js, for browsers with no built-in
 * PDF viewer — Android's WebView (so the native app) and mobile Chrome.
 */
export function PdfPages({ url, fileName, onError }: { url: string; fileName: string; onError: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<"loading" | "done">("loading");
  const [pageCount, setPageCount] = useState(0);

  useEffect(() => {
    const host = ref.current;
    if (!host) return;
    let cancelled = false;
    let destroy: (() => void) | undefined;

    (async () => {
      const pdfjs = await loadPdfjs();
      const task = pdfjs.getDocument(url);
      destroy = () => void task.destroy();
      const pdf = await task.promise;
      if (cancelled) return;
      setPageCount(pdf.numPages);

      const width = host.clientWidth - 16; // px-2 on each side
      const dpr = window.devicePixelRatio || 1;
      for (let n = 1; n <= Math.min(pdf.numPages, MAX_PAGES); n++) {
        const page = await pdf.getPage(n);
        if (cancelled) return;
        const viewport = page.getViewport({ scale: (width / page.getViewport({ scale: 1 }).width) * dpr });
        const canvas = document.createElement("canvas");
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        canvas.style.width = "100%";
        canvas.className = "rounded-sm bg-white shadow-subtle";
        canvas.setAttribute("aria-hidden", "true");
        await page.render({ canvasContext: canvas.getContext("2d")!, viewport }).promise;
        if (cancelled) return;
        host.appendChild(canvas);
        if (n === 1) setStatus("done");
      }
    })().catch(() => !cancelled && onError());

    return () => {
      cancelled = true;
      destroy?.();
      host.replaceChildren();
    };
  }, [url, onError]);

  return (
    <div
      role="document"
      aria-label={`Preview of ${fileName}${pageCount ? `, ${pageCount} pages` : ""}`}
      className="relative h-full w-full overflow-y-auto bg-muted"
    >
      {status === "loading" && <Skeleton className="absolute inset-2" />}
      <div ref={ref} className="flex flex-col gap-2 p-2" />
      {pageCount > MAX_PAGES && (
        <p className="p-3 text-center text-xs text-muted-foreground">
          Showing the first {MAX_PAGES} of {pageCount} pages. Download the file to see the rest.
        </p>
      )}
    </div>
  );
}
