"use client";

import { AlertCircle, Download, ExternalLink } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { nativeLinkHandler } from "@/lib/save-file";

interface Props {
  url: string;
  fileName: string;
}

export function PdfPreview({ url, fileName }: Props) {
  const [failed, setFailed] = useState(false);

  return (
    <div className="relative h-full w-full">
      {!failed ? (
        <object
          data={`${url}#toolbar=0&navpanes=0`}
          type="application/pdf"
          className="h-full w-full rounded-md bg-muted"
          onError={() => setFailed(true)}
          aria-label={`Preview of ${fileName}`}
        >
          <PdfFallback url={url} fileName={fileName} />
        </object>
      ) : (
        <PdfFallback url={url} fileName={fileName} />
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
