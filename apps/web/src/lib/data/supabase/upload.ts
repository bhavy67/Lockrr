"use client";

/**
 * Uploading with a progress bar.
 *
 * `storage.upload()` goes through fetch, which reports nothing until the
 * request finishes — a 20 MB scan would sit at 0% and then jump to done. The
 * upload dialog shows real progress per file, so instead we ask storage for a
 * signed upload URL and PUT to it over XMLHttpRequest, which does emit
 * progress events.
 *
 * The request body mirrors what `uploadToSignedUrl` builds for a Blob: a
 * multipart form carrying `cacheControl` and the file itself.
 */

export interface SignedUploadTarget {
  signedUrl: string;
  anonKey: string;
  accessToken: string;
}

export interface ProgressUploadOptions {
  file: File;
  target: SignedUploadTarget;
  cacheControl?: string;
  onProgress?: (fraction: number) => void;
  signal?: AbortSignal;
}

export function supportsUploadProgress(): boolean {
  return typeof XMLHttpRequest !== "undefined";
}

export function uploadWithProgress(
  options: ProgressUploadOptions,
): Promise<void> {
  const { file, target, cacheControl = "3600", onProgress, signal } = options;

  return new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", target.signedUrl, true);
    xhr.setRequestHeader("authorization", `Bearer ${target.accessToken}`);
    xhr.setRequestHeader("apikey", target.anonKey);
    xhr.setRequestHeader("x-upsert", "false");

    const body = new FormData();
    body.append("cacheControl", cacheControl);
    body.append("", file);

    const abort = () => xhr.abort();
    signal?.addEventListener("abort", abort);
    const cleanup = () => signal?.removeEventListener("abort", abort);

    if (onProgress) {
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable && event.total > 0) {
          onProgress(event.loaded / event.total);
        }
      };
    }

    xhr.onload = () => {
      cleanup();
      if (xhr.status >= 200 && xhr.status < 300) {
        onProgress?.(1);
        resolve();
        return;
      }
      reject(new Error(uploadErrorMessage(xhr.status, xhr.responseText)));
    };

    xhr.onerror = () => {
      cleanup();
      reject(new Error("The upload didn't reach the server."));
    };

    xhr.onabort = () => {
      cleanup();
      reject(new Error("Upload cancelled."));
    };

    xhr.send(body);
  });
}

/**
 * Storage returns JSON errors. Surface the message when there is one, and a
 * plain sentence when there isn't — this text reaches the upload dialog.
 */
export function uploadErrorMessage(status: number, responseText: string): string {
  try {
    const parsed = JSON.parse(responseText) as { message?: string; error?: string };
    const message = parsed.message ?? parsed.error;
    if (message) return message;
  } catch {
    // Not JSON — fall through to the status-based message.
  }
  if (status === 413) return "That file is too large.";
  if (status === 409) return "A file already exists at that path.";
  return `Upload failed (${status}).`;
}
