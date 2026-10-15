"use client";

import { AlertCircle, Download, ExternalLink } from "lucide-react";
import { useCallback, useState } from "react";
import { Button } from "@/components/ui/button";
import { nativeLinkHandler } from "@/lib/save-file";
import { PdfPages } from "./pdf-pages";

interface Props {
  url: string;
  fileName: string;
}

export function PdfPreview({ url, fileName }: Props) {
  const [failed, setFailed] = useState(false);
  const fail = useCallback(() => setFailed(true), []);
  // Only mounted once the blob URL exists, i.e. on the client — safe to read
  // navigator during render. False in Android's WebView and mobile Chrome.
  const [hasViewer] = useState(() => navigator.pdfViewerEnabled !== false);

  return (
    <div className="relative h-full w-full">
      {failed ? (
        <PdfFallback url={url} fileName={fileName} />
      ) : !hasViewer ? (
        <PdfPages url={url} fileName={fileName} onError={fail} />
      ) : (
        <object
          data={`${url}#toolbar=0&navpanes=0`}
          type="application/pdf"
          className="h-full w-full rounded-md bg-muted"
          onError={fail}
          aria-label={`Preview of ${fileName}`}
        >
          <PdfFallback url={url} fileName={fileName} />
        </object>
      )}
    </div>
  );
}

function PdfFallback({ url, fileName }: { url: string; fileName: string }) {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-3 rounded-md bg-muted p-6 text-center">
      <AlertCircle className="h-6 w-6 text-muted-foreground" />
      <div>
        <p className="text-sm font-medium">PDF preview isn&apos;t supported here.</p>
        <p className="text-xs text-muted-foreground">
          Open the file in a new tab or download to view it.
        </p>
      </div>
      <div className="flex gap-2">
        <Button variant="outline" size="sm" asChild>
          <a
            href={url}
            target="_blank"
            rel="noreferrer"
            onClick={nativeLinkHandler(url, fileName)}
          >
            <ExternalLink className="h-3.5 w-3.5" /> Open
          </a>
        </Button>
        <Button variant="outline" size="sm" asChild>
          <a href={url} download={fileName} onClick={nativeLinkHandler(url, fileName)}>
            <Download className="h-3.5 w-3.5" /> Download
          </a>
        </Button>
      </div>
    </div>
  );
}
